const express = require('express');
const multer = require('multer');

const { submitReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', requireAuth, upload.single('image'), submitReport);

module.exports = router;
