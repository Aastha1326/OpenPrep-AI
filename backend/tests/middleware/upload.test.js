// We test the multer configuration by checking the exported object's properties
describe('Upload Middleware', () => {
  let upload;
  let verifyMagicBytes;

  beforeAll(() => {
    // Clear any existing GEMINI_API_KEY to ensure clean state
    delete process.env.GEMINI_API_KEY;
    upload = require('../../middleware/upload');
    verifyMagicBytes = upload.verifyMagicBytes;
  });

  it('should export a multer instance', () => {
    expect(upload).toBeDefined();
    expect(typeof upload).toBe('object');
  });

  it('should have a single method for handling file uploads', () => {
    expect(typeof upload.single).toBe('function');
  });

  it('should have a fields method for multiple file uploads', () => {
    expect(typeof upload.fields).toBe('function');
  });

  it('should have an array method', () => {
    expect(typeof upload.array).toBe('function');
  });

  it('should have a any method', () => {
    expect(typeof upload.any).toBe('function');
  });

  describe('verifyMagicBytes — binary MIME verification', () => {
    // Minimal genuine PDF buffer (same structure used across controller tests)
    const realPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
    );

    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    const realPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(32, 0),
    ]);

    // JPEG magic: FF D8 FF
    const realJpg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(32, 0),
    ]);

    // Windows executable magic: MZ
    const exePayload = Buffer.concat([
      Buffer.from([0x4d, 0x5a]),
      Buffer.alloc(64, 0),
    ]);

    it('should accept a genuine PDF with .pdf extension', async () => {
      await expect(verifyMagicBytes('.pdf', realPdf)).resolves.toBeUndefined();
    });

    it('should accept a genuine PNG with .png extension', async () => {
      await expect(verifyMagicBytes('.png', realPng)).resolves.toBeUndefined();
    });

    it('should accept a genuine JPEG with .jpg extension', async () => {
      await expect(verifyMagicBytes('.jpg', realJpg)).resolves.toBeUndefined();
    });

    it('should accept a genuine JPEG with .jpeg extension', async () => {
      await expect(verifyMagicBytes('.jpeg', realJpg)).resolves.toBeUndefined();
    });

    it('should accept plain text with .txt extension (no magic bytes)', async () => {
      await expect(verifyMagicBytes('.txt', Buffer.from('plain text note content'))).resolves.toBeUndefined();
    });

    it('should reject an executable renamed to .pdf', async () => {
      await expect(verifyMagicBytes('.pdf', exePayload)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject a text script renamed to .pdf', async () => {
      await expect(verifyMagicBytes('.pdf', Buffer.from('#!/bin/bash\necho pwned'))).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject a PNG renamed to .pdf', async () => {
      await expect(verifyMagicBytes('.pdf', realPng)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject a PDF renamed to .png', async () => {
      await expect(verifyMagicBytes('.png', realPdf)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject a binary executable renamed to .txt', async () => {
      await expect(verifyMagicBytes('.txt', exePayload)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should reject an empty buffer for binary extensions', async () => {
      await expect(verifyMagicBytes('.pdf', Buffer.alloc(0))).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });

    it('should allow an empty buffer for .txt extension', async () => {
      await expect(verifyMagicBytes('.txt', Buffer.alloc(0))).resolves.toBeUndefined();
    });

    it('should reject truncated binary buffers (unparseable)', async () => {
      // Two lone magic bytes with no detectable full signature
      const truncated = Buffer.from([0x89, 0x50]);
      await expect(verifyMagicBytes('.png', truncated)).rejects.toMatchObject({
        name: 'FileValidationError',
      });
    });
  });
});
