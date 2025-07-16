const User = require('../models/userModel');
const Region = require('../models/regionModel');
const Province = require('../models/provinceModel');
const City = require('../models/cityModel');
const Department = require('../models/departmentModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3001'; 

// Helper function to send email invitations
const sendInvitationEmail = async (email, role, token) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const invitationLink = `${WEB_BASE_URL}/setup-account?token=${token}`;
  const subject = `Invitation to join LifeLink as ${role}`;
  const text = `You have been invited to join LifeLink as a ${role}. Click the link below to set up your account:\n\n${invitationLink}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text,
  });
};

// Get all users with their assigned areas (for super admin)
const getAllUsersWithJurisdictions = async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedArea.region', 'name')
      .populate('assignedArea.province', 'name')
      .populate('assignedArea.city', 'name')
      .populate('assignedArea.department', 'name')
      .select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all admins by role (for super admin)
const getAdminsByRole = (role) => async (req, res) => {
  try {
    const admins = await User.find({ role })
      .populate('address.region', 'name')
      .populate('assignedArea.region', 'name')
      .populate('assignedArea.province', 'name')
      .populate('assignedArea.city', 'name')
      .populate('assignedArea.department', 'name')
      .select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${role}s` });
  }
};

// Get all regions (for dropdown)
const getAllRegions = async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json(regions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
};

// Add region admin (invitation)
const createRegionAdmin = async (req, res) => {
  try {
    const { email, region, contactNumber } = req.body;
    if (!email || !region) return res.status(400).json({ error: 'Email and region are required.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'A user with this email already exists.' });

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    const regionAdmin = await User.create({
      email,
      contactNumber,
      role: 'regionAdmin',
      address: { region },
      assignedArea: { region },
      password: null,
      invitationToken,
      invitationTokenExpires: expires,
    });

    await sendInvitationEmail(email, 'Region Admin', invitationToken);

    res.status(201).json({ message: 'Region Admin created and invitation sent.', regionAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create region admin.' });
  }
};

// Update region admin
const updateRegionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, region } = req.body;
    const admin = await User.findById(id);
    if (!admin || admin.role !== 'regionAdmin') return res.status(404).json({ error: 'Region Admin not found.' });

    admin.email = email || admin.email;
    if (region) {
      admin.address.region = region;
      admin.assignedArea.region = region;
    }
    await admin.save();
    res.status(200).json({ message: 'Region Admin updated.', admin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update region admin.' });
  }
};

// Delete region admin
const deleteRegionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findByIdAndDelete(id);
    if (!admin || admin.role !== 'regionAdmin') return res.status(404).json({ error: 'Region Admin not found.' });
    res.status(200).json({ message: 'Region Admin deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete region admin.' });
  }
};

// Get the assigned area of the region admin
const getRegionAdminAssignedArea = async (req, res) => {
  try {
    const regionAdmin = await User.findById(req.user.id ||req.user._id).select('address');
    if (!regionAdmin) {
      return res.status(404).json({ error: 'Region Admin not found' });
    }
    res.status(200).json(regionAdmin.address);
  } catch (error) {
    console.error('Error fetching Region Admin assigned area:', error);
    res.status(500).json({ error: 'Failed to fetch assigned area' });
  }
};

// Get the assigned area of the province admin
const getProvinceAdminAssignedArea = async (req, res) => {
  try {
    const provinceAdmin = await User.findById(req.user.id || req.user._id).select('address');
    if (!provinceAdmin) {
      return res.status(404).json({ error: 'Province Admin not found' });
    }
    res.status(200).json(provinceAdmin.address);
  } catch (error) {
    console.error('Error fetching Province Admin assigned area:', error);
    res.status(500).json({ error: 'Failed to fetch assigned area' });
  }
};

// Get all provinces by region ID
const getProvincesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    const provinces = await Province.find({ region: regionId });
    res.status(200).json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
};

// Create a new admin or responder via invitation
const addAdmin = async (req, res) => {
  try {
    const { email, role, assignedArea, contactNumber } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    const newAdmin = await User.create({
      email,
      role,
      assignedArea,
      contactNumber,
      invitationToken,
      invitationTokenExpires: expires,
    });

    await sendInvitationEmail(email, role, contactNumber, invitationToken);

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

const createProvinceAdmin = async (req, res) => {
  try {
    const { email, assignedArea, contactNumber } = req.body;

    if (!email || !assignedArea || !assignedArea.region || !assignedArea.province) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Ensure the province belongs to the region admin's region
    if (String(assignedArea.region) !== String(req.user.address.region)) {
      return res.status(403).json({ error: 'You can only assign provinces within your region.' });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Check if the province exists
    const provinceExists = await Province.findById(assignedArea.province);
    if (!provinceExists) {
      return res.status(400).json({ error: 'Invalid province ID.' });
    }

    // Check if the region exists
    const regionExists = await Region.findById(assignedArea.region);
    if (!regionExists) {
      return res.status(400).json({ error: 'Invalid region ID.' });
    }

    // Validate the province belongs to the region
    const validProvince = await Province.findOne({ _id: assignedArea.province, region: assignedArea.region });
    if (!validProvince) {
      return res.status(400).json({ error: 'Invalid province for the selected region.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    const provinceAdmin = await User.create({
      email,
      contactNumber,
      role: 'provinceAdmin',
      assignedArea,
      address: {
        region: assignedArea.region,
        province: assignedArea.province
      },
      password: null,
      invitationToken,
      invitationTokenExpires: expires,
    });

    // Send an invitation email
    await sendInvitationEmail(email, 'Province Admin', provinceAdmin.invitationToken);
    res.status(201).json({ message: 'Province Admin created successfully and invitation sent.', provinceAdmin }); 
  } catch (error) {
    res.status(500).json({ error: 'Failed to create province admin.' });
  }
};

// Get all province admins (Master Admin)
const getAllProvinceAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'provinceAdmin', 'assignedArea.region': req.user.address.region }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch province admins' });
  }
};

// Update a province admin
const updateProvinceAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, assignedArea } = req.body;

    // Find the province admin
    const provinceAdmin = await User.findOne({ _id: id, role: 'provinceAdmin' });
    if (!provinceAdmin) {
      return res.status(404).json({ error: 'Province Admin not found.' });
    }

    // If updating assignedArea, validate it
    if (assignedArea) {
      if (!assignedArea.region || !assignedArea.province) {
        return res.status(400).json({ error: 'Assigned area must include region and province.' });
      }
      // Optional: Validate province belongs to region
      const province = await Province.findOne({ _id: assignedArea.province, region: assignedArea.region });
      if (!province) {
        return res.status(400).json({ error: 'Invalid province for the selected region.' });
      }
      provinceAdmin.assignedArea = assignedArea;
      provinceAdmin.address = {
        region: assignedArea.region,
        province: assignedArea.province
      };
    }

    // If updating email
    if (email) {
      provinceAdmin.email = email;
    }

    await provinceAdmin.save();

    res.status(200).json({ message: 'Province Admin updated successfully.', provinceAdmin });
  } catch (error) {
    console.error('Error updating Province Admin:', error);
    res.status(500).json({ error: 'Failed to update Province Admin.' });
  }
};

// Delete a province admin
const deleteProvinceAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const provinceAdmin = await User.findById(id);
    if (!provinceAdmin || provinceAdmin.role !== 'provinceAdmin') {
      return res.status(404).json({ error: 'Province Admin not found.' });
    }

    // Use deleteOne or findByIdAndDelete
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Province Admin deleted successfully.' });
  } catch (error) {
    console.error('Error deleting Province Admin:', error);
    res.status(500).json({ error: 'Failed to delete Province Admin.' });
  }
};

