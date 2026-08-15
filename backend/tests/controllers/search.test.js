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

const app = express();
app.use(express.json());
app.use('/api/search', searchRoutes);
app.use(errorHandler);

describe('Global Search API', () => {
  let testUser;
  let authToken;
  let testExam;
  let testSubject;

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
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
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
  });
});
