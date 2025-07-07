const User = require('../models/userModel');
const Report = require('../models/reportModel');
const Emergency = require('../models/emergencyModel');
const Department = require('../models/departmentModel');
const { cloudinary } = require('../config/cloudinary');
const { getIO } = require('../utils/socketUtils');

const generateReferenceNumber = () => 'LL-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']; // quicktime = .mov

// Get the most recent 10 reports for the user
const getRecentReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(reports);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendReport = async (req, res) => {
  try {
    console.log('--- Received POST /api/reports/report ---');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account is blocked.' });
    }

    let { location, message, type, subtype, address } = req.body;
    let imageURLs = [];
    let videoURLs = [];

    // Parse address if needed
    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch (e) {
      console.error('Address parse error:', e);
      return res.status(400).json({ error: 'Invalid address format' });
    }

    let department = undefined;
    let emergency = undefined;

    if (parsedAddress && parsedAddress.city && type) {
      department = await Department.findOne({
        city: parsedAddress.city,
        emergencyTypes: type
      });
    }
    let departmentId = department ? department._id : undefined;
    console.log('Matched department:', departmentId);

    if (department) {
      emergency = await Emergency.findOne({
        type,
        departmentId: department._id
      });
    }
    let emergencyId = emergency ? emergency._id : undefined;
    console.log('Matched emergency:', emergencyId);

    // Parse location if it's a stringified object
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        console.error('Location parse error:', e);
        location = undefined;
      }
    }

    // File uploads
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        console.log('Too many files uploaded:', req.files.length);
        return res.status(400).json({ error: 'You can only upload up to 3 files.' });
      }
      for (const file of req.files) {
        console.log('Uploading file:', file.originalname, file.mimetype, file.size);
        // Check type and size
        if (allowedImageTypes.includes(file.mimetype)) {
          if (file.size > 3 * 1024 * 1024) {
            console.log('Image too large:', file.size);
            return res.status(400).json({ error: 'Each image must be less than 3MB.' });
          }
        } else if (allowedVideoTypes.includes(file.mimetype)) {
          if (file.size > 15 * 1024 * 1024) {
            console.log('Video too large:', file.size);
            return res.status(400).json({ error: 'Each video must be less than 15MB.' });
          }
        } else {
          console.log('Invalid file type:', file.mimetype);
          return res.status(400).json({ error: 'Invalid file type.' });
        }

        // Upload to Cloudinary
        const streamUpload = (buffer, mimetype) => {
          return new Promise((resolve, reject) => {
            const resourceType = mimetype.startsWith('image') ? 'image' : 'video';
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: resourceType, folder: 'reports' },
              (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
              }
            );
            stream.end(buffer);
          });
        };

        try {
          const url = await streamUpload(file.buffer, file.mimetype);
          if (file.mimetype.startsWith('image')) imageURLs.push(url);
          else videoURLs.push(url);
          console.log('Uploaded to Cloudinary:', url);
        } catch (err) {
          console.log('Cloudinary upload error:', err);
          return res.status(500).json({ error: 'Cloudinary upload failed' });
        }
      }
    }

    // Rate limiting: max 3 reports per hour
    const recentReports = await Report.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });
    if (recentReports >= 3) {
      return res.status(429).json({ error: 'You can only submit 3 reports per hour.' });
    }

    console.log('Ready to create report');

    const report = await Report.create({
      userId,
      emergencyId,
      departmentId,
      location,
      address,
      message,
      imageURLs, // Array of image URLs
      videoURLs, // Array of video URLs
      type,
      subtype,
      referenceNumber: generateReferenceNumber(),
    });

    console.log('Report created:', report._id);

    const io = getIO();
    io.to(`department_${report.departmentId}`).emit('new_report', report);
    
    // Log what is being sent to the frontend
    console.log('Sending response to frontend:', report);

    res.status(200).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get reports for a specific department (admin: all, user: own)
const getReportsForDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const filter = { departmentId };

    if (status === 'fake') {
      filter.isFake = true;
    } else if (status) {
      filter.status = status;
      filter.isFake = { $ne: true }; // Exclude fake reports from other statuses
    }

    // Add search filter
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { referenceNumber: regex },
        { type: regex },
        { subtype: regex },
        { address: regex },
        { 'address.display': regex }
      ];
    }

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getReportStatusCounts = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const statuses = ['pending', 'in_progress', 'resolved'];
    const counts = {};
    for (const status of statuses) {
     // Exclude fake reports from normal status counts
      counts[status] = await Report.countDocuments({ departmentId, status, isFake: { $ne: true } });
    }
    // Add fake reports count
    counts.fake = await Report.countDocuments({ departmentId, isFake: true });
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all reports (admin: all, user: own)
const getAllReports = async (req, res) => {
  try {
    const search = req.query.search || '';
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { referenceNumber: regex },
        { type: regex },
        { subtype: regex },
        { address: regex },
        { 'address.display': regex }
      ];
    }
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ reports });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get single report
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('userId', 'contactNumber');
    console.log('report.departmentId:', report.departmentId.toString());
    console.log('req.user.departmentId:', req.user.departmentId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (
      !['superAdmin', 'departmentAdmin'].includes(req.user.role) &&
      !report.userId.equals(req.user._id)
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (
      req.user.role === 'departmentAdmin' &&
      report.departmentId.toString() !== req.user.departmentId
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const markReportAsFake = async (req, res) => {
  try {
    const { id } = req.params;
    const { fakeReason } = req.body;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.isFake = true;
    report.fakeReason = fakeReason || '';
    await report.save();

    // Increment user's fake report count
    const user = await User.findById(report.userId);
    if (user) {
      user.fakeReportCount = (user.fakeReportCount || 0) + 1;
      if (user.fakeReportCount >= 3) user.isBlocked = true;
      await user.save();
    }

    const io = getIO();
    io.to(report.userId.toString()).emit('report_status_updated', {
      _id: report._id,
      status: report.status,
      isFake: report.isFake,
      fakeReason: report.fakeReason,
      updatedAt: report.updatedAt,
    });
    io.to(`department_${report.departmentId}`).emit('report_status_updated', {
      _id: report._id,
      status: report.status,
      isFake: report.isFake,
      fakeReason: report.fakeReason,
      updatedAt: report.updatedAt,
    });

    res.status(200).json({ message: 'Report marked as fake', report });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update report
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      console.log('Report not found:', req.params.id);
      return res.status(404).json({ error: 'Report not found' });
    }
    if (
      !['superAdmin', 'departmentAdmin'].includes(req.user.role) &&
      !report.userId.equals(req.user._id)
    ) {
      console.log('Unauthorized access attempt by user:', req.user._id);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const oldStatus = report.status;
    if (req.body.status) {
      report.status = req.body.status;
    }
    Object.assign(report, req.body);

    if (req.body.status && req.body.status !== report.status) {
      report.statusHistory = report.statusHistory || [];
      report.statusHistory.push({
        status: req.body.status,
        changedBy: req.user._id,
        changedAt: new Date()
      });
      report.status = req.body.status;
    }

    const phTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    report.updatedAt = phTime;

    await report.save();

    // Emit status update to the user (and optionally to department room)
    const io = getIO();
    io.to(report.userId.toString()).emit('report_status_updated', {
      _id: report._id,
      status: report.status,
      isFake: report.isFake,         // <-- Add this
      fakeReason: report.fakeReason, // <-- Add this
      updatedAt: report.updatedAt,
    });
    io.to(`department_${report.departmentId}`).emit('report_status_updated', {
      _id: report._id,
      status: report.status,
      isFake: report.isFake,
      fakeReason: report.fakeReason,
      updatedAt: report.updatedAt,
    });

    // Send push notification to user if they have an FCM token
    const user = await User.findById(report.userId);
    if (user && user.fcmToken) {
      admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: 'Report Status Updated',
          body: `Your report is now "${report.status.replace('_', ' ')}".`,
        },
        data: {
          reportId: report._id.toString(),
          status: report.status,
        },
      }).then(response => {
        console.log('Push notification sent:', response);
      }).catch(error => {
        console.error('Error sending push notification:', error);
      });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.role !== 'admin' && !report.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await report.deleteOne();
    res.status(200).json({ message: 'Report deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getRecentReports,
  sendReport,
  getReportsForDepartment,
  getReportStatusCounts,
  getReportById,
  getAllReports,
  markReportAsFake,
  updateReport,
  deleteReport
};