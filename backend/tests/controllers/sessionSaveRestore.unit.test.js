const request = require('supertest');
const app = require('../../server');
const { SavedSession } = require('../../models');

describe('Session Save & Restore Middleware & Controller', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/session/save', () => {
    it('should save serialized session state for authenticated user', async () => {
      const mockSavedRecord = {
        id: 'session-uuid-1',
        userId: 'user-uuid-101',
        payload: { currentRoute: '/quiz/123', answers: { q1: 'A' } },
        expiresAt: new Date(Date.now() + 86400000),
        restored: false,
        createdAt: new Date(),
      };

      vi.spyOn(SavedSession, 'destroy').mockResolvedValue(1);
      vi.spyOn(SavedSession, 'create').mockResolvedValue(mockSavedRecord);

      const response = await request(app)
        .post('/api/session/save')
        .send({
          userId: 'user-uuid-101',
          payload: { currentRoute: '/quiz/123', answers: { q1: 'A' } },
          reason: 'AUTO_SAVE_PRE_EXPIRY',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe('session-uuid-1');
      expect(SavedSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-101',
          restored: false,
        })
      );
    });

    it('should return 400 if user ID or payload is missing', async () => {
      const response = await request(app).post('/api/session/save').send({ payload: {} });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/session/saved', () => {
    it('should retrieve active un-restored saved session for user', async () => {
      const mockSession = {
        id: 'session-uuid-1',
        userId: 'user-uuid-101',
        payload: { currentRoute: '/interview/room-1' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      };

      vi.spyOn(SavedSession, 'findOne').mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/session/saved')
        .query({ userId: 'user-uuid-101' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hasSavedSession).toBe(true);
      expect(response.body.session.payload.currentRoute).toBe('/interview/room-1');
    });

    it('should return hasSavedSession false when no saved session exists', async () => {
      vi.spyOn(SavedSession, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .get('/api/session/saved')
        .query({ userId: 'user-uuid-101' });

      expect(response.status).toBe(200);
      expect(response.body.hasSavedSession).toBe(false);
      expect(response.body.session).toBeNull();
    });
  });

  describe('POST /api/session/restore and DELETE /api/session/saved', () => {
    it('should mark saved session as restored when action is restore', async () => {
      vi.spyOn(SavedSession, 'update').mockResolvedValue([1]);

      const response = await request(app)
        .post('/api/session/restore')
        .send({ userId: 'user-uuid-101', sessionId: 'session-uuid-1', action: 'restore' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(SavedSession.update).toHaveBeenCalledWith(
        { restored: true },
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-uuid-101' }) })
      );
    });

    it('should discard saved session when DELETE /api/session/saved is invoked', async () => {
      vi.spyOn(SavedSession, 'destroy').mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/session/saved')
        .send({ userId: 'user-uuid-101' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(SavedSession.destroy).toHaveBeenCalled();
    });
  });
});
