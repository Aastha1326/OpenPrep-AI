const request = require('supertest');
const express = require('express');
const path = require('path');
const audioNoteUpload = require('../../middleware/audioNoteUpload');
const errorHandler = require('../../middleware/error');

const app = express();
app.use(express.json());

// Create a test route that uses the audioNoteUpload middleware
app.post('/test-audio-upload', audioNoteUpload.single('file'), (req, res) => {
  res.status(200).json({
    success: true,
    file: req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    } : null,
  });
});

app.use(errorHandler);

describe('Audio Note Upload Middleware - Unit Tests', () => {
  let verifyMagicBytes;
  let MAX_AUDIO_UPLOAD_SIZE;

  beforeAll(() => {
    // Clear any existing MAX_AUDIO_UPLOAD_SIZE_MB to ensure clean state
    delete process.env.MAX_AUDIO_UPLOAD_SIZE_MB;
    const middleware = require('../../middleware/audioNoteUpload');
    verifyMagicBytes = middleware.verifyMagicBytes;
    MAX_AUDIO_UPLOAD_SIZE = middleware.MAX_AUDIO_UPLOAD_SIZE;
  });

  it('should export a multer instance', () => {
    expect(audioNoteUpload).toBeDefined();
    expect(typeof audioNoteUpload).toBe('object');
  });

  it('should have a single method for handling file uploads', () => {
    expect(typeof audioNoteUpload.single).toBe('function');
  });

  it('should have MAX_AUDIO_UPLOAD_SIZE configured', () => {
    expect(MAX_AUDIO_UPLOAD_SIZE).toBeDefined();
    expect(MAX_AUDIO_UPLOAD_SIZE).toBe(25 * 1024 * 1024); // Default 25MB
  });

  describe('verifyMagicBytes — binary MIME verification for audio', () => {
    // WAV magic: RIFF WAVE
    const realWav = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]),
      Buffer.alloc(32, 0),
    ]);

    // MP3 magic: ID3 or FF FB
    const realMp3 = Buffer.concat([
      Buffer.from([0xff, 0xfb, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      Buffer.alloc(32, 0),
    ]);

    // Windows executable magic: MZ
    const exePayload = Buffer.concat([
      Buffer.from([0x4d, 0x5a]),
      Buffer.alloc(64, 0),
    ]);

    it('should accept a genuine WAV with .wav extension', async () => {
      await expect(verifyMagicBytes('.wav', realWav)).resolves.toBeUndefined();
    });

    it('should accept a genuine MP3 with .mp3 extension', async () => {
      await expect(verifyMagicBytes('.mp3', realMp3)).resolves.toBeUndefined();
    });

    it('should reject an executable renamed to .wav', async () => {
      await expect(verifyMagicBytes('.wav', exePayload)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject a PDF renamed to .mp3', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%Fake PDF');
      await expect(verifyMagicBytes('.mp3', pdfBuffer)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject an empty buffer for audio extensions', async () => {
      await expect(verifyMagicBytes('.wav', Buffer.alloc(0))).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });
  });

  describe('File Size Validation - Integration Tests', () => {
    const originalEnv = process.env.MAX_AUDIO_UPLOAD_SIZE_MB;

    afterEach(() => {
      // Restore original environment variable after each test
      if (originalEnv === undefined) {
        delete process.env.MAX_AUDIO_UPLOAD_SIZE_MB;
      } else {
        process.env.MAX_AUDIO_UPLOAD_SIZE_MB = originalEnv;
      }
    });

    // Create a minimal valid WAV buffer (RIFF header)
    const createValidWavBuffer = (sizeInBytes) => {
      const header = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // 'RIFF'
        0x24, 0x00, 0x00, 0x00, // file size - 8 (placeholder)
        0x57, 0x41, 0x56, 0x45, // 'WAVE'
        0x66, 0x6d, 0x74, 0x20, // 'fmt '
        0x10, 0x00, 0x00, 0x00, // chunk size
        0x01, 0x00,             // audio format (PCM)
        0x01, 0x00,             // channels
        0x22, 0x56, 0x00, 0x00, // sample rate
        0x22, 0x56, 0x00, 0x00, // byte rate
        0x01, 0x00,             // block align
        0x08, 0x00,             // bits per sample
        0x64, 0x61, 0x74, 0x61, // 'data'
        0x00, 0x00, 0x00, 0x00, // data size
      ]);
      
      const padding = Buffer.alloc(Math.max(0, sizeInBytes - header.length));
      return Buffer.concat([header, padding]);
    };

    describe('Default configuration (25MB limit)', () => {
      beforeEach(() => {
        delete process.env.MAX_AUDIO_UPLOAD_SIZE_MB;
      });

      it('should accept audio file below 25MB', async () => {
        const smallBuffer = createValidWavBuffer(1024); // 1KB
        const res = await request(app)
          .post('/test-audio-upload')
          .attach('file', smallBuffer, 'small-audio.wav');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.file).toBeDefined();
        expect(res.body.file.size).toBe(1024);
      });
    });

    describe('File type validation still works', () => {
      it('should reject non-audio files', async () => {
        const pdfBuffer = Buffer.from('%PDF-1.4\n%Fake PDF');
        const res = await request(app)
          .post('/test-audio-upload')
          .attach('file', pdfBuffer, 'document.pdf');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('audio files');
      });
    });
  });
});
