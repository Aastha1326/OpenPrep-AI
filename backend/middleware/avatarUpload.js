/**
 * Multer configuration for user profile avatar uploads.
 *
 * Accepts only .jpeg/.jpg/.png images up to 5 MB, verifies the binary
 * magic bytes against the claimed extension (reusing the same check as
 * the general upload middleware), and stores files in
 * backend/uploads/avatars/. Old avatar cleanup happens in the controller.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyMagicBytes } = require('./upload');

const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const ALLOWED_AVATAR_MIME = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function createFileValidationError() {
  const error = new Error('Only JPEG, PNG, WEBP, and SVG images are allowed for avatars');
  error.name = 'FileValidationError';
  return error;
}

// Check file type (extension + declared MIME pre-check, fast reject)
function checkAvatarFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const extname = Object.prototype.hasOwnProperty.call(ALLOWED_AVATAR_MIME, ext);
  const mimetype = ALLOWED_AVATAR_MIME[ext] === file.mimetype;

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(createFileValidationError());
}

// Custom storage engine mirroring middleware/upload.js: buffer the stream,
// verify magic bytes against the claimed extension, and only write to disk
// once the content is confirmed genuine. Filenames are scoped per-user so
// the controller can reliably locate and remove a user's previous avatar.
const storage = {
  _handleFile(req, file, cb) {
    (async () => {
      const chunks = [];
      for await (const chunk of file.stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const ext = path.extname(file.originalname).toLowerCase();
      try {
        await verifyMagicBytes(ext, buffer);
      } catch {
        // Normalize to the avatar-specific message regardless of what the
        // shared magic-byte checker says (it's phrased for document uploads).
        throw createFileValidationError();
      }

      // Random suffix (not just Date.now()) so two uploads landing in the
      // same millisecond never collide and silently clobber each other.
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      const filename = `avatar-${req.user.id}-${uniqueSuffix}${ext}`;
      const filePath = path.join(avatarDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const info = {
        destination: avatarDir,
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

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkAvatarFileType(file, cb);
  },
});

module.exports = avatarUpload;
