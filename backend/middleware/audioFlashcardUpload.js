const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
]);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    const error = new Error('Only .mp3, .wav, and .m4a audio files are supported.');
    error.name = 'FileValidationError';
    return cb(error);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('The uploaded file does not appear to be a supported audio file.');
    error.name = 'FileValidationError';
    return cb(error);
  }

  cb(null, true);
};

const audioFlashcardUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = audioFlashcardUpload;