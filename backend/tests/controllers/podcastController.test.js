const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const podcastRoutes = require('../../routes/podcastRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Flashcard = require('../../models/Flashcard');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api/podcast', podcastRoutes);
app.use(errorHandler);

describe('Podcast Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testSubject;
  let testFlashcard;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_podcasts';

    testUser = await User.create({
      name: 'Podcast Listener',
      email: 'podcast@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testSubject = await Subject.create({
      name: 'Cardiology 101',
      description: 'Deck description',
      user: testUser.id,
      exam: '00000000-0000-0000-0000-000000000000',
    });

    testFlashcard = await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'What is the aorta?',
      back: 'The main artery supplying oxygenated blood to the body.',
    });
  });

  afterAll(async () => {
    await testFlashcard.destroy();
    await testSubject.destroy();
    await testUser.destroy();

    // Clean up any generated test audio file
    const testFilePath = path.join(__dirname, '../../uploads', `podcast-${testUser.id}-${testSubject.id}-page1.mp3`);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('POST /api/podcast/decks/:id/generate-podcast', () => {
    it('generates MP3 revision episode and logs database entity', async () => {
      const res = await request(app)
        .post(`/api/podcast/decks/${testSubject.id}/generate-podcast`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.audioUrl).toContain('podcast-');
      expect(res.body.data.durationSeconds).toBeGreaterThan(0);
    });

    it('returns 400 bad request if target deck is empty', async () => {
      const emptySubject = await Subject.create({
        name: 'Empty Deck',
        user: testUser.id,
        exam: '00000000-0000-0000-0000-000000000000',
      });

      const res = await request(app)
        .post(`/api/podcast/decks/${emptySubject.id}/generate-podcast`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      await emptySubject.destroy();
    });
  });

  describe('GET /api/podcast/decks/:id/podcasts', () => {
    it('returns history of generated podcast revision episodes', async () => {
      const res = await request(app)
        .get(`/api/podcast/decks/${testSubject.id}/podcasts`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
