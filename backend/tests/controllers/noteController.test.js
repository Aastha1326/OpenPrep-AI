const request = require('supertest');
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const noteRoutes = require('../../routes/noteRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Exam = require('../../models/Exam');
const Note = require('../../models/Note');

const app = express();
app.use(express.json());
app.use('/api/notes', noteRoutes);
app.use(errorHandler);

// Minimal valid PDF buffer (works with pdf-parse topic detection)
function createTestPdfBuffer() {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
  );
}

describe('Note Controller - Integration Tests', () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherToken;
  let testExam;
  let testSubject;
  const uploadedFiles = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_notes';

    testUser = await User.create({
      name: 'Note User',
      email: 'noteuser@example.com',
      password: 'StrongPass1!',
    });

    otherUser = await User.create({
      name: 'Other Note User',
      email: 'othernote@example.com',
      password: 'StrongPass1!',
    });

    testExam = await Exam.create({
      name: 'Note Test Exam',
      description: 'Exam for note tests',
      date: '2026-12-15',
      user: testUser.id,
    });

    testSubject = await Subject.create({
      name: 'Test Subject',
      description: 'Subject for note tests',
      exam: testExam.id,
      user: testUser.id,
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    otherToken = jwt.sign({ id: otherUser.id, type: 'access' }, process.env.JWT_SECRET);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  // =========================================================================
  // POST /api/notes — Upload Note
  // =========================================================================
  describe('POST /api/notes', () => {
    it('should upload a note with a PDF file and return 201', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Note')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'Sample note content')
        .attach('file', createTestPdfBuffer(), 'test-note.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Note');
      expect(res.body.data.fileUrl).toContain('/uploads/');
      expect(res.body.data.fileType).toBe('pdf');
      expect(res.body.data.user).toBe(testUser.id.toString());

      // Track file for cleanup
      if (res.body.data.fileUrl) {
        uploadedFiles.push(
          path.join(__dirname, '../../', res.body.data.fileUrl)
        );
      }
    });

    it('should upload a note without a file (text-only) and return 201', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Text Note')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'No file attached');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileUrl).toBe('');
      expect(res.body.data.fileType).toBe('text');
    });

    it('should reject an executable renamed to .pdf (magic byte check)', async () => {
      // Windows executable MZ header disguised as a PDF
      const exePayload = Buffer.concat([
        Buffer.from([0x4d, 0x5a]),
        Buffer.alloc(64, 0),
      ]);

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Malicious Payload')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'should not be stored')
        .attach('file', exePayload, 'payload.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only PDFs, documents, and images are allowed');
    });

    it('should reject a text script renamed to .pdf (magic byte check)', async () => {
      const scriptPayload = Buffer.from('#!/bin/bash\necho pwned > /tmp/owned');

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Script Payload')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'should not be stored')
        .attach('file', scriptPayload, 'script.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only PDFs, documents, and images are allowed');
    });

    it('should reject a PNG renamed to .pdf (magic byte check)', async () => {
      const pngPayload = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(32, 0),
      ]);

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'PNG as PDF')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'should not be stored')
        .attach('file', pngPayload, 'image.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only PDFs, documents, and images are allowed');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('subjectId', testSubject.id.toString());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when subjectId is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Orphan Note');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/notes')
        .field('title', 'No Auth Note')
        .field('subjectId', testSubject.id.toString());

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // GET /api/notes — List Notes
  // =========================================================================
  describe('GET /api/notes', () => {
    beforeAll(async () => {
      // Create a note for the test user
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Listable Note')
        .field('subjectId', testSubject.id.toString())
        .field('content', 'Can be listed');
    });

    it('should return notes for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('fileUrl');
      expect(res.body.data[0]).toHaveProperty('createdAt');
    });

    it('should return pagination metadata', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('should return empty array for a user with no notes', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/notes');

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // DELETE /api/notes/:id — Delete Note
  // =========================================================================
  describe('DELETE /api/notes/:id', () => {
    let noteToDelete;

    beforeEach(async () => {
      // Create a fresh note for deletion tests
      const createRes = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Delete Me')
        .field('subjectId', testSubject.id.toString())
        .attach('file', createTestPdfBuffer(), 'to-delete.pdf');

      noteToDelete = createRes.body.data;

      if (noteToDelete.fileUrl) {
        uploadedFiles.push(
          path.join(__dirname, '../../', noteToDelete.fileUrl)
        );
      }
    });

    it('should delete own note and return 200', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when deleting another user\'s note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteToDelete.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .delete(`/api/notes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).delete(`/api/notes/${noteToDelete.id}`);

      expect(res.status).toBe(401);
    });

    it('should return 400 when attempting path traversal deletion', async () => {
      const maliciousNote = await Note.create({
        title: 'Trapped Note',
        content: 'Dangerous path',
        subject: testSubject.id.toString(),
        fileUrl: '../../.env',
        fileType: 'pdf',
        user: testUser.id,
      });

      const res = await request(app)
        .delete(`/api/notes/${maliciousNote.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid file path');

      // Cleanup note
      await maliciousNote.destroy();
    });
  });

  // =========================================================================
  // POST /api/notes/:id/summarize — AI Note Summarization
  // =========================================================================
  describe('POST /api/notes/:id/summarize', () => {
    let noteWithContent;

    beforeAll(async () => {
      noteWithContent = await Note.create({
        title: 'Summarize Test Note',
        content: 'Data structures are ways of organizing data. Arrays store elements in contiguous memory. Linked lists use pointers to connect nodes. Trees are hierarchical structures with a root node. Graphs represent networks of connected nodes.',
        subject: testSubject.id,
        user: testUser.id,
      });
    });

    it('should return AI summary with expected structure', async () => {
      const res = await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('keyConcepts');
      expect(res.body.data).toHaveProperty('examTips');
      expect(typeof res.body.data.summary).toBe('string');
      expect(Array.isArray(res.body.data.keyConcepts)).toBe(true);
      expect(Array.isArray(res.body.data.examTips)).toBe(true);
    });

    it('should return cached summary on second call', async () => {
      // First call to ensure cache is populated
      await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Second call should return cached result
      const res = await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cached).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('should regenerate summary when forceRefresh is true', async () => {
      const res = await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ forceRefresh: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cached).toBe(false);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('should return 400 for note with no content', async () => {
      const emptyNote = await Note.create({
        title: 'Empty Note',
        content: '',
        subject: testSubject.id,
        user: testUser.id,
      });

      const res = await request(app)
        .post(`/api/notes/${emptyNote.id}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no text content');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/notes/${fakeId}/summarize`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when another user tries to summarize', async () => {
      const res = await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post(`/api/notes/${noteWithContent.id}/summarize`)
        .send({});

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // POST /api/notes/voice — Upload and process voice note
  // =========================================================================
  describe('POST /api/notes/voice', () => {
    const testWavBuffer = Buffer.from(
      'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x22\x56\x00\x00\x22\x56\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00'
    );

    it('should upload a WAV audio note, transcribe and summarize it, returning 201', async () => {
      const res = await request(app)
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Voice Lecture 1')
        .field('subjectId', testSubject.id.toString())
        .attach('file', testWavBuffer, 'lecture.wav');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Voice Lecture 1');
      expect(res.body.data.fileType).toBe('audio');
      expect(res.body.data.fileUrl).toContain('/uploads/');
      expect(res.body.data.content).toBeDefined(); // transcription
      expect(res.body.data.aiSummary).toBeDefined();
      expect(res.body.data.aiSummary.summary).toBeDefined();

      if (res.body.data.fileUrl) {
        uploadedFiles.push(
          path.join(__dirname, '../../', res.body.data.fileUrl)
        );
      }
    });

    it('should fail if no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Voice Lecture 1')
        .field('subjectId', testSubject.id.toString());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('upload an audio file');
    });

    it('should fail if subjectId is invalid', async () => {
      const fakeSubjectId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Voice Lecture 1')
        .field('subjectId', fakeSubjectId)
        .attach('file', testWavBuffer, 'lecture.wav');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject oversized audio files with 413 status', async () => {
      // Set a smaller limit for this test to avoid huge memory allocation
      const originalLimit = process.env.MAX_AUDIO_UPLOAD_SIZE_MB;
      process.env.MAX_AUDIO_UPLOAD_SIZE_MB = '1';

      // Create a buffer larger than 1MB limit
      const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
      const padding = Buffer.alloc(2 * 1024 * 1024); // 2MB
      const oversizedWav = Buffer.concat([wavHeader, padding]);

      const res = await request(app)
        .post('/api/notes/voice')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Oversized Voice Lecture')
        .field('subjectId', testSubject.id.toString())
        .attach('file', oversizedWav, 'oversized-lecture.wav');

      // Restore original limit
      if (originalLimit === undefined) {
        delete process.env.MAX_AUDIO_UPLOAD_SIZE_MB;
      } else {
        process.env.MAX_AUDIO_UPLOAD_SIZE_MB = originalLimit;
      }

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('exceeds the maximum allowed size');
    });
  });

  // =========================================================================
  // GET /api/notes/export — Export user notes with configured limit
  // =========================================================================
  describe('GET /api/notes/export', () => {
    it('exports notes correctly within default limit', async () => {
      // Since there is no custom configuration provided, it falls back to the limit of 100
      const res = await request(app)
        .get('/api/notes/export')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects export if notes exceed configured limit', async () => {
      const originalLimit = process.env.NOTE_EXPORT_LIMIT;
      // Configure a custom export limit to be extremely small (0) so it always fails.
      process.env.NOTE_EXPORT_LIMIT = '0'; 

      const res = await request(app)
        .get('/api/notes/export')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Export exceeds the configured limit');

      // Restore original config
      if (originalLimit === undefined) {
        delete process.env.NOTE_EXPORT_LIMIT;
      } else {
        process.env.NOTE_EXPORT_LIMIT = originalLimit;
      }
    });
  });
});
