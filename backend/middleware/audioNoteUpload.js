const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fromBuffer } = require('file-type');
const { loadEnv } = require('../config/env');

const config = loadEnv();
const MAX_AUDIO_UPLOAD_SIZE = (config?.MAX_AUDIO_UPLOAD_SIZE_MB || 25) * 1024 * 1024;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed audio MIME types mapped by extension
const ALLOWED_MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
};

// Expected binary magic-byte signature (file-type ext) per allowed extension.
const MAGIC_BYTE_TYPES = {
  '.mp3': 'mp3',
  '.wav': 'wav',
  '.webm': 'webm',
  '.ogg': 'ogg',
  '.m4a': ['m4a', 'mp4'],
};

function createFileValidationError() {
  const error = new Error('Only .mp3, .wav, .webm, .ogg, and .m4a audio files are supported.');
  error.name = 'FileValidationError';
  return error;
}

function createFileSizeLimitError(maxSizeMB) {
  const error = new Error(`Audio file size exceeds the maximum allowed size of ${maxSizeMB} MB.`);
  error.name = 'FileSizeLimitError';
  error.statusCode = 413; // Payload Too Large
  return error;
}

/**
 * Verify that the uploaded buffer's binary structure (magic bytes) matches the
 * claimed file extension. Prevents attackers from renaming executables or
 * scripts to `payload.mp3` to bypass extension-only checks.
 *
 * @param {string} ext Lowercased file extension (with leading dot)
 * @param {Buffer} buffer Full uploaded file content
 */
async function verifyMagicBytes(ext, buffer) {
  const expected = MAGIC_BYTE_TYPES[ext];

  // Empty uploads carry no magic bytes
  if (buffer.length === 0) {
    if (expected === undefined) return;
    throw createFileValidationError();
  }

  let detected;
  try {
    detected = await fromBuffer(buffer);
  } catch {
    // Truncated or unparseable binary — treat as no signature found
    detected = undefined;
  }

  if (expected === undefined) {
    throw createFileValidationError();
  }

  if (!detected) {
    throw createFileValidationError();
  }

  if (Array.isArray(expected)) {
    if (!expected.includes(detected.ext)) {
      throw createFileValidationError();
    }
  } else {
    if (detected.ext !== expected) {
      throw createFileValidationError();
    }
  }
}

// Check file type (extension + declared MIME pre-check, fast reject)
function checkFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const extname = Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, ext);
  const mimetype = ALLOWED_MIME_TYPES[ext] === file.mimetype || file.mimetype.startsWith('audio/');

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(createFileValidationError());
}

// Custom storage engine: buffer the stream, verify magic bytes against the
// claimed extension, validate file size, and only write to disk when valid.
const storage = {
  _handleFile(req, file, cb) {
    (async () => {
      const chunks = [];
      let totalSize = 0;
      
      for await (const chunk of file.stream) {
        chunks.push(chunk);
        totalSize += chunk.length;
        
        // Early size validation during streaming
        if (totalSize > MAX_AUDIO_UPLOAD_SIZE) {
          throw createFileSizeLimitError(config?.MAX_AUDIO_UPLOAD_SIZE_MB || 25);
        }
      }
      
      const buffer = Buffer.concat(chunks);

      const ext = path.extname(file.originalname).toLowerCase();
      await verifyMagicBytes(ext, buffer);

      const filename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const info = {
        destination: uploadDir,
        filename,
        path: filePath,
        size: buffer.length,
      };
      Object.assign(file, info);
      return info;
    })()
      .then((info) => cb(null, info))
      .catch((err) => cb(err));
  },

  _removeFile(req, file, cb) {
    if (file.path) {
      fs.unlink(file.path, () => cb(null));
    } else {
      cb(null);
    }
  },
};

// Init audio upload middleware
const audioNoteUpload = multer({
  storage,
  limits: { 
    fileSize: MAX_AUDIO_UPLOAD_SIZE,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Expose helper for unit testing
module.exports = audioNoteUpload;
module.exports.verifyMagicBytes = verifyMagicBytes;
module.exports.MAX_AUDIO_UPLOAD_SIZE = MAX_AUDIO_UPLOAD_SIZE;
