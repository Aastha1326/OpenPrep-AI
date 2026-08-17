/**
 * Client-side validator for user avatar uploads.
 * Accepts image/png, image/jpeg, image/jpg, image/webp, and image/svg+xml.
 * File size must be under 5MB.
 *
 * @param {File} file - The file to validate.
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateAvatarFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Allowed MIME types
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file format. Only PNG, JPEG, WEBP, and SVG formats are allowed.',
    };
  }

  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum allowed size is 5MB.',
    };
  }

  return { isValid: true, error: null };
};
