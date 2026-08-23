const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  encryptFile,
  decryptFile,
  pruneLocalBackups,
} = require('../../services/backupService');

describe('Database Backup Encryption & Pruning Service', () => {
  const testDir = path.join(__dirname, 'temp_backup_service_tests');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Symmetric File Encryption & Decryption', () => {
    it('should encrypt a plaintext file and decrypt it back to original content', async () => {
      const plainText = 'OpenPrep AI database dump secure contents 2026';
      const plainFilePath = path.join(testDir, 'test-db.sql.gz');
      const encFilePath = path.join(testDir, 'test-db.sql.gz.enc');
      const decFilePath = path.join(testDir, 'test-db-decrypted.sql.gz');

      // Write test data
      fs.writeFileSync(plainFilePath, plainText);

      const encryptionKey = 'super-secret-vault-key-xyz';

      // 1. Encrypt
      await expect(encryptFile(plainFilePath, encFilePath, encryptionKey)).resolves.not.toThrow();
      expect(fs.existsSync(encFilePath)).toBe(true);

      // Verify the encrypted file is different from plaintext
      const encContent = fs.readFileSync(encFilePath).toString();
      expect(encContent).not.toBe(plainText);

      // 2. Decrypt
      await expect(decryptFile(encFilePath, decFilePath, encryptionKey)).resolves.not.toThrow();
      expect(fs.existsSync(decFilePath)).toBe(true);

      // Verify decrypted content matches original plaintext
      const decContent = fs.readFileSync(decFilePath).toString();
      expect(decContent).toBe(plainText);
    });

    it('should fail decryption if wrong key is provided', async () => {
      const plainText = 'Confidential data';
      const plainFilePath = path.join(testDir, 'conf.txt');
      const encFilePath = path.join(testDir, 'conf.txt.enc');
      const decFilePath = path.join(testDir, 'conf-decrypted.txt');

      fs.writeFileSync(plainFilePath, plainText);

      await encryptFile(plainFilePath, encFilePath, 'key-1');

      // Try decrypting with key-2 (wrong key)
      // Node crypto decipher will typically throw during decryption process due to bad padding/block check
      await expect(decryptFile(encFilePath, decFilePath, 'key-2')).rejects.toThrow();
    });
  });

  describe('pruneLocalBackups', () => {
    it('should prune local files (.sql.gz and .enc) older than maxAgeDays', () => {
      const now = Date.now();
      const oldPlain = path.join(testDir, 'backup-old.sql.gz');
      const oldEnc = path.join(testDir, 'backup-old.sql.gz.enc');
      const recentEnc = path.join(testDir, 'backup-recent.sql.gz.enc');

      fs.writeFileSync(oldPlain, 'dummy data');
      fs.writeFileSync(oldEnc, 'dummy data');
      fs.writeFileSync(recentEnc, 'dummy data');

      // Modify modified times to 20 days ago
      const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);
      fs.utimesSync(oldPlain, twentyDaysAgo, twentyDaysAgo);
      fs.utimesSync(oldEnc, twentyDaysAgo, twentyDaysAgo);

      const pruned = pruneLocalBackups(testDir, 14);

      expect(pruned).toContain('backup-old.sql.gz');
      expect(pruned).toContain('backup-old.sql.gz.enc');
      expect(fs.existsSync(oldPlain)).toBe(false);
      expect(fs.existsSync(oldEnc)).toBe(false);
      expect(fs.existsSync(recentEnc)).toBe(true);
    });
  });
});
