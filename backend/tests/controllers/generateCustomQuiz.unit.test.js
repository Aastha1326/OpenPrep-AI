const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const quizRoutes = require('../../routes/quizRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const PYQAnalysis = require('../../models/PYQAnalysis');
const PYQQuestion = require('../../models/PYQQuestion');
const Quiz = require('../../models/Quiz');
const geminiService = require('../../services/geminiService');

const app = express();
app.use(express.json());
app.use('/api/quizzes', quizRoutes);
app.use(errorHandler);

describe('generateCustomQuiz Controller Endpoint', () => {
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_custom_quiz';
    authToken = jwt.sign({ id: 'mock-user-id', type: 'access' }, process.env.JWT_SECRET);
  });

  it('successfully generates a custom revision test', async () => {
    // Stub Gemini Service
    vi.spyOn(geminiService, 'generateCustomQuiz').mockResolvedValue({
      title: 'Thermodynamics Custom Test',
      questions: [
        {
          questionText: 'Mock Custom Question 1?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 1,
          explanation: 'Mock explanation 1',
        },
      ],
    });

    // Stub Sequelize model calls
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      id: 'mock-user-id',
      name: 'Custom Quiz User',
      email: 'customquiz@example.com',
    });

    vi.spyOn(Subject, 'findByPk').mockResolvedValue({
      id: 'mock-subject-id',
      name: 'Physics',
    });

    vi.spyOn(PYQAnalysis, 'findAll').mockResolvedValue([
      { id: 'mock-analysis-id' },
    ]);

    vi.spyOn(PYQQuestion, 'findAll').mockResolvedValue([
      {
        id: 'mock-question-id',
        year: 2022,
        topicName: 'Entropy',
        marks: 5,
        questionText: 'What is the second law of thermodynamics?',
      },
    ]);

    vi.spyOn(Quiz, 'create').mockImplementation(async (data) => {
      return {
        id: 'mock-quiz-id',
        ...data,
      };
    });

    const res = await request(app)
      .post('/api/quizzes/generate-custom')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: 'mock-subject-id',
        topics: ['Entropy'],
        difficulty: 'medium',
        years: [2022],
        count: 5,
        timeLimit: 15,
        language: 'english',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Thermodynamics Custom Test');
    expect(res.body.data.timeLimit).toBe(15);
    expect(res.body.data.questions.length).toBe(1);
    expect(res.body.data.questions[0].questionText).toBe('Mock Custom Question 1?');
  });
});
