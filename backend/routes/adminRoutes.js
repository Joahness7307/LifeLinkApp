const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const requireSuperAdmin = require('../middleware/superAdminMiddleware');
const {
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
  setupAccount,
  createCityAdmin,
  getAllCityAdmins,
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
  updateCityAdmin,
  deleteCityAdmin,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  createResponder,
  getAllResponders,
  updateResponder,
  deleteResponder,
  getMyDepartment
} = require('../controllers/adminController');

const Region = require('../models/regionModel');
const Province = require('../models/provinceModel');
const City = require('../models/cityModel');
const Department = require('../models/departmentModel');
const { get } = require('mongoose');

const router = express.Router();

// Super Admin: Region Admin Management
router.get('/all-users', requireAuth, requireSuperAdmin, getAllUsersWithJurisdictions);
router.get('/region-admins', requireAuth, requireSuperAdmin, getAdminsByRole('regionAdmin'));
router.get('/province-admins', requireAuth, requireSuperAdmin, getAdminsByRole('provinceAdmin'));
router.get('/city-admins', requireAuth, requireSuperAdmin, getAdminsByRole('cityAdmin'));
router.get('/department-admins', requireAuth, requireSuperAdmin, getAdminsByRole('departmentAdmin'));
router.get('/all-responders', requireAuth, requireSuperAdmin, getAdminsByRole('responder'));
router.get('/public-users', requireAuth, requireSuperAdmin, getAdminsByRole('publicUser'));
router.get('/regions', requireAuth, requireSuperAdmin, getAllRegions);
router.post('/region-admins', requireAuth, requireSuperAdmin, createRegionAdmin);
router.patch('/region-admins/:id', requireAuth, requireSuperAdmin, updateRegionAdmin);
router.delete('/region-admins/:id', requireAuth, requireSuperAdmin, deleteRegionAdmin);

// Admin routes
router.post('/invite', requireAuth, requireRole(['provinceAdmin', 'cityAdmin', 'departmentAdmin']), addAdmin); // Send invitation
router.post('/setup-account', setupAccount); // Set up account via invitation

// Region Admin (regionAdmin): Province Admin Management
// Get the assigned area of the logged-in region admin
router.get('/regionAdmin/assigned-area', requireAuth, requireRole(['regionAdmin']), getRegionAdminAssignedArea);
router.get('/get-all-province-admins', requireAuth, requireRole(['regionAdmin']), getAllProvinceAdmins);
router.post('/add-province-admins', requireAuth, requireRole(['regionAdmin']), createProvinceAdmin);

// Fetch provinces by region for region admin
router.get('/provinces/:regionId', requireAuth, requireRole(['regionAdmin']), getProvincesByRegion);
router.patch('/update-province-admins/:id', requireAuth, requireRole(['regionAdmin']), updateProvinceAdmin);
router.delete('/delete-province-admins/:id', requireAuth, requireRole(['regionAdmin']), deleteProvinceAdmin);

// City Admin: City Admin Management
router.get('/provinceAdmin/assigned-area', requireAuth, requireRole(['provinceAdmin']), getProvinceAdminAssignedArea);
router.get('/get-all-city-admins', requireAuth, requireRole(['provinceAdmin']), getAllCityAdmins);
router.post('/add-city-admins', requireAuth, requireRole(['provinceAdmin']), createCityAdmin);
router.patch('/update-city-admins/:id', requireAuth, requireRole(['provinceAdmin']), updateCityAdmin);
router.delete('/delete-city-admins/:id', requireAuth, requireRole(['provinceAdmin']), deleteCityAdmin);
router.get('/cities', requireAuth, requireRole(['provinceAdmin']), (req, res) => {
  const { province } = req.user.address; // Get the cities from the province Admin's address
  const cities = getCitiesInProvince(province);
  res.status(200).json(cities);
});

// Region Admin: View all department admins under a city admin
router.get('/city-admin/:cityAdminId/department-admins', requireAuth, requireRole(['provinceAdmin']), getDepartmentAdminsByCityAdmin);

