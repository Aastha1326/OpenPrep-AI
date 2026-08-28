const request = require('supertest');
const app = require('../server');

let authToken;
beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Strategy Tester', email: `strat-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('ExamStrategy API', () => {
  it('POST /api/exam-strategies/generate returns 400 without examId', async () => {
    const res = await request(app).post('/api/exam-strategies/generate')
      .set('Authorization', `Bearer ${authToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/exam-strategies/active returns 200', async () => {
    const res = await request(app).get('/api/exam-strategies/active')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/exam-strategies returns paginated list', async () => {
    const res = await request(app).get('/api/exam-strategies')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/exam-strategies/:id/feedback rejects invalid rating', async () => {
    const res = await request(app).put('/api/exam-strategies/00000000-0000-0000-0000-000000000000/feedback')
      .set('Authorization', `Bearer ${authToken}`).send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/exam-strategies/active');
    expect(res.status).toBe(401);
  });
});
