const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const academicRoutes = require('../../routes/academicRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');
const QuizBookmark = require('../../models/QuizBookmark');
const QuizTelemetryEvent = require('../../models/QuizTelemetryEvent');
const Progress = require('../../models/Progress');
const Flashcard = require('../../models/Flashcard');
const Note = require('../../models/Note');
const StudyPlan = require('../../models/StudyPlan');

const app = express();
app.use(express.json());
app.use('/api/academic', academicRoutes);
app.use(errorHandler);

describe('Cascade Deletion & Database Constraints', () => {
  let testUser;
  let testExam;
  let testSubject;
  let testTopic;
  let testQuiz;
  let authToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_cascade_delete';

    // Create user
    testUser = await User.create({
      name: 'Cascade User',
      email: 'cascade@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    // Clear models
    await Progress.destroy({ where: {} });
    await QuizBookmark.destroy({ where: {} });
    await QuizTelemetryEvent.destroy({ where: {} });
    await QuizAttempt.destroy({ where: {} });
    await Quiz.destroy({ where: {} });
    await Note.destroy({ where: {} });
    await Flashcard.destroy({ where: {} });
    await StudyPlan.destroy({ where: {} });
    await Topic.destroy({ where: {} });
    await Subject.destroy({ where: {} });
    await Exam.destroy({ where: {} });

    // Seed base test data
    testExam = await Exam.create({
      name: 'Test Exam',
      description: 'Cascade testing',
      date: new Date(),
      user: testUser.id,
    });

    testSubject = await Subject.create({
      name: 'Test Subject',
      exam: testExam.id,
      user: testUser.id,
    });

    testTopic = await Topic.create({
      name: 'Test Topic',
      subject: testSubject.id,
      user: testUser.id,
    });

    testQuiz = await Quiz.create({
      title: 'Cascade Quiz',
      subject: testSubject.id,
      topic: testTopic.id,
      createdBy: testUser.id,
      questions: [{ id: 'q-1', questionText: 'Q1' }],
    });
  });

  it('should cascade delete all child entities when a Subject is deleted', async () => {
    // Create dependent records
    const progress = await Progress.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      completionPercentage: 10,
    });

    const flashcard = await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      front: 'Front',
      back: 'Back',
    });

    const note = await Note.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      title: 'Subject Note',
      content: 'Content',
    });

    const attempt = await QuizAttempt.create({
      user: testUser.id,
      quiz: testQuiz.id,
      score: 100,
      totalQuestions: 1,
      answers: [],
    });

    const bookmark = await QuizBookmark.create({
      user: testUser.id,
      quiz: testQuiz.id,
      questionId: 'q-1',
    });

    const telemetry = await QuizTelemetryEvent.create({
      user: testUser.id,
      quiz: testQuiz.id,
      eventType: 'question_view',
    });

    // Delete Subject via API
    const res = await request(app)
      .delete(`/api/academic/subjects/${testSubject.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify all child entities are deleted
    const subjects = await Subject.findAll({ where: { id: testSubject.id } });
    expect(subjects.length).toBe(0);

    const topics = await Topic.findAll({ where: { subject: testSubject.id } });
    expect(topics.length).toBe(0);

    const quizzes = await Quiz.findAll({ where: { subject: testSubject.id } });
    expect(quizzes.length).toBe(0);

    const progresses = await Progress.findAll({ where: { subject: testSubject.id } });
    expect(progresses.length).toBe(0);

    const flashcards = await Flashcard.findAll({ where: { subject: testSubject.id } });
    expect(flashcards.length).toBe(0);

    const notes = await Note.findAll({ where: { subject: testSubject.id } });
    expect(notes.length).toBe(0);

    const attempts = await QuizAttempt.findAll({ where: { quiz: testQuiz.id } });
    expect(attempts.length).toBe(0);

    const bookmarks = await QuizBookmark.findAll({ where: { quiz: testQuiz.id } });
    expect(bookmarks.length).toBe(0);

    const telemetries = await QuizTelemetryEvent.findAll({ where: { quiz: testQuiz.id } });
    expect(telemetries.length).toBe(0);
  });

  it('should clean up and safely disassociate topic references when a Topic is deleted', async () => {
    // Create dependent records
    const progress = await Progress.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      completionPercentage: 20,
    });

    const flashcard = await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      front: 'Front',
      back: 'Back',
    });

    const note = await Note.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      title: 'Topic Note',
      content: 'Content',
    });

    const attempt = await QuizAttempt.create({
      user: testUser.id,
      quiz: testQuiz.id,
      score: 80,
      totalQuestions: 1,
      weakTopics: [testTopic.id],
      strongTopics: [testTopic.id],
    });

    const studyPlan = await StudyPlan.create({
      user: testUser.id,
      exam: testExam.id,
      dailyGoals: [
        {
          date: '2026-08-10',
          tasks: [{ _id: 'task-1', title: 'Revise', duration: 30, completed: false, topic: testTopic.id }],
        },
      ],
    });

    // Delete Topic via API
    const res = await request(app)
      .delete(`/api/academic/topics/${testTopic.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify topic itself is deleted
    const topics = await Topic.findAll({ where: { id: testTopic.id } });
    expect(topics.length).toBe(0);

    // Verify progress, flashcard, note are deleted
    const progresses = await Progress.findAll({ where: { topic: testTopic.id } });
    expect(progresses.length).toBe(0);

    const flashcards = await Flashcard.findAll({ where: { topic: testTopic.id } });
    expect(flashcards.length).toBe(0);

    const notes = await Note.findAll({ where: { topic: testTopic.id } });
    expect(notes.length).toBe(0);

    // Verify Quiz topic reference is nullified (SET NULL)
    const quiz = await Quiz.findByPk(testQuiz.id);
    expect(quiz.topic).toBeNull();

    // Verify QuizAttempt topic arrays have been updated (removed topic ID)
    const updatedAttempt = await QuizAttempt.findByPk(attempt.id);
    expect(updatedAttempt.weakTopics).not.toContain(testTopic.id);
    expect(updatedAttempt.strongTopics).not.toContain(testTopic.id);

    // Verify StudyPlan JSONB goals have been nullified for the topic
    const updatedPlan = await StudyPlan.findByPk(studyPlan.id);
    const task = updatedPlan.dailyGoals[0].tasks[0];
    expect(task.topic).toBeNull();
  });
});
