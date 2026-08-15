const readinessController = require('../../controllers/readinessController');
const QuizAttempt = require('../../models/QuizAttempt');
const Subject = require('../../models/Subject');

describe('Readiness Projection Controller - Unit Tests', () => {
  it('should return 200 with readiness projection payload', async () => {
    const fakeUser = { id: '11111111-1111-1111-1111-111111111111' };

    vi.spyOn(QuizAttempt, 'findAll').mockResolvedValue([
      { scorePercentage: 65, createdAt: new Date() },
      { scorePercentage: 72, createdAt: new Date() },
      { scorePercentage: 78, createdAt: new Date() },
    ]);
    vi.spyOn(Subject, 'findAll').mockResolvedValue([{ id: 's1', name: 'Mathematics' }]);

    const req = {
      user: fakeUser,
      query: { dailyHours: '3', targetScore: '85' },
    };

    let statusCode = null;
    let responseData = null;

    const res = {
      status(c) {
        statusCode = c;
        return this;
      },
      json(d) {
        responseData = d;
        return this;
      },
    };

    await readinessController.getReadinessProjection(req, res, (err) => {
      if (err) throw err;
    });

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeDefined();
    expect(responseData.data.insufficientData).toBe(false);

    QuizAttempt.findAll.mockRestore();
    Subject.findAll.mockRestore();
  });
});
