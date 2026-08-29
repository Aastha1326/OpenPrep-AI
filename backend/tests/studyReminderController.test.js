const request = require('supertest');
const app = require('../server');

let authToken;
let reminderId;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Reminder Tester', email: `rem-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('StudyReminders API', () => {
  it('POST /api/reminders creates a reminder', async () => {
    const res = await request(app).post('/api/reminders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Morning Review', scheduledTime: '08:00', reminderType: 'daily', scheduledDays: [1, 2, 3, 4, 5] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enabled).toBe(true);
    reminderId = res.body.data.id;
  });

  it('POST /api/reminders returns 400 without title', async () => {
    const res = await request(app).post('/api/reminders')
      .set('Authorization', `Bearer ${authToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/reminders returns all reminders', async () => {
    const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/reminders/stats returns stats', async () => {
    const res = await request(app).get('/api/reminders/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('active');
    expect(res.body.data).toHaveProperty('byType');
  });

  it('GET /api/reminders/suggestions returns suggestions', async () => {
    const res = await request(app).get('/api/reminders/suggestions').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('aiSuggested', true);
  });

  it('PUT /api/reminders/:id/toggle toggles enabled state', async () => {
    const res = await request(app).put(`/api/reminders/${reminderId}/toggle`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.enabled).toBe(false);
  });

  it('PUT /api/reminders/:id/snooze snoozes a reminder', async () => {
    const res = await request(app).put(`/api/reminders/${reminderId}/snooze`)
      .set('Authorization', `Bearer ${authToken}`).send({ minutes: 15 });
    expect(res.status).toBe(200);
    expect(res.body.data.nextTriggerAt).toBeTruthy();
  });

  it('DELETE /api/reminders/:id deletes a reminder', async () => {
    const res = await request(app).delete(`/api/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/reminders');
    expect(res.status).toBe(401);
  });
});
