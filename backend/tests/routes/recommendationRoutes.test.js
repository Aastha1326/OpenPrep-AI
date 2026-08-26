const request = require('supertest');
const app = require('../../server');
const quizRecommendationService = require('../../services/quizRecommendationService');

describe('Quiz Recommendation Routes API Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /recommendations/:userId', () => {
    it('should return personalized quiz recommendations for valid user', async () => {
      const mockRecommendations = {
        userId: 'user-rec-999',
        userProfile: { overallAccuracy: 78, weakTopics: ['Data Structures'], strongTopics: ['Algorithms'] },
        recommendations: [
          {
            id: 'quiz-ds-01',
            title: 'Data Structures & Trees Basics',
            topic: 'Data Structures',
            difficulty: 'medium',
            estimatedMinutes: 8,
            recommendationScore: 95,
            matchReason: 'Targets identified weak topic: Data Structures',
          },
        ],
      };

      vi.spyOn(quizRecommendationService, 'getRecommendedQuizzes').mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/recommendations/user-rec-999')
        .query({ timeBudget: 10, limit: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('user-rec-999');
      expect(response.body.recommendations).toHaveLength(1);
      expect(response.body.recommendations[0].topic).toBe('Data Structures');
    });

    it('should also respond on /api/recommendations/:userId canonical route', async () => {
      vi.spyOn(quizRecommendationService, 'getRecommendedQuizzes').mockResolvedValue({
        userId: 'user-rec-999',
        userProfile: { overallAccuracy: 80, weakTopics: [], strongTopics: [] },
        recommendations: [],
      });

      const response = await request(app).get('/api/recommendations/user-rec-999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /recommendations/:userId/hit', () => {
    it('should log recommendation hit event', async () => {
      vi.spyOn(quizRecommendationService, 'recordRecommendationHit').mockResolvedValue({
        success: true,
        loggedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/recommendations/user-rec-999/hit')
        .send({
          quizId: 'quiz-ds-01',
          recommendationScore: 95,
          topic: 'Data Structures',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged successfully');
    });
  });
});
