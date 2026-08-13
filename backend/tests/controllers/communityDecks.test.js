const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const communityRoutes = require('../../routes/communityRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Exam = require('../../models/Exam');
const DeckRating = require('../../models/DeckRating');

const app = express();
app.use(express.json());
app.use('/api/community', communityRoutes);
app.use(errorHandler);

describe('Community Decks and Ratings API', () => {
  let testUser;
  let peerUser;
  let authToken;
  let peerToken;
  let testExam;
  let publicDeck;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_community_decks';

    testUser = await User.create({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'password123',
    });

    peerUser = await User.create({
      name: 'Peer User',
      email: 'peer@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    peerToken = jwt.sign({ id: peerUser.id, type: 'access' }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Test Exam',
      user: testUser.id,
      date: new Date(),
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await DeckRating.destroy({ where: {} });
    await Subject.destroy({ where: {} });

    publicDeck = await Subject.create({
      name: 'Public Biology Deck',
      description: 'Intro to biology',
      exam: testExam.id,
      user: testUser.id,
      isPublic: true,
      cloneCount: 0,
      rating: 0.0,
      ratingsCount: 0,
    });
  });

  describe('POST /api/community/decks/:id/rate', () => {
    it('should allow peer to rate a public deck and update ratings dynamically', async () => {
      const res = await request(app)
        .post(`/api/community/decks/${publicDeck.id}/rate`)
        .set('Authorization', `Bearer ${peerToken}`)
        .send({ stars: 5, comment: 'Awesome deck!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deckRating).toBe(5);
      expect(res.body.data.deckRatingsCount).toBe(1);

      // Verify DB update
      const updatedDeck = await Subject.findByPk(publicDeck.id);
      expect(updatedDeck.rating).toBe(5);
      expect(updatedDeck.ratingsCount).toBe(1);
    });

    it('should disallow authors from rating their own decks', async () => {
      const res = await request(app)
        .post(`/api/community/decks/${publicDeck.id}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stars: 4 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot rate your own deck');
    });

    it('should reject invalid star values', async () => {
      const res = await request(app)
        .post(`/api/community/decks/${publicDeck.id}/rate`)
        .set('Authorization', `Bearer ${peerToken}`)
        .send({ stars: 6 });

      expect(res.status).toBe(400);
    });
  });
});
