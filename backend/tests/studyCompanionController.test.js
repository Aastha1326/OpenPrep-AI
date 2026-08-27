const request = require('supertest');
const app = require('../server');

let authToken;
let sessionId;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Chat Tester', email: `chat-test-${Date.now()}@example.com`, password: 'TestPass123!',
  });
  authToken = res.body.token || res.body.data?.token;
});

describe('StudyCompanion Chat API', () => {
  it('POST /api/chat/sessions creates a session', async () => {
    const res = await request(app).post('/api/chat/sessions').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sessionId');
    sessionId = res.body.data.sessionId;
  });

  it('POST /api/chat/:sessionId/messages sends a message', async () => {
    const res = await request(app).post(`/api/chat/${sessionId}/messages`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'Hello! Can you give me some study tips?' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('assistant');
    expect(res.body.data.content).toBeTruthy();
  });

  it('POST /api/chat/:sessionId/messages rejects empty message', async () => {
    const res = await request(app).post(`/api/chat/${sessionId}/messages`)
      .set('Authorization', `Bearer ${authToken}`).send({ message: '' });
    expect(res.status).toBe(400);
  });

  it('GET /api/chat/:sessionId/messages returns history', async () => {
    const res = await request(app).get(`/api/chat/${sessionId}/messages`).set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/chat/sessions returns session list', async () => {
    const res = await request(app).get('/api/chat/sessions').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/chat/stats returns stats', async () => {
    const res = await request(app).get('/api/chat/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalMessages');
    expect(res.body.data).toHaveProperty('totalSessions');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/chat/sessions');
    expect(res.status).toBe(401);
  });
});
