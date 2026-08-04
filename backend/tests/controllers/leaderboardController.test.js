const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const leaderboardRoutes = require('../../routes/leaderboardRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Quiz = require('../../models/Quiz');
const Progress = require('../../models/Progress');
const QuizAttempt = require('../../models/QuizAttempt');
const Flashcard = require('../../models/Flashcard');

const app = express();
app.use(express.json());
app.use('/api/leaderboard', leaderboardRoutes);
app.use(errorHandler);

describe('Leaderboard Controller - Integration Tests', () => {
  let leaderUser;
  let anonymousUser;
  let contributorUser;
  let idleUser;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_leaderboard';

    leaderUser = await User.create({
      name: 'Leader Student',
      email: 'leader@example.com',
      password: 'password123',
    });
    anonymousUser = await User.create({
      name: 'Masked Student',
      email: 'masked@example.com',
      password: 'password123',
      leaderboardVisible: false,
    });
    contributorUser = await User.create({
      name: 'Contributor Account',
      email: 'contrib@example.com',
      password: 'password123',
      role: 'contributor',
    });
    idleUser = await User.create({
      name: 'Idle Student',
      email: 'idle@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: leaderUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it('should return 401 without a token', async () => {
    const res = await request(app).get('/api/leaderboard');
    expect(res.status).toBe(401);
  });

  it('should return an empty leaderboard when there is no activity', async () => {
    const idleToken = jwt.sign({ id: idleUser.id, type: 'access' }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${idleToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entries).toEqual([]);
    expect(res.body.data.currentUser).toBeNull();
    expect(res.body.data.totalParticipants).toBe(0);
  });

  it('should return week boundaries in the response', async () => {
    const idleToken = jwt.sign({ id: idleUser.id, type: 'access' }, process.env.JWT_SECRET);
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${idleToken}`);

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.weekStart)).toBeInstanceOf(Date);
    expect(new Date(res.body.data.weekEnd)).toBeInstanceOf(Date);
    // weekStart should be a Monday
    expect(new Date(res.body.data.weekStart).getDay()).toBe(1);
  });

  it('should rank students by weekly composite score and include current user', async () => {
    // Seed weekly activity for the leader, anonymous, and contributor users
    const exam = await Exam.create({
      name: 'Leaderboard Exam',
      description: 'Exam for leaderboard tests',
      date: '2026-12-31',
      user: leaderUser.id,
    });
    const leaderSubject = await Subject.create({
      name: 'Math',
      description: 'Math subject',
      exam: exam.id,
      user: leaderUser.id,
    });
    const anonSubject = await Subject.create({
      name: 'Science',
      description: 'Science subject',
      exam: exam.id,
      user: anonymousUser.id,
    });

    const leaderQuiz = await Quiz.create({
      title: 'Leader Quiz',
      subject: leaderSubject.id,
      createdBy: leaderUser.id,
    });
    const anonQuiz = await Quiz.create({
      title: 'Anon Quiz',
      subject: anonSubject.id,
      createdBy: anonymousUser.id,
    });
    const contribQuiz = await Quiz.create({
      title: 'Contrib Quiz',
      subject: leaderSubject.id,
      createdBy: contributorUser.id,
    });

    // Leader: 10h + 2 quizzes + 3 flashcards -> 10 + 4 + 1.5 = 15.5
    await Progress.create({
      user: leaderUser.id,
      subject: leaderSubject.id,
      studyHours: 10,
    });
    await QuizAttempt.create({ user: leaderUser.id, quiz: leaderQuiz.id, score: 80, totalQuestions: 5 });
    await QuizAttempt.create({ user: leaderUser.id, quiz: leaderQuiz.id, score: 60, totalQuestions: 5 });
    await Flashcard.create({
      user: leaderUser.id,
      subject: leaderSubject.id,
      front: 'Q1',
      back: 'A1',
    });
    await Flashcard.create({
      user: leaderUser.id,
      subject: leaderSubject.id,
      front: 'Q2',
      back: 'A2',
    });
    await Flashcard.create({
      user: leaderUser.id,
      subject: leaderSubject.id,
      front: 'Q3',
      back: 'A3',
    });

    // Anonymous: 5h + 3 quizzes -> 5 + 6 = 11 (should be masked)
    await Progress.create({
      user: anonymousUser.id,
      subject: anonSubject.id,
      studyHours: 5,
    });
    await QuizAttempt.create({ user: anonymousUser.id, quiz: anonQuiz.id, score: 70, totalQuestions: 5 });
    await QuizAttempt.create({ user: anonymousUser.id, quiz: anonQuiz.id, score: 90, totalQuestions: 5 });
    await QuizAttempt.create({ user: anonymousUser.id, quiz: anonQuiz.id, score: 50, totalQuestions: 5 });

    // Contributor activity must NOT appear (leaderboard is for students)
    await QuizAttempt.create({ user: contributorUser.id, quiz: contribQuiz.id, score: 100, totalQuestions: 5 });

    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { entries, currentUser, totalParticipants } = res.body.data;

    expect(totalParticipants).toBe(2);
    expect(entries).toHaveLength(2);

    expect(entries[0].name).toBe('Leader Student');
    expect(entries[0].rank).toBe(1);
    expect(entries[0].weeklyHours).toBe(10);
    expect(entries[0].quizzesCompleted).toBe(2);
    expect(entries[0].flashcardsReviewed).toBe(3);
    expect(entries[0].score).toBe(15.5);
    expect(entries[0].isAnonymous).toBe(false);

    // Anonymous student is masked with a deterministic handle
    expect(entries[1].name).toMatch(/^Anonymous Student #[A-Z0-9]{4}$/);
    expect(entries[1].isAnonymous).toBe(true);
    expect(entries[1].score).toBe(11);

    // The requesting user's own rank is included
    expect(currentUser).not.toBeNull();
    expect(currentUser.rank).toBe(1);
    expect(currentUser.name).toBe('Leader Student');
    expect(currentUser.userId).toBe(leaderUser.id);
  });
});
