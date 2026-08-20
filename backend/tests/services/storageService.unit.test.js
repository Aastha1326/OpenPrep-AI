const fs = require('fs');
const path = require('path');

// Mock the environment config
const mockEnv = {
  STORAGE_PROVIDER: 'local',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret',
  AWS_S3_BUCKET: 'test-bucket',
  AWS_S3_PUBLIC_BASE_URL: 'https://test-bucket.s3.amazonaws.com',
};

// Mock AWS SDK
const mockS3Client = {
  send: vi.fn(),
};

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => mockS3Client),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('../../config/env', () => ({
  loadEnv: vi.fn(() => mockEnv),
}));

describe('Storage Service', () => {
  let storageService;
  let StorageService;

  beforeEach(() => {
    // Reset modules to ensure fresh mock state
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Local Storage', () => {
    beforeEach(() => {
      mockEnv.STORAGE_PROVIDER = 'local';
      vi.resetModules();
      vi.clearAllMocks();
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      storageService = new StorageService();
    });

    it('should upload a valid image file to local storage', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      };
      
      const buffer = Buffer.from('fake image data');
      
      const result = await storageService.uploadFile(file, buffer, 'test');
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.url).toMatch(/^\/uploads\//);
      expect(result.key).toMatch(/^test-\d+-[a-f0-9]+\.jpg$/);
    });

    it('should reject files exceeding size limit', async () => {
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
      };
      
      const buffer = Buffer.alloc(16 * 1024 * 1024); // 16MB
      
      await expect(storageService.uploadFile(file, buffer, 'test')).rejects.toThrow(
        'Image file exceeds the maximum allowed size of 15MB'
      );
    });

    it('should reject invalid MIME types', async () => {
      const file = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload',
      };
      
      const buffer = Buffer.from('fake data');
      
      await expect(storageService.uploadFile(file, buffer, 'test')).rejects.toThrow(
        'Invalid image file type'
      );
    });

    it('should reject files with mismatched extensions', async () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'image/jpeg',
      };
      
      const buffer = Buffer.from('fake data');
      
      await expect(storageService.uploadFile(file, buffer, 'test')).rejects.toThrow(
        'File extension does not match the declared MIME type'
      );
    });

    it('should delete local files', async () => {
      const filename = 'test-123456-abc123.jpg';
      
      // Mock fs methods to avoid actual file operations
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
      
      await storageService.deleteFile(filename);
      
      expect(existsSpy).toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalled();
      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    it('should handle uploadExistingFile for local storage', async () => {
      const filePath = '/tmp/test-upload.jpg';
      const originalName = 'test.jpg';
      const mimetype = 'image/jpeg';
      
      // Mock fs.readFile and fs.unlink
      const readFileSpy = vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('fake data'));
      const unlinkSpy = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
      
      const result = await storageService.uploadExistingFile(filePath, originalName, mimetype, 'test');
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.url).toMatch(/^\/uploads\//);
      
      readFileSpy.mockRestore();
      unlinkSpy.mockRestore();
    });
  });

  describe('S3 Storage', () => {
    it('should have S3 upload methods available', () => {
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      const service = new StorageService();
      
      expect(typeof service.uploadToS3).toBe('function');
      expect(typeof service.deleteFromS3).toBe('function');
    });

    it('should generate safe filenames for S3 uploads', () => {
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      const service = new StorageService();
      
      const filename = service.generateSafeFilename('test.jpg', 's3-upload');
      expect(filename).toMatch(/^s3-upload-\d+-[a-f0-9]+\.jpg$/);
    });
  });

  describe('Configuration Validation', () => {
    it('should default to local when STORAGE_PROVIDER is not set', () => {
      delete mockEnv.STORAGE_PROVIDER;
      
      vi.resetModules();
      vi.clearAllMocks();
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      const service = new StorageService();
      
      expect(service.provider).toBe('local');
    });

    it('should validate S3 configuration when provider is s3', () => {
      mockEnv.STORAGE_PROVIDER = 's3';
      mockEnv.AWS_REGION = 'us-east-1';
      mockEnv.AWS_ACCESS_KEY_ID = 'test-key';
      mockEnv.AWS_SECRET_ACCESS_KEY = 'test-secret';
      mockEnv.AWS_S3_BUCKET = 'test-bucket';
      
      vi.resetModules();
      vi.clearAllMocks();
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      
      // Should not throw when all required credentials are present
      expect(() => new StorageService()).not.toThrow();
    });
  });

  describe('Security', () => {
    beforeEach(() => {
      mockEnv.STORAGE_PROVIDER = 'local';
      vi.resetModules();
      vi.clearAllMocks();
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      storageService = new StorageService();
    });

    it('should generate safe filenames without path traversal', () => {
      const maliciousName = '../../../etc/passwd';
      const safeName = storageService.generateSafeFilename(maliciousName, 'test');
      
      expect(safeName).not.toContain('..');
      expect(safeName).not.toContain('/');
      expect(safeName).toMatch(/^test-\d+-[a-f0-9]+$/);
    });

    it('should generate unique filenames', () => {
      const name1 = storageService.generateSafeFilename('test.jpg', 'test');
      const name2 = storageService.generateSafeFilename('test.jpg', 'test');
      
      expect(name1).not.toBe(name2);
    });

    it('should preserve file extensions in generated names', () => {
      const name = storageService.generateSafeFilename('test.png', 'test');
      
      expect(name).toMatch(/\.png$/);
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      mockEnv.STORAGE_PROVIDER = 'local';
      vi.resetModules();
      vi.clearAllMocks();
      const storageModule = require('../../services/storageService');
      StorageService = storageModule.StorageService;
      storageService = new StorageService();
    });

    it('should accept all allowed image types', async () => {
      const allowedTypes = [
        { name: 'test.jpg', mimetype: 'image/jpeg' },
        { name: 'test.jpeg', mimetype: 'image/jpeg' },
        { name: 'test.png', mimetype: 'image/png' },
        { name: 'test.webp', mimetype: 'image/webp' },
        { name: 'test.svg', mimetype: 'image/svg+xml' },
      ];
      
      for (const { name, mimetype } of allowedTypes) {
        const file = { originalname: name, mimetype };
        const buffer = Buffer.from('fake data');
        
        await expect(storageService.uploadFile(file, buffer, 'test')).resolves.toBeDefined();
      }
    });

    it('should reject missing file', async () => {
      await expect(storageService.uploadFile(null, Buffer.from('data'), 'test')).rejects.toThrow(
        'No file provided'
      );
    });
  });
});