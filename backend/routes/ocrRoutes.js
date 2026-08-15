const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { processHandwrittenNote } = require('../controllers/ocrController');

const router = express.Router();

// Configure multer storage for temporary uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .png and .webp image formats are allowed!'), false);
    }
  },
});

router.post('/process-notes', protect, upload.single('image'), processHandwrittenNote);

module.exports = router;