// City Admin: Department Admin Management
router.get('/get-all-department-admins', requireAuth, requireRole(['cityAdmin']), getAllDepartmentAdmins);
router.post('/add-department-admins', requireAuth, requireRole(['cityAdmin']), createDepartmentAdmin);
router.get('/departments/:cityId', requireAuth, requireRole(['cityAdmin']), getDepartmentsByCity);
router.patch('/update-department-admins/:id', requireAuth, requireRole(['cityAdmin']), updateDepartmentAdmin);
router.delete('/delete-department-admins/:id', requireAuth, requireRole(['cityAdmin']), deleteDepartmentAdmin);

// Department management for cityAdmin
router.get('/my-departments', requireAuth, requireRole(['cityAdmin']), getDepartmentsForCityAdmin);
router.post('/departments', requireAuth, requireRole(['cityAdmin']), addDepartment);
router.patch('/departments/:id', requireAuth, requireRole(['cityAdmin']), updateDepartment);
router.delete('/departments/:id', requireAuth, requireRole(['cityAdmin']), deleteDepartment);

// Region Admin: Manage all users
router.get('/get-users', requireAuth, requireRole(['regionAdmin']), getAllUsers);
router.post('/add-users', requireAuth, requireRole(['regionAdmin']), addUser);
router.patch('/update-users/:id', requireAuth, requireRole(['regionAdmin']), updateUser);
router.delete('/delete-users/:id', requireAuth, requireRole(['regionAdmin']), deleteUser);

// Department Admin: Responder Management
router.get('/responders', requireAuth, requireRole(['superAdmin', 'departmentAdmin']), getAllResponders);
router.post('/responders', requireAuth, requireRole(['superAdmin','departmentAdmin']), createResponder);
router.patch('/responders/:id', requireAuth, requireRole(['superAdmin','departmentAdmin']), updateResponder);
router.delete('/responders/:id', requireAuth, requireRole(['superAdmin','departmentAdmin']), deleteResponder);
router.get('/my-department', requireAuth, requireRole(['superAdmin','departmentAdmin']), getMyDepartment);

// Fetch all regions
router.get('/regions', requireAuth, requireRole(['provinceAdmin']), async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// Fetch provinces by region
router.get('/provinces/:regionId', requireAuth, requireRole(['provinceAdmin']), async (req, res) => {
  try {
    const { regionId } = req.params;
    const provinces = await Province.find({ region: regionId });
    res.status(200).json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
});

// Fetch cities by province
router.get('/cities/:provinceId', requireAuth, requireRole(['provinceAdmin']), async (req, res) => {
  try {
    const { provinceId } = req.params;
    const cities = await City.find({ province: provinceId });
    res.status(200).json(cities);
    console.log('Fetching cities for province:', req.params.provinceId);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Temporary route to create the first super admin
// router.post('/create-first-super-admin', async (req, res) => {
//   const { userName, email, password, contactNumber, address } = req.body;

//   if (!userName || !email || !password || !contactNumber || !address) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   try {
//     // Check if a super admin already exists
//     const superAdminExists = await User.findOne({ role: 'superAdmin' });
//     if (superAdminExists) {
//       return res.status(400).json({ error: 'A super admin already exists' });
//     }

//     // Create the super admin user
//     const superAdminUser = await User.create({
//       userName,
//       email: email.toLowerCase(),
//       password,
//       role: 'superAdmin',
//       contactNumber,
//       address,
//     });

//     res.status(201).json({
//       message: 'Super admin created successfully',
//       superAdmin: {
//         _id: superAdminUser._id,
//         userName: superAdminUser.userName,
//         email: superAdminUser.email,
//         role: superAdminUser.role,
//       },
//     });
//   } catch (error) {
//     console.error('Error creating super admin:', error);
//     res.status(500).json({ error: 'Failed to create super admin' });
//   }
// });

module.exports = router;