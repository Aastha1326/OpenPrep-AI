/**
 * Multer configuration for flashcard CSV/JSON imports.
 *
 * Accepts only .csv and .json files up to 2 MB. Stored temporarily in
 * backend/uploads/ and deleted by the controller after reading.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_FLASHCARD_MIME = {
  '.csv': 'text/csv',
  '.json': 'application/json',
};

// Some browsers send text/plain for .csv — also accept that
const ALSO_ACCEPT = ['text/plain', 'application/octet-stream'];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    cb(null, `flashcard-import-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function flashcardFileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(ALLOWED_FLASHCARD_MIME, ext)) {
    return cb(null, true);
  }
  if (ALSO_ACCEPT.includes(file.mimetype) && (ext === '.csv' || ext === '.json')) {
    return cb(null, true);
  }
  const err = new Error('Only .csv and .json files are accepted for flashcard import');
  err.name = 'FileValidationError';
  cb(err);
}

const flashcardUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: flashcardFileFilter,
});

module.exports = flashcardUpload;
