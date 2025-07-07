const multer = require('multer');

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']; // quicktime = .mov

const fileFilter = (req, file, cb) => {
  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, WEBP images and MP4, MOV, WEBM videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max per file
    files: 3 // Max to 3 files
  },
  fileFilter: fileFilter
});

module.exports = upload; 