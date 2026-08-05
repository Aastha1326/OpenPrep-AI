const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fromBuffer } = require('file-type');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types mapped by extension
const ALLOWED_MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Expected binary magic-byte signature (file-type ext) per allowed extension.
// `.txt` is intentionally absent — plain-text files have no magic bytes and
// are validated by extension + MIME type only.
const MAGIC_BYTE_TYPES = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.jpeg': 'jpg',
  '.jpg': 'jpg',
  '.png': 'png',
  '.mp3': 'mp3',
  '.wav': 'wav',
  '.webm': 'webm',
  '.ogg': 'ogg',
  '.m4a': ['m4a', 'mp4'],
  '.webp': 'webp',
};

function createFileValidationError() {
  const error = new Error('Only PDFs, documents, images, and audio files are allowed!');
  error.name = 'FileValidationError';
  return error;
}

/**
 * Verify that the uploaded buffer's binary structure (magic bytes) matches the
 * claimed file extension. Prevents attackers from renaming executables or
 * scripts to `payload.pdf` to bypass extension-only checks.
 *
 * @param {string} ext Lowercased file extension (with leading dot)
 * @param {Buffer} buffer Full uploaded file content
 */
async function verifyMagicBytes(ext, buffer) {
  const expected = MAGIC_BYTE_TYPES[ext];

  // Empty uploads carry no magic bytes — only meaningful for plain text
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
    // .txt must not contain a known binary signature (e.g. an .exe renamed)
    if (detected) {
      throw createFileValidationError();
    }
    return;
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

  const isAudioExt = ['.mp3', '.wav', '.webm', '.ogg', '.m4a'].includes(ext);
  const mimetype = isAudioExt
    ? file.mimetype.startsWith('audio/')
    : ALLOWED_MIME_TYPES[ext] === file.mimetype;

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(createFileValidationError());
}

// Custom storage engine: buffer the stream, verify magic bytes against the
// claimed extension, and only write to disk when the content is genuine.
const storage = {
  _handleFile(req, file, cb) {
    (async () => {
      const chunks = [];
      for await (const chunk of file.stream) {
        chunks.push(chunk);
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

// Init upload
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Expose helper for unit testing while keeping the multer instance as default
module.exports = upload;
module.exports.verifyMagicBytes = verifyMagicBytes;
