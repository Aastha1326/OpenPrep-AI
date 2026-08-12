const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const flashcardRoutes = require('../../routes/flashcardRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);
app.use(errorHandler);

describe('Community Decks - Rate & Star Endpoint Tests', () => {
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_rate_star';
    authToken = jwt.sign({ id: 'mock-user-id', type: 'access' }, process.env.JWT_SECRET);
  });

  it('successfully rates a public flashcard deck and updates moving average', async () => {
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      id: 'mock-user-id',
      name: 'Test Contributor',
      email: 'contributor@example.com',
    });

    const mockSubject = {
      id: 'mock-deck-id',
      name: 'Calculus Advanced',
      isPublic: true,
      rating: 4.0,
      ratingCount: 2,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Subject, 'findOne').mockResolvedValue(mockSubject);

    const res = await request(app)
      .post('/api/flashcards/decks/mock-deck-id/rate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(4.33); // (4.0 * 2 + 5) / 3 = 13 / 3 = 4.3333...
    expect(res.body.data.ratingCount).toBe(3);
    expect(mockSubject.save).toHaveBeenCalled();
  });

  it('successfully stars a public flashcard deck and increments star count', async () => {
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      id: 'mock-user-id',
      name: 'Test Contributor',
      email: 'contributor@example.com',
    });

    const mockSubject = {
      id: 'mock-deck-id',
      name: 'Calculus Advanced',
      isPublic: true,
      starCount: 10,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Subject, 'findOne').mockResolvedValue(mockSubject);

    const res = await request(app)
      .post('/api/flashcards/decks/mock-deck-id/star')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.starCount).toBe(11);
    expect(mockSubject.save).toHaveBeenCalled();
  });
});