// Create a new City Admin
const createCityAdmin = async (req, res) => {
  try {
    const { email, assignedArea, contactNumber } = req.body;

    // Validate input
    if (!email || !assignedArea || !assignedArea.province || !assignedArea.city) {
      return res.status(400).json({ error: 'All fields are required, including assigned area (province, city).' });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Validate the city belongs to the province
    const validCity = await City.findOne({ _id: assignedArea.city, province: assignedArea.province });
    if (!validCity) {
      return res.status(400).json({ error: 'Invalid city for the selected province.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Create the City Admin
    const cityAdmin = await User.create({
      email,
      contactNumber,
      role: 'cityAdmin',
      assignedArea,
      address: {
        region: assignedArea.region,
        province: assignedArea.province,
        city: assignedArea.city
      },
      password: null, // Password will be set during account setup
      invitationToken,
      invitationTokenExpires: expires,
    });

    // Send an invitation email
    await sendInvitationEmail(email, 'City Admin', cityAdmin.invitationToken);

    res.status(201).json({ message: 'City Admin created successfully and invitation sent.', cityAdmin });
  } catch (error) {
    console.error('Error creating City Admin:', error);
    res.status(500).json({ error: 'Failed to create City Admin.' });
  }
};

// Get all city admins (Province Admin)
const getAllCityAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'cityAdmin' }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch city admins' });
  }
};

const updateCityAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, assignedArea } = req.body;

    // Find the city admin
    const cityAdmin = await User.findOne({ _id: id, role: 'cityAdmin' });
    if (!cityAdmin) {
      return res.status(404).json({ error: 'City Admin not found.' });
    }

    // If updating assignedArea, validate it
    if (assignedArea) {
      if (!assignedArea.province || !assignedArea.city) {
        return res.status(400).json({ error: 'Assigned area must include province and city.' });
      }
      // Optional: Validate city belongs to province
      const city = await City.findOne({ _id: assignedArea.city, province: assignedArea.province });
      if (!city) {
        return res.status(400).json({ error: 'Invalid city for the selected province.' });
      }
      cityAdmin.assignedArea = assignedArea;
      cityAdmin.address = {
        province: assignedArea.province,
        city: assignedArea.city
      };
    }

    // If updating email
    if (email) {
      cityAdmin.email = email;
    }

    await cityAdmin.save();

    res.status(200).json({ message: 'City Admin updated successfully.', cityAdmin });
  } catch (error) {
    console.error('Error updating City Admin:', error);
    res.status(500).json({ error: 'Failed to update City Admin.' });
  }
};

const deleteCityAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const cityAdmin = await User.findById(id);
    if (!cityAdmin || cityAdmin.role !== 'cityAdmin') {
      return res.status(404).json({ error: 'City Admin not found.' });
    }

    // Use deleteOne or findByIdAndDelete
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'City Admin deleted successfully.' });
  } catch (error) {
    console.error('Error deleting City Admin:', error);
    res.status(500).json({ error: 'Failed to delete City Admin.' });
  }
};

