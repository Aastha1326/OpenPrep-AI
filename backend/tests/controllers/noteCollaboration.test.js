const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const noteRoutes = require('../../routes/noteRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Note = require('../../models/Note');

const app = express();
app.use(express.json());
app.use('/api/notes', noteRoutes);
app.use(errorHandler);

describe('Note Collaboration Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testSubject;
  let testNote;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_notes';

    testUser = await User.create({
      name: 'Collaborator Note Writer',
      email: 'notescoll@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testSubject = await Subject.create({
      name: 'System Design',
      user: testUser.id,
      exam: '00000000-0000-0000-0000-000000000000',
    });

    testNote = await Note.create({
      title: 'CRDT Notes',
      content: 'Initial contents of note.',
      subject: testSubject.id,
      user: testUser.id,
    });
  });

  afterAll(async () => {
    await testNote.destroy();
    await testSubject.destroy();
    await testUser.destroy();
  });

  describe('POST /api/notes/:id/share', () => {
    it('sets isCollaborative to true and generates collaboration invitation url', async () => {
      const res = await request(app)
        .post(`/api/notes/${testNote.id}/share`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCollaborative).toBe(true);
      expect(res.body.data.inviteLink).toContain('/notes/collaborative/');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('successfully retrieves single note including collaborative fields', async () => {
      const res = await request(app)
        .get(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCollaborative).toBe(true);
      expect(res.body.data.title).toBe('CRDT Notes');
    });
  });
});
