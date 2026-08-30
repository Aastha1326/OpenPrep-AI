const request = require('supertest');
const app = require('../server');

let authToken;
beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Milestone Tester', email: `mile-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('Milestones API', () => {
  it('POST /api/milestones/evaluate initializes and evaluates milestones', async () => {
    const res = await request(app).post('/api/milestones/evaluate').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.milestones)).toBe(true);
    expect(res.body.data.milestones.length).toBeGreaterThan(0);
  });

  it('GET /api/milestones returns all milestones', async () => {
    const res = await request(app).get('/api/milestones').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/milestones/stats returns stats', async () => {
    const res = await request(app).get('/api/milestones/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('earned');
    expect(res.body.data).toHaveProperty('byTier');
  });

  it('PUT /api/milestones/:id/claim rejects unearned milestone', async () => {
    const listRes = await request(app).get('/api/milestones').set('Authorization', `Bearer ${authToken}`);
    const lockedMilestone = listRes.body.data.find((m) => m.status === 'locked');
    if (lockedMilestone) {
      const res = await request(app).put(`/api/milestones/${lockedMilestone.id}/claim`).set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    }
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/milestones');
    expect(res.status).toBe(401);
  });
});
