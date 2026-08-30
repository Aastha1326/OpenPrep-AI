const request = require('supertest');
const app = require('../server');

let authToken;
beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Streak Tester', email: `streak-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('StudyStreaks API', () => {
  it('POST /api/streaks/record creates/updates today\'s record', async () => {
    const res = await request(app).post('/api/streaks/record')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ studyMinutes: 45, quizzesTaken: 2, topicsReviewed: 3 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.active).toBe(true);
    expect(res.body.stats).toHaveProperty('currentStreak');
  });

  it('GET /api/streaks/stats returns full stats', async () => {
    const res = await request(app).get('/api/streaks/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentStreak');
    expect(res.body.data).toHaveProperty('longestStreak');
    expect(res.body.data).toHaveProperty('totalActiveDays');
    expect(res.body.data).toHaveProperty('thisWeek');
  });

  it('GET /api/streaks/heatmap returns calendar data', async () => {
    const res = await request(app).get('/api/streaks/heatmap?days=30').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(31);
    expect(res.body.data[0]).toHaveProperty('date');
    expect(res.body.data[0]).toHaveProperty('intensity');
  });

  it('GET /api/streaks/weekly returns weekly data', async () => {
    const res = await request(app).get('/api/streaks/weekly?weeks=4').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4);
    expect(res.body.data[0]).toHaveProperty('consistencyPct');
  });

  it('GET /api/streaks/prediction returns prediction', async () => {
    const res = await request(app).get('/api/streaks/prediction').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('predictedMaintain7Days');
    expect(res.body.data).toHaveProperty('recommendation');
  });

  it('GET /api/streaks/current returns current streak', async () => {
    const res = await request(app).get('/api/streaks/current').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentStreak');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/streaks/stats');
    expect(res.status).toBe(401);
  });
});
