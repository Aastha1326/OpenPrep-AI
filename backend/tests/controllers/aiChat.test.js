const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const aiRoutes = require('../../routes/aiRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const geminiService = require('../../services/geminiService');

// Mock geminiService chat method
vi.mock('../../services/geminiService', () => {
  const original = vi.requireActual('../../services/geminiService');
  return {
    ...original,
    generateChatResponse: vi.fn(),
  };
});

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

describe('AI Chat Assistant Endpoint', () => {
  let testUser;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_chat';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    vi.clearAllMocks();

    testUser = await User.create({
      name: 'Chat Student',
      email: 'chatstudent@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  it('should resolve academic voice queries successfully via chat', async () => {
    geminiService.generateChatResponse.mockResolvedValueOnce(
      'An atom is the basic unit of a chemical element.'
    );

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'What is an atom?',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.text).toBe('An atom is the basic unit of a chemical element.');
    expect(geminiService.generateChatResponse).toHaveBeenCalledWith({
      message: 'What is an atom?',
      history: [],
    });
  });

  it('should reject requests with empty message content', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('content is required');
  });

  it('should enforce authentication on the chat endpoint', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: 'What is an atom?',
      });

    expect(res.status).toBe(401);
  });
});
