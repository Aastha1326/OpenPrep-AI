const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const syllabusRoutes = require('../../routes/syllabusRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Syllabus = require('../../models/Syllabus');
const SyllabusTopic = require('../../models/SyllabusTopic');
const Note = require('../../models/Note');

const app = express();
app.use(express.json());
app.use('/api/syllabus', syllabusRoutes);
app.use(errorHandler);

describe('Syllabus Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testSyllabus;
  let testTopic;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_syllabi';

    testUser = await User.create({
      name: 'Curriculum Admin',
      email: 'curriculum@example.com',
      password: 'StrongPass1!',
    });

    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);

    testSyllabus = await Syllabus.create({
      userId: testUser.id,
      name: 'Organic Chemistry',
    });

    testTopic = await SyllabusTopic.create({
      syllabusId: testSyllabus.id,
      moduleName: 'Module A',
      title: 'Alkanes and Alkenes',
      subtopics: ['Nomenclature', 'Reactions'],
    });
  });

  afterAll(async () => {
    // Delete any generated notes
    const note = await Note.findOne({ where: { user: testUser.id } });
    if (note) await note.destroy();

    await testTopic.destroy();
    await testSyllabus.destroy();
    await testUser.destroy();
  });

  describe('POST /api/syllabus/upload', () => {
    it('uploads a syllabus PDF and extracts topics list', async () => {
      const buffer = Buffer.from('%PDF-1.4 ... test pdf content ...');
      const res = await request(app)
        .post('/api/syllabus/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('syllabus', buffer, 'college_syllabus.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.syllabusId).toBeDefined();
      expect(res.body.data.topics.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/syllabus/:id/gap-analysis', () => {
    it('returns coverage percentage and module categorizations', async () => {
      const res = await request(app)
        .get(`/api/syllabus/${testSyllabus.id}/gap-analysis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.coveragePercentage).toBeDefined();
      expect(res.body.data.topics.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/syllabus/topics/:topicId/generate-notes', () => {
    it('creates AI note for target gap topic', async () => {
      const res = await request(app)
        .post(`/api/syllabus/topics/${testTopic.id}/generate-notes`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.noteId).toBeDefined();
      expect(res.body.data.content).toBeDefined();
    });
  });
});
