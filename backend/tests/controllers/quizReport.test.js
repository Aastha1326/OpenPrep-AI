const request = require('supertest');
const express = require('express');
const { getQuizAttemptReportPDF } = require('../../controllers/quizController');
const QuizAttempt = require('../../models/QuizAttempt');
const Quiz = require('../../models/Quiz');
const Subject = require('../../models/Subject');

// Create mock Express app for routing test
function createTestApp() {
  const app = express();
  app.use(express.json());
  
  // Mock protect middleware
  const mockProtect = (req, res, next) => {
    req.user = { id: 'test-user-uuid' };
    next();
  };

  app.get('/api/quizzes/attempts/:attemptId/pdf', mockProtect, getQuizAttemptReportPDF);
  return app;
}

describe('Quiz Attempt Performance PDF Report', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  it('should return 200 and serve PDF file for a valid attempt owner', async () => {
    // 1. Mock DB queries
    const mockAttempt = {
      id: 'attempt-uuid',
      user: 'test-user-uuid',
      quiz: 'quiz-uuid',
      score: 85,
      totalQuestions: 2,
      timeSpent: 120,
      answers: [
        { questionId: 'q-1', selectedAnswer: 1, isCorrect: true },
        { questionId: 'q-2', selectedAnswer: 2, isCorrect: false }
      ],
      createdAt: new Date(),
    };
    
    const mockQuiz = {
      id: 'quiz-uuid',
      title: 'Mock Quiz Title',
      subject: 'subject-uuid',
      questions: [
        { id: 'q-1', questionText: 'Q1 Text', options: ['A', 'B', 'C'], correctAnswer: 1, explanation: 'Exp 1', topicName: 'Maths' },
        { id: 'q-2', questionText: 'Q2 Text', options: ['A', 'B', 'C'], correctAnswer: 0, explanation: 'Exp 2', topicName: 'Physics' }
      ]
    };

    const mockSubject = {
      id: 'subject-uuid',
      name: 'Science'
    };

    const findOneAttemptSpy = vi.spyOn(QuizAttempt, 'findOne').mockResolvedValueOnce(mockAttempt);
    const findByPkQuizSpy = vi.spyOn(Quiz, 'findByPk').mockResolvedValueOnce(mockQuiz);
    const findByPkSubjectSpy = vi.spyOn(Subject, 'findByPk').mockResolvedValueOnce(mockSubject);

    // 2. Perform Request
    const res = await request(app).get('/api/quizzes/attempts/attempt-uuid/pdf');

    // 3. Asserts
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('quiz_report_attempt-uuid.pdf');
    
    expect(findOneAttemptSpy).toHaveBeenCalledWith({
      where: { id: 'attempt-uuid', user: 'test-user-uuid' }
    });
    expect(findByPkQuizSpy).toHaveBeenCalledWith('quiz-uuid');
    expect(findByPkSubjectSpy).toHaveBeenCalledWith('subject-uuid');
  });

  it('should return 404 if the attempt does not exist or does not belong to the user', async () => {
    vi.spyOn(QuizAttempt, 'findOne').mockResolvedValueOnce(null);

    const res = await request(app).get('/api/quizzes/attempts/invalid-attempt/pdf');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('attempt not found');
  });

  it('should return 404 if the corresponding quiz of the attempt is missing', async () => {
    const mockAttempt = {
      id: 'attempt-uuid',
      user: 'test-user-uuid',
      quiz: 'missing-quiz-uuid',
      answers: []
    };

    vi.spyOn(QuizAttempt, 'findOne').mockResolvedValueOnce(mockAttempt);
    vi.spyOn(Quiz, 'findByPk').mockResolvedValueOnce(null);

    const res = await request(app).get('/api/quizzes/attempts/attempt-uuid/pdf');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Quiz not found');
  });
});
