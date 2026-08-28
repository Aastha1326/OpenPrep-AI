const request = require('supertest');
const app = require('../server');

let authToken;
beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Tip Tester', email: `tip-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('StudyTips API', () => {
  it('GET /api/study-tips/active returns 200', async () => {
    const res = await request(app).get('/api/study-tips/active').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/study-tips returns paginated list', async () => {
    const res = await request(app).get('/api/study-tips').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('totalItems');
  });

  it('GET /api/study-tips/stats returns stats object', async () => {
    const res = await request(app).get('/api/study-tips/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('viewRate');
  });

  it('PUT /api/study-tips/:id/rate rejects non-boolean helpful', async () => {
    const res = await request(app).put('/api/study-tips/00000000-0000-0000-0000-000000000000/rate')
      .set('Authorization', `Bearer ${authToken}`).send({ helpful: 'yes' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/study-tips/active');
    expect(res.status).toBe(401);
  });
});
