const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const searchRoutes = require('../../routes/searchRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Topic = require('../../models/Topic');
const FlashcardDeck = require('../../models/FlashcardDeck');
const Quiz = require('../../models/Quiz');
const Subject = require('../../models/Subject');
const Exam = require('../../models/Exam');
const StudyPlan = require('../../models/StudyPlan');

const app = express();
app.use(express.json());
app.use('/api/search', searchRoutes);
app.use(errorHandler);

describe('Global Search API', () => {
  let testUser;
  let authToken;
  let testExam;
  let testSubject;
  let testStudyPlan;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_search_tests';

    testUser = await User.create({
      name: 'Search Tester',
      email: 'search@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Search Exam',
      user: testUser.id,
      date: new Date(),
    });

    testSubject = await Subject.create({
      name: 'Chemistry Subject',
      exam: testExam.id,
      user: testUser.id,
    });

    // Seed mock search targets
    await Topic.create({
      name: 'Acids and Bases Chemistry',
      subject: testSubject.id,
      user: testUser.id,
    });

    await FlashcardDeck.create({
      name: 'Chemistry Flashcards',
      subject: testSubject.id,
      user: testUser.id,
    });

    await Quiz.create({
      title: 'Chemistry Midterm Mock Quiz',
      subject: testSubject.id,
      createdBy: testUser.id,
    });

    // Create a study plan with tasks for testing
    testStudyPlan = await StudyPlan.create({
      exam: testExam.id,
      user: testUser.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dailyGoals: [
        { title: 'Study organic chemistry reactions', completed: false },
        { task: 'Practice acid-base titration problems', completed: true },
        { text: 'Review chemical bonding concepts', completed: false },
      ],
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
    // Clean up study plan
    if (testStudyPlan) {
      await testStudyPlan.destroy();
    }
  });

  it('should return matching results grouped by type when query matches multiple objects', async () => {
    const res = await request(app)
      .get('/api/search?q=chemistry')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const { topics, decks, quizzes, tasks } = res.body.data;
    expect(topics).toHaveLength(1);
    expect(topics[0].name).toContain('Acids and Bases Chemistry');

    expect(decks).toHaveLength(1);
    expect(decks[0].name).toContain('Chemistry Flashcards');

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toContain('Chemistry Midterm Mock');

    expect(tasks).toBeDefined();
  });

  it('should return empty results when query is blank or does not match', async () => {
    const res = await request(app)
      .get('/api/search?q=nonexistentqueryxyz')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.topics).toHaveLength(0);
    expect(res.body.data.decks).toHaveLength(0);
    expect(res.body.data.quizzes).toHaveLength(0);
    expect(res.body.data.tasks).toHaveLength(0);
  });

  it('should return matching study plan tasks from dailyGoals JSONB', async () => {
    const res = await request(app)
      .get('/api/search?q=organic')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks).toBeDefined();
    expect(res.body.data.tasks.length).toBeGreaterThan(0);
    
    const task = res.body.data.tasks.find(t => t.title.includes('organic'));
    expect(task).toBeDefined();
    expect(task.title).toContain('organic');
    expect(task.planId).toBe(testStudyPlan.id);
    expect(task.completed).toBe(false);
  });

  it('should match tasks with different field names (title, task, text)', async () => {
    const res = await request(app)
      .get('/api/search?q=titration')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks).toBeDefined();
    
    const task = res.body.data.tasks.find(t => t.title.includes('titration'));
    expect(task).toBeDefined();
    expect(task.title).toContain('titration');
  });

  it('should perform case-insensitive search in study plan tasks', async () => {
    const resLower = await request(app)
      .get('/api/search?q=chemical')
      .set('Authorization', `Bearer ${authToken}`);

    const resUpper = await request(app)
      .get('/api/search?q=CHEMICAL')
      .set('Authorization', `Bearer ${authToken}`);

    expect(resLower.status).toBe(200);
    expect(resUpper.status).toBe(200);
    expect(resLower.body.data.tasks.length).toBe(resUpper.body.data.tasks.length);
  });

  it('should limit study plan task results to 10', async () => {
    // Create a study plan with many tasks
    const largeStudyPlan = await StudyPlan.create({
      exam: testExam.id,
      user: testUser.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dailyGoals: Array.from({ length: 15 }, (_, i) => ({
        title: `Chemistry task ${i}`,
        completed: false,
      })),
    });

    const res = await request(app)
      .get('/api/search?q=Chemistry')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks.length).toBeLessThanOrEqual(10);

    // Clean up
    await largeStudyPlan.destroy();
  });
});
