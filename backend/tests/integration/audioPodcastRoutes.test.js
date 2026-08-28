const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const flashcardRoutes = require('../../routes/flashcardRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const FlashcardDeck = require('../../models/FlashcardDeck');
const Flashcard = require('../../models/Flashcard');
const PodcastEpisode = require('../../models/PodcastEpisode');

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);
app.use(errorHandler);

describe('Audio Flashcard Podcast Routes Integration Tests', () => {
  let testUser;
  let authToken;
  let testDeck;
  let testFlashcard;
  let generatedPodcastId;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_audio_podcasts';
    const { sequelize } = require('../../config/db');
    await sequelize.sync();

    testUser = await User.create({
      name: 'Podcast Student',
      email: `podcast-student-${Date.now()}@example.com`,
      password: 'Password123!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testDeck = await FlashcardDeck.create({
      name: 'Neurology Basics',
      user: testUser.id,
      isPublic: false,
    });

    testFlashcard = await Flashcard.create({
      user: testUser.id,
      subject: testDeck.id,
      deckId: testDeck.id,
      front: 'What is a neuron?',
      back: 'A specialized cell transmitting nerve impulses.',
      hint: 'Basic unit of the brain.',
    });
  });

  afterAll(async () => {
    if (generatedPodcastId) {
      await PodcastEpisode.destroy({ where: { id: generatedPodcastId } });
    }
    if (testFlashcard) await testFlashcard.destroy();
    if (testDeck) await testDeck.destroy();
    if (testUser) await testUser.destroy();
  });

  describe('POST /api/flashcards/:deckId/generate-podcast', () => {
    it('should return 401 if request is unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/flashcards/${testDeck.id}/generate-podcast`)
        .send({ ambientTrack: 'lofi' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if deck is not found', async () => {
      const fakeDeckId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/flashcards/${fakeDeckId}/generate-podcast`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ambientTrack: 'rain' });

      expect(res.statusCode).toBe(404);
    });

    it('should generate a podcast episode for a valid deck', async () => {
      const res = await request(app)
        .post(`/api/flashcards/${testDeck.id}/generate-podcast`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ambientTrack: 'lofi' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.audioUrl).toContain('/uploads/podcasts/');
      expect(res.body.data.transcript).toBeInstanceOf(Array);
      expect(res.body.data.transcript.length).toBeGreaterThan(0);

      generatedPodcastId = res.body.data.id;
    });
  });

  describe('GET /api/flashcards/podcasts/:id', () => {
    it('should retrieve podcast audio URL and timestamped transcript by ID', async () => {
      expect(generatedPodcastId).toBeDefined();

      const res = await request(app)
        .get(`/api/flashcards/podcasts/${generatedPodcastId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(generatedPodcastId);
      expect(res.body.data.audioUrl).toContain('/uploads/podcasts/');
      expect(res.body.data.transcript).toBeInstanceOf(Array);

      const firstLine = res.body.data.transcript[0];
      expect(firstLine).toHaveProperty('speaker');
      expect(firstLine).toHaveProperty('text');
      expect(firstLine).toHaveProperty('timestamp');
      expect(firstLine).toHaveProperty('startSec');
    });

    it('should return 404 for a non-existent podcast ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/flashcards/podcasts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
