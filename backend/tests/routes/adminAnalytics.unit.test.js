const request = require('supertest');
const app = require('../../server');
const { User } = require('../../models');
const jwt = require('jsonwebtoken');

describe('Admin Usage Analytics Route & Access Control', () => {
  let adminToken;
  let studentToken;

  beforeEach(() => {
    vi.restoreAllMocks();

    const secret = process.env.JWT_SECRET || 'test_secret_key_123';
    adminToken = jwt.sign({ id: 'admin-user-id', role: 'admin', type: 'access' }, secret);
    studentToken = jwt.sign({ id: 'student-user-id', role: 'student', type: 'access' }, secret);
  });

  describe('GET /api/admin/analytics', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const response = await request(app).get('/api/admin/analytics');
      expect(response.status).toBe(401);
    });

    it('should deny non-admin student users with 403 Forbidden', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue({
        id: 'student-user-id',
        role: 'student',
      });

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error || response.body.message).toMatch(/admin/i);
    });

    it('should return 200 with comprehensive analytics data for admin users', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue({
        id: 'admin-user-id',
        role: 'admin',
      });
      vi.spyOn(User, 'count').mockResolvedValue(120);

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('interviewMetrics');
      expect(response.body.data).toHaveProperty('quizMetrics');
      expect(response.body.data).toHaveProperty('systemHealth');
      expect(response.body.data.systemHealth.status).toBe('healthy');
    });
  });
});
