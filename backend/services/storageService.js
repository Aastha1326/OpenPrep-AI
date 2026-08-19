const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadEnv } = require('../config/env');

const env = loadEnv(process.env);

// Allowed image MIME types for validation
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

// Maximum file size for images (15MB, matching existing middleware)
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

/**
 * Storage service abstraction layer
 * Provides unified interface for local and S3 storage
 */
class StorageService {
  constructor() {
    this.provider = env.STORAGE_PROVIDER || 'local';
    this.validateConfiguration();
  }

  /**
   * Validate that required configuration is present for the selected provider
   */
  validateConfiguration() {
    if (this.provider === 's3') {
      if (!env.AWS_S3_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION) {
        throw new Error('S3 storage provider requires AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION');
      }
    }
  }

  /**
   * Validate image file before upload
   * @param {Object} file - File object from multer
   * @param {Buffer} buffer - File buffer
   * @throws {Error} If validation fails
   */
  validateImageFile(file, buffer) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error('Image file exceeds the maximum allowed size of 15MB');
    }

    // Check MIME type
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid image file type. Allowed types: JPEG, PNG, WebP, SVG');
    }

    // Check file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    };

    const allowedExtensions = validExtensions[file.mimetype] || [];
    if (!allowedExtensions.includes(ext)) {
      throw new Error('File extension does not match the declared MIME type');
    }
  }

  /**
   * Generate a safe, unique filename/object key
   * @param {string} originalName - Original filename
   * @param {string} prefix - Optional prefix for the file
   * @returns {string} Safe filename
   */
  generateSafeFilename(originalName, prefix = 'image') {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${random}${ext}`;
  }

  /**
   * Upload a file to the configured storage provider
   * @param {Object} file - File object from multer
   * @param {Buffer} buffer - File buffer
   * @param {string} prefix - Optional prefix for the file
   * @returns {Promise<{url: string, key: string}>} URL and storage key
   */
  async uploadFile(file, buffer, prefix = 'image') {
    this.validateImageFile(file, buffer);

    const filename = this.generateSafeFilename(file.originalname, prefix);

    if (this.provider === 'local') {
      return this.uploadToLocal(file, buffer, filename);
    } else if (this.provider === 's3') {
      return this.uploadToS3(buffer, filename, file.mimetype);
    } else {
      throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * Upload file to local filesystem
   * @param {Object} file - File object from multer
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Generated filename
   * @returns {Promise<{url: string, key: string}>} URL and storage key
   */
  async uploadToLocal(file, buffer, filename) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    
    try {
      await fs.promises.writeFile(filePath, buffer);
      
      // Return URL relative to server
      const url = `/uploads/${filename}`;
      return { url, key: filename };
    } catch (error) {
      // Clean up file if write failed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error('Failed to store file locally');
    }
  }

  /**
   * Upload an already-stored local file to the configured storage provider
   * This is used when the file has already been saved by multer middleware
   * @param {string} filePath - Path to the already-saved file
   * @param {string} originalName - Original filename
   * @param {string} mimetype - File MIME type
   * @param {string} prefix - Optional prefix for the file
   * @returns {Promise<{url: string, key: string}>} URL and storage key
   */
  async uploadExistingFile(filePath, originalName, mimetype, prefix = 'image') {
    // Create a file-like object for validation (can't validate size without reading file)
    const file = {
      originalname: originalName,
      mimetype: mimetype,
    };

    // Validate MIME type and extension (can be done without reading file)
    const ext = path.extname(originalName).toLowerCase();
    const validExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    };

    const allowedExtensions = validExtensions[mimetype] || [];
    if (!allowedExtensions.includes(ext)) {
      throw new Error('File extension does not match the declared MIME type');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimetype)) {
      throw new Error('Invalid image file type. Allowed types: JPEG, PNG, WebP, SVG');
    }

    const filename = this.generateSafeFilename(originalName, prefix);

    if (this.provider === 'local') {
      // For local storage, the file is already in place - just return the URL
      // Extract filename from the existing path
      const existingFilename = path.basename(filePath);
      const url = `/uploads/${existingFilename}`;
      return { url, key: existingFilename };
    } else if (this.provider === 's3') {
      // Read the file buffer only when uploading to S3
      let buffer;
      try {
        buffer = await fs.promises.readFile(filePath);
      } catch (error) {
        throw new Error('Failed to read file for S3 upload');
      }

      // Validate file size only for S3 upload
      if (buffer.length > MAX_IMAGE_SIZE) {
        throw new Error('Image file exceeds the maximum allowed size of 15MB');
      }

      // Upload to S3 and then clean up local file
      const result = await this.uploadToS3(buffer, filename, mimetype);
      
      // Clean up the local file after successful S3 upload
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error('Failed to clean up local file after S3 upload:', error.message);
      }
      
      return result;
    } else {
      throw new Error(`Unsupported storage provider: ${this.provider}`);
    }
  }

  /**
   * Upload file to AWS S3
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Generated filename
   * @param {string} mimetype - File MIME type
   * @returns {Promise<{url: string, key: string}>} URL and storage key
   */
  async uploadToS3(buffer, filename, mimetype) {
    try {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: mimetype,
      });

      await s3Client.send(command);

      // Generate URL based on configuration
      let url;
      if (env.AWS_S3_PUBLIC_BASE_URL) {
        url = `${env.AWS_S3_PUBLIC_BASE_URL}/${filename}`;
      } else {
        url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${filename}`;
      }

      return { url, key: filename };
    } catch (error) {
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Delete a file from storage
   * @param {string} key - Storage key/filename
   * @returns {Promise<void>}
   */
  async deleteFile(key) {
    if (this.provider === 'local') {
      return this.deleteFromLocal(key);
    } else if (this.provider === 's3') {
      return this.deleteFromS3(key);
    }
  }

  /**
   * Delete file from local filesystem
   * @param {string} filename - Filename
   * @returns {Promise<void>}
   */
  async deleteFromLocal(filename) {
    const filePath = path.join(__dirname, '../uploads', filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      // Log error but don't throw - deletion is best-effort
      console.error('Failed to delete local file:', error.message);
    }
  }

  /**
   * Delete file from S3
   * @param {string} key - S3 object key
   * @returns {Promise<void>}
   */
  async deleteFromS3(key) {
    try {
      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      // Log error but don't throw - deletion is best-effort
      console.error('Failed to delete S3 file:', error.message);
    }
  }
}

// Export singleton instance
module.exports = new StorageService();
module.exports.StorageService = StorageService;