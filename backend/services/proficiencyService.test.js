const { calculateTopicProficiency, getDifficultyLevel } = require('./proficiencyService');

// Mock Sequelize models
jest.mock('../models/QuizAttempt', () => ({
  findAll: jest.fn().mockResolvedValue([
    { score: 80, totalQuestions: 10, timeSpent: 200000 }, // Good score, reasonable time
    { score: 30, totalQuestions: 10, timeSpent: 400000 }, // Poor score, slow
  ]),
}));
jest.mock('../models/Quiz', () => ({
  findAll: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
}));

describe('proficiencyService', () => {
  test('should calculate proficiency correctly', async () => {
    const proficiency = await calculateTopicProficiency(1, 1, 1);
    expect(proficiency).toBeGreaterThan(0);
    expect(proficiency).toBeLessThanOrEqual(1);
  });

  test('should return correct difficulty level', () => {
    expect(getDifficultyLevel(0.2)).toBe('Easy');
    expect(getDifficultyLevel(0.5)).toBe('Medium');
    expect(getDifficultyLevel(0.9)).toBe('Hard');
  });
});
