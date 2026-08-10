const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const progressRoutes = require('../../routes/progressRoutes');
const studyPlanRoutes = require('../../routes/studyPlanRoutes');
const flashcardRoutes = require('../../routes/flashcardRoutes');
const quizRoutes = require('../../routes/quizRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const StudyPlan = require('../../models/StudyPlan');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Flashcard = require('../../models/Flashcard');
const Quiz = require('../../models/Quiz');

const app = express();
app.use(express.json());
app.use('/api/progress', progressRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use(errorHandler);

describe('XP Progression & Streak Freeze Shield system', () => {
  let testUser;
  let authToken;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_xp';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    
    testUser = await User.create({
      name: 'XP Student',
      email: 'xpstudent@example.com',
      password: 'password123',
      xp: 0,
      level: 1,
      skillPoints: 0,
      unlockedNodes: ['root'],
      streakFreezes: 0,
      streakFreezesEquippedThisMonth: 0,
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  it('should return initial XP status', async () => {
    const res = await request(app)
      .get('/api/progress/xp/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.level).toBe(1);
    expect(res.body.totalXP).toBe(0);
    expect(res.body.skillPoints).toBe(0);
    expect(res.body.unlockedNodes).toContain('root');
  });

  it('should award XP and trigger level up with skill points', async () => {
    const res = await request(app)
      .post('/api/progress/xp/award')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ activityType: 'daily_challenge', amount: 1500 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.progression.xp).toBe(1500);
    expect(res.body.progression.level).toBe(2);
    expect(res.body.progression.skillPoints).toBe(1);
    expect(res.body.progression.leveledUp).toBe(true);
  });

  it('should allow unlocking a node when user has skill points', async () => {
    // 1. Manually update user to have 1 skill point
    const user = await User.findByPk(testUser.id);
    user.skillPoints = 1;
    await user.save();

    // 2. Perform Unlock request
    const res = await request(app)
      .post('/api/progress/xp/unlock')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nodeId: 'memory_boost' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unlockedNodes).toContain('memory_boost');
    expect(res.body.skillPointsRemaining).toBe(0);
  });

  it('should refuse unlock when user has insufficient skill points', async () => {
    const res = await request(app)
      .post('/api/progress/xp/unlock')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nodeId: 'memory_boost' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Insufficient Skill Points');
  });

  it('should allow user to equip up to 2 streak freezes per month', async () => {
    // Equip 1st
    let res = await request(app)
      .post('/api/progress/streak-freeze/equip')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.streakFreezes).toBe(1);
    expect(res.body.equippedThisMonth).toBe(1);

    // Equip 2nd
    res = await request(app)
      .post('/api/progress/streak-freeze/equip')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.streakFreezes).toBe(2);
    expect(res.body.equippedThisMonth).toBe(2);

    // Equip 3rd (should fail)
    res = await request(app)
      .post('/api/progress/streak-freeze/equip')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('maximum limit of 2');
  });

  it('should award XP when completing study plan task', async () => {
    const exam = await Exam.create({ name: 'XP Exam', date: new Date(), user: testUser.id });
    const plan = await StudyPlan.create({
      exam: exam.id,
      user: testUser.id,
      startDate: new Date(),
      endDate: new Date(),
      dailyGoals: [
        {
          date: '2026-08-10',
          tasks: [{ id: 'task-123', title: 'Task 1', duration: 30, completed: false }]
        }
      ]
    });

    const res = await request(app)
      .put(`/api/study-plans/${plan.id}/tasks/task-123`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.progression).toBeDefined();
    expect(res.body.progression.xp).toBe(150);
  });

  it('should award XP when reviewing a flashcard', async () => {
    const exam = await Exam.create({ name: 'XP Exam', date: new Date(), user: testUser.id });
    const subject = await Subject.create({ name: 'XP Subject', exam: exam.id, user: testUser.id });
    const card = await Flashcard.create({
      front: 'Front',
      back: 'Back',
      subject: subject.id,
      user: testUser.id
    });

    const res = await request(app)
      .put(`/api/flashcards/${card.id}/review`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quality: 4 });

    expect(res.status).toBe(200);
    expect(res.body.progression).toBeDefined();
    expect(res.body.progression.xp).toBe(80); // quality >= 4 gives 80 XP
  });

  it('should award XP when submitting a quiz attempt', async () => {
    const exam = await Exam.create({ name: 'XP Exam', date: new Date(), user: testUser.id });
    const subject = await Subject.create({ name: 'XP Subject', exam: exam.id, user: testUser.id });
    const quiz = await Quiz.create({
      title: 'XP Quiz',
      subject: subject.id,
      createdBy: testUser.id,
      questions: [{ id: 'q-1', questionText: 'Q1', options: ['A', 'B'], correctAnswer: 1 }]
    });

    const res = await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        answers: [{ questionId: 'q-1', selectedAnswer: 1 }],
        timeSpent: 30
      });

    expect(res.status).toBe(201);
    expect(res.body.progression).toBeDefined();
    expect(res.body.progression.xp).toBe(200); // 100% score gives Math.round(100 * 1.5 + 50) = 200 XP
  });
});