// Get all department admins under a city admin (Super Admin)
const getDepartmentAdminsByCityAdmin = async (req, res) => {
  try {
    const { cityAdminId } = req.params;
    const cityAdmin = await User.findById(cityAdminId);
    if (!cityAdmin || cityAdmin.role !== 'cityAdmin') {
      return res.status(404).json({ error: 'City Admin not found' });
    }
    const departmentAdmins = await User.find({
      role: 'departmentAdmin',
      'assignedArea.city': cityAdmin.assignedArea.city
    }).select('-password');
    res.status(200).json(departmentAdmins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department admins' });
  }
};

// City Admin: CRUD for department admins
const getAllDepartmentAdmins = async (req, res) => {
  try {
    const cityAdmin = await User.findById(req.user.id);
    const departmentAdmins = await User.find({
      role: 'departmentAdmin',
      'assignedArea.city': cityAdmin.assignedArea.city
    })
      .populate('assignedArea.department')
      .select('-password');
    console.log('Fetched departmentAdmins:', JSON.stringify(departmentAdmins, null, 2));
    res.status(200).json(departmentAdmins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department admins' });
  }
};

const createDepartmentAdmin = async (req, res) => {
  try {
    const { email, department, contactNumber } = req.body;
    if (!email || !department) {
      return res.status(400).json({ error: 'Email and department are required.' });
    }

    // Get city from logged-in cityAdmin
    const cityAdmin = await User.findById(req.user.id);
    if (!cityAdmin || cityAdmin.role !== 'cityAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Make sure the department exists and belongs to the cityAdmin's city
    const deptDoc = await Department.findOne({ _id: department, city: cityAdmin.assignedArea.city });
    if (!deptDoc) {
      return res.status(400).json({ error: 'Invalid department for your city.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    const departmentAdmin = await User.create({
      email,
      contactNumber,
      role: 'departmentAdmin',
      departmentId: deptDoc._id,
      assignedArea: {
        city: cityAdmin.assignedArea.city,
        department: deptDoc._id
      },
      address: {
        city: cityAdmin.address.city
      },
      password: null,
      invitationToken,
      invitationTokenExpires: expires,
    });

    // Send invitation email (optional)
    await sendInvitationEmail(email, 'Department Admin', departmentAdmin.invitationToken);

    res.status(201).json({ message: 'Department Admin created and invitation sent.', departmentAdmin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department admin.' });
  }
};

// Get departments by city
const getDepartmentsByCity = async (req, res) => {
  try {
    const departments = await Department.find({ city: req.params.cityId });
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

const updateDepartmentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, department } = req.body;

    if (!email || !department) {
      return res.status(400).json({ error: 'Email and department are required.' });
    }

    const departmentAdmin = await User.findById(id);
    if (!departmentAdmin || departmentAdmin.role !== 'departmentAdmin') {
      return res.status(404).json({ error: 'Department Admin not found.' });
    }

    // Validate department belongs to the same city
    const deptDoc = await Department.findOne({ _id: department, city: departmentAdmin.assignedArea.city });
    if (!deptDoc) {
      return res.status(400).json({ error: 'Invalid department for this city.' });
    }

    departmentAdmin.email = email;
    departmentAdmin.assignedArea.department = deptDoc._id;
    await departmentAdmin.save();

    // Populate department for response
    await departmentAdmin.populate('assignedArea.department');

    res.status(200).json({ message: 'Department Admin updated successfully.', departmentAdmin });
  } catch (error) {
    console.error('Error updating Department Admin:', error);
    res.status(500).json({ error: 'Failed to update Department Admin.' });
  }
};

const deleteDepartmentAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const departmentAdmin = await User.findById(id);
    if (!departmentAdmin || departmentAdmin.role !== 'departmentAdmin') {
      return res.status(404).json({ error: 'Department Admin not found.' });
    }

    // Use deleteOne or findByIdAndDelete
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Department Admin deleted successfully.' });
  } catch (error) {
    console.error('Error deleting Department Admin:', error);
    res.status(500).json({ error: 'Failed to delete Department Admin.' });
  }
};

// Fetch cities dynamically based on province
const getCitiesInProvince = async (provinceId) => {
  try {
    const cities = await City.find({ province: provinceId }).select('name -_id');
    return cities.map((city) => city.name); // Return an array of city names
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

const getDepartmentsForCityAdmin = async (req, res) => {
  try {
    const cityAdmin = await User.findById(req.user.id);
    if (!cityAdmin || cityAdmin.role !== 'cityAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const departments = await Department.find({ city: cityAdmin.address.city });
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
};

const addDepartment = async (req, res) => {
  try {
    const cityAdmin = await User.findById(req.user.id).populate('address.province address.region');
    if (!cityAdmin || cityAdmin.role !== 'cityAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const { name, contactNumber, address } = req.body;
    if (!name || !contactNumber) {
      return res.status(400).json({ error: 'Name and contact number are required.' });
    }
    const department = await Department.create({
      name,
      contactNumber,
      address: address || `${name} Office, ${cityAdmin.address.city}, ${cityAdmin.address.province}, ${cityAdmin.address.region}`,
      city: cityAdmin.address.city,
      province: cityAdmin.address.province,
      region: cityAdmin.address.region
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add department.' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactNumber, address } = req.body;
    if (contactNumber && !/^09\d{9}$|^0\d{9,10}$/.test(contactNumber)) {
      return res.status(400).json({ error: 'Invalid Philippine contact number.' });
    }
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
    // Optionally, check if department.city matches cityAdmin.address.city for security
    if (name) department.name = name;
    if (contactNumber) department.contactNumber = contactNumber;
    if (address) department.address = address;
    await department.save();
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department.' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    await Department.findByIdAndDelete(id);
    res.status(200).json({ message: 'Department deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department.' });
  }
};

// Set up account via invitation link
const setupAccount = async (req, res) => {
  try {
    const { token, userName, password, contactNumber } = req.body;

    const user = await User.findOne({ invitationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    if (!user || !user.invitationToken || user.invitationToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired invitation token.' });
    }
    if (user.invitationTokenExpires && user.invitationTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Invitation link has expired.' });
    }

    // Validate contact number
    if (!/^09\d{9}$|^0\d{9,10}$/.test(contactNumber)) {
      return res.status(400).json({ error: 'Invalid Philippine contact number.' });
    }

    user.userName = userName;
    user.password = password; // This will be hashed by the pre-save hook
    user.contactNumber = contactNumber;
    user.isVerified = true; // <-- Auto-verify admin
    user.verificationToken = undefined;
    user.invitationToken = undefined;

    // Only set isProfileComplete for public users
    if (user.role === 'publicUser') {
      user.isProfileComplete = true;
    }

    await user.save();

    res.status(200).json({ message: 'Account setup successfully' });
  } catch (error) {
    console.error('Error setting up account:', error);
    res.status(500).json({ error: 'Failed to set up account' });
  }
};

// Get all responders for the departmentAdmin's department
const getAllResponders = async (req, res) => {
  try {
    const departmentAdmin = await User.findById(req.user.id);
    if (!departmentAdmin || departmentAdmin.role !== 'departmentAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const responders = await User.find({
      role: 'responder',
      'assignedArea.department': departmentAdmin.assignedArea.department
    }).select('-password');
    res.status(200).json(responders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders.' });
  }
};

// Add a responder
const createResponder = async (req, res) => {
  try {
    const { email, contactNumber } = req.body;
    if (!email || !contactNumber) {
      return res.status(400).json({ error: 'Email and contact number are required.' });
    }

    const departmentAdmin = await User.findById(req.user.id);
    if (!departmentAdmin || departmentAdmin.role !== 'departmentAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Make sure the department exists
    const deptDoc = await Department.findById(departmentAdmin.assignedArea.department);
    if (!deptDoc) {
      return res.status(400).json({ error: 'Invalid department.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');

    const responder = await User.create({
      email,
      contactNumber,
      role: 'responder',
      assignedArea: {
        department: deptDoc._id,
        city: deptDoc.city,
        province: deptDoc.province,
        region: deptDoc.region
      },
      address: {
        city: deptDoc.city
      },
      password: null,
      invitationToken,
    });

    // Send invitation email
    await sendInvitationEmail(email, 'Responder', responder.invitationToken);

    res.status(201).json({ message: 'Responder created and invitation sent.', responder });
  } catch (error) {
    console.error('Error creating responder:', error);
    res.status(500).json({ error: 'Failed to create responder.' });
  }
};

// Update responder
const updateResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const responder = await User.findById(id);
    if (!responder || responder.role !== 'responder') {
      return res.status(404).json({ error: 'Responder not found.' });
    }

    responder.email = email;
    await responder.save();

    res.status(200).json({ message: 'Responder updated successfully.', responder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update responder.' });
  }
};

// Delete responder
const deleteResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const responder = await User.findByIdAndDelete(id);
    if (!responder) {
      return res.status(404).json({ error: 'Responder not found.' });
    }
    res.status(200).json({ message: 'Responder deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete responder.' });
  }
};

// Get department info for department admin profile
const getMyDepartment = async (req, res) => {
  try {
    const departmentAdmin = await User.findById(req.user.id);
    if (!departmentAdmin || departmentAdmin.role !== 'departmentAdmin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const department = await Department.findById(departmentAdmin.assignedArea.department)
      .populate('city province region');
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department.' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Add a user
const addUser = async (req, res) => {
  try {
    const { userName, email, password, role, contactNumber, address, departmentId } = req.body;

    if (!userName || !email || !password || !contactNumber || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      userName,
      email,
      password: hashedPassword,
      role,
      contactNumber,
      address,
      ...(role === 'responder' && { departmentId }), // Include agencyId for responders
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add user' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};



module.exports = {
  getAllUsersWithJurisdictions,
  getAdminsByRole,
  getAllRegions,
  createRegionAdmin,
  updateRegionAdmin,
  deleteRegionAdmin,
  getRegionAdminAssignedArea,
  getProvinceAdminAssignedArea,
  getProvincesByRegion,
  addAdmin,
  createProvinceAdmin,
  getAllProvinceAdmins,
  updateProvinceAdmin,
  deleteProvinceAdmin,
  createCityAdmin,
  getAllCityAdmins,
  updateCityAdmin,
  deleteCityAdmin,
  getDepartmentAdminsByCityAdmin,
  getAllDepartmentAdmins,
  createDepartmentAdmin,
  getDepartmentsByCity,
  updateDepartmentAdmin,
  deleteDepartmentAdmin,
  getCitiesInProvince,
  getDepartmentsForCityAdmin,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  sendInvitationEmail,
  setupAccount,
  createResponder,
  getAllResponders,
  updateResponder,
  deleteResponder,
  getMyDepartment,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser
};