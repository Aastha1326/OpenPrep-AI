const pyqController = require('../../controllers/pyqController');
const PYQ = require('../../models/PYQ');
const Subject = require('../../models/Subject');
const geminiService = require('../../services/geminiService');

describe('PYQ SSE Analysis Streaming Controller - Unit Tests', () => {
  it('should set text/event-stream headers and write SSE data chunks', async () => {
    const fakePyq = {
      id: 'pyq-123',
      title: 'Math Paper 2025',
      year: 2025,
      subject: 'sub-123',
      fileUrl: null,
      analyzed: false,
      analysisResults: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(PYQ, 'findOne').mockResolvedValue(fakePyq);
    vi.spyOn(Subject, 'findByPk').mockResolvedValue({ id: 'sub-123', name: 'Mathematics' });
    vi.spyOn(geminiService, 'analyzePYQStream').mockImplementation(async (text, subjectName, onChunk) => {
      onChunk('{\n  "chapterWeightage": []');
      onChunk('\n}');
      return { chapterWeightage: [] };
    });

    const headers = {};
    const writtenData = [];
    let isEnded = false;

    const req = {
      params: { id: 'pyq-123' },
      user: { id: 'user-123' },
    };

    const res = {
      setHeader(k, v) {
        headers[k] = v;
      },
      write(data) {
        writtenData.push(data);
      },
      end() {
        isEnded = true;
      },
    };

    await pyqController.analyzePYQStream(req, res, (err) => {
      if (err) throw err;
    });

    expect(headers['Content-Type']).toBe('text/event-stream');
    expect(headers['Cache-Control']).toBe('no-cache, no-transform');
    expect(writtenData.length).toBeGreaterThan(0);
    expect(writtenData.some((d) => d.includes('data: {"chunk":'))).toBe(true);
    expect(writtenData.some((d) => d.includes('data: [DONE]'))).toBe(true);
    expect(isEnded).toBe(true);

    PYQ.findOne.mockRestore();
    Subject.findByPk.mockRestore();
    geminiService.analyzePYQStream.mockRestore();
  });

  it('should handle 404 when PYQ is not found', async () => {
    vi.spyOn(PYQ, 'findOne').mockResolvedValue(null);

    let statusCode = null;
    let responseData = null;

    const req = {
      params: { id: 'invalid-id' },
      user: { id: 'user-123' },
    };

    const res = {
      status(c) {
        statusCode = c;
        return this;
      },
      json(d) {
        responseData = d;
        return this;
      },
    };

    await pyqController.analyzePYQStream(req, res, (err) => {
      if (err) throw err;
    });

    expect(statusCode).toBe(404);
    expect(responseData.success).toBe(false);

    PYQ.findOne.mockRestore();
  });
});
