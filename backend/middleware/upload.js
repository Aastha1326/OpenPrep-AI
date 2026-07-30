const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Allowed MIME types mapped by extension
const ALLOWED_MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

// Check file type
function checkFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const extname = Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, ext);
  const mimetype = ALLOWED_MIME_TYPES[ext] === file.mimetype;

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    const error = new Error('Only PDFs, documents, and images are allowed!');
    error.name = 'FileValidationError';
    cb(error);
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
