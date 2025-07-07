const express = require('express');
const { getRecentReports, getReportsForDepartment, getReportStatusCounts, sendReport, getAllReports, getReportById, markReportAsFake, updateReport, deleteReport } = require('../controllers/reportController');
const requireAuth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/recent', requireAuth, getRecentReports);
router.post('/report', requireAuth, upload.array('files', 3), sendReport);
router.get('/department/:departmentId', requireAuth, getReportsForDepartment);

// Get all reports for a department
router.get('/department/:departmentId', requireAuth, getReportsForDepartment);

// Get report status counts
router.get('/department/:departmentId/status-counts', requireAuth, getReportStatusCounts);

// Update report status
router.put('/:id/status', requireAuth, updateReport);

// Mark a report as fake
router.patch('/:id/mark-fake', requireAuth, requireAdmin, markReportAsFake); // Mark report as fake

// CRUD for reports
router.get('/', requireAuth, getAllReports); // Get all Reports
router.get('/:id', requireAuth, getReportById); // Get single report
router.put('/:id', requireAuth, updateReport); // Update report
router.delete('/:id', requireAuth, deleteReport); // Delete report

module.exports = router;