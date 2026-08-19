const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const userRoutes = require('../../routes/userRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

// Minimal valid PNG buffer (8-byte signature + arbitrary padding)
function createTestPngBuffer() {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32, 0),
  ]);
}

describe('User Controller - Avatar Upload (Integration Tests)', () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherToken;
  const uploadedFiles = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_users';

    testUser = await User.create({
      name: 'Avatar User',
      email: 'avataruser@example.com',
      password: 'StrongPass1!',
    });

    otherUser = await User.create({
      name: 'Other Avatar User',
      email: 'otheravatar@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    otherToken = jwt.sign({ id: otherUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(() => {
    // Clean up any avatar files left on disk by these tests
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  // =========================================================================
  // PUT /api/users/avatar — Upload/replace avatar
  // =========================================================================
  describe('PUT /api/users/avatar', () => {
    it('should upload a first avatar and return 200', async () => {
      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestPngBuffer(), 'first.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toContain('/uploads/avatars/');

      uploadedFiles.push(path.join(__dirname, '../../', res.body.data.avatar));

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.avatar).toBe(res.body.data.avatar);
    });

    it('should delete the previous avatar file when a new one is uploaded (#477)', async () => {
      // Upload the first avatar
      const firstRes = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestPngBuffer(), 'old-avatar.png');

      expect(firstRes.status).toBe(200);
      const oldAvatarPath = path.join(__dirname, '../../', firstRes.body.data.avatar);
      expect(fs.existsSync(oldAvatarPath)).toBe(true);

      // Replace it with a second avatar
      const secondRes = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestPngBuffer(), 'new-avatar.png');

      expect(secondRes.status).toBe(200);
      const newAvatarPath = path.join(__dirname, '../../', secondRes.body.data.avatar);
      uploadedFiles.push(newAvatarPath);

      // The old file must be gone; the new one must exist
      expect(fs.existsSync(oldAvatarPath)).toBe(false);
      expect(fs.existsSync(newAvatarPath)).toBe(true);
      expect(newAvatarPath).not.toBe(oldAvatarPath);
    });

    it('should not accumulate orphan files across repeated uploads (#477)', async () => {
      const avatarPaths = [];

      for (let i = 0; i < 3; i += 1) {
        const res = await request(app)
          .put('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', createTestPngBuffer(), `avatar-${i}.png`);

        expect(res.status).toBe(200);
        avatarPaths.push(path.join(__dirname, '../../', res.body.data.avatar));
      }

      uploadedFiles.push(avatarPaths[avatarPaths.length - 1]);

      // Only the most recent avatar should remain on disk
      expect(fs.existsSync(avatarPaths[0])).toBe(false);
      expect(fs.existsSync(avatarPaths[1])).toBe(false);
      expect(fs.existsSync(avatarPaths[2])).toBe(true);
    });

    it('should reject a non-image file', async () => {
      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', Buffer.from('not an image'), 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject an executable renamed to .png (magic byte check)', async () => {
      const exePayload = Buffer.concat([
        Buffer.from([0x4d, 0x5a]),
        Buffer.alloc(64, 0),
      ]);

      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', exePayload, 'payload.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only JPEG and PNG images are allowed');
    });

    it('should return 400 Bad Request with clear error when avatar exceeds 2MB limit (#1184)', async () => {
      const oversizedBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(3 * 1024 * 1024, 0),
      ]);

      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', oversizedBuffer, 'oversized.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('File is too large. Maximum size is 2MB.');
    });

    it('should return 400 when no file is attached', async () => {
      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No avatar file uploaded');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put('/api/users/avatar')
        .attach('avatar', createTestPngBuffer(), 'noauth.png');

      expect(res.status).toBe(401);
    });

    it("should not affect another user's avatar", async () => {
      const res = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${otherToken}`)
        .attach('avatar', createTestPngBuffer(), 'other.png');

      expect(res.status).toBe(200);
      uploadedFiles.push(path.join(__dirname, '../../', res.body.data.avatar));

      const mainUser = await User.findByPk(testUser.id);
      const other = await User.findByPk(otherUser.id);
      expect(mainUser.avatar).not.toBe(other.avatar);
    });
  });

  // =========================================================================
  // DELETE /api/users/avatar — Remove avatar
  // =========================================================================
  describe('DELETE /api/users/avatar', () => {
    it('should remove the avatar file and clear the field', async () => {
      const uploadRes = await request(app)
        .put('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', createTestPngBuffer(), 'to-remove.png');

      const avatarPath = path.join(__dirname, '../../', uploadRes.body.data.avatar);
      expect(fs.existsSync(avatarPath)).toBe(true);

      const deleteRes = await request(app)
        .delete('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.avatar).toBe('');
      expect(fs.existsSync(avatarPath)).toBe(false);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.avatar).toBe('');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/api/users/avatar');
      expect(res.status).toBe(401);
    });
  });
});
