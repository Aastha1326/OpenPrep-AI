const { uploadHandwrittenSubmission, getEvaluation } = require('../../controllers/handwrittenSubmissionController');
const { HandwrittenSubmission } = require('../../models');
const handwritingOcrService = require('../../services/handwritingOcrService');
const rubricGradingService = require('../../services/rubricGradingService');
const fs = require('fs');

describe('Handwritten Submission Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = {
      user: { id: 'user-123' },
      files: [
        { path: 'mock/path/page1.jpg', filename: 'page1.jpg', mimetype: 'image/jpeg' }
      ],
      body: {
        modelAnswer: 'Official model answer content.',
        rubricDescription: 'Grading allocation details.',
        examId: 'exam-456'
      },
      params: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
  });

  it('should upload files, trigger OCR and evaluation, and return completed submission', async () => {
    const mockSubmission = {
      id: 'sub-789',
      userId: 'user-123',
      examId: 'exam-456',
      photoUrls: ['/uploads/page1.jpg'],
      modelAnswer: 'Official model answer content.',
      rubricDescription: 'Grading allocation details.',
      status: 'pending',
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(HandwrittenSubmission, 'create').mockResolvedValue(mockSubmission);
    vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('image_bytes'));
    vi.spyOn(handwritingOcrService, 'transcribeHandwriting').mockResolvedValue({
      transcription: 'Student answer proof steps...'
    });
    vi.spyOn(rubricGradingService, 'evaluateAnswerAgainstRubric').mockResolvedValue({
      totalScore: 9,
      maxScore: 10
    });

    await uploadHandwrittenSubmission(req, res, next);

    expect(HandwrittenSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        examId: 'exam-456',
        status: 'pending'
      })
    );
    expect(handwritingOcrService.transcribeHandwriting).toHaveBeenCalled();
    expect(rubricGradingService.evaluateAnswerAgainstRubric).toHaveBeenCalled();
    expect(mockSubmission.status).toBe('completed');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return submission evaluation data by id', async () => {
    req.params.id = 'sub-789';
    const mockSubmission = {
      id: 'sub-789',
      userId: 'user-123',
      transcription: 'Extracted...',
      evaluation: { totalScore: 8 }
    };

    vi.spyOn(HandwrittenSubmission, 'findOne').mockResolvedValue(mockSubmission);

    await getEvaluation(req, res, next);

    expect(HandwrittenSubmission.findOne).toHaveBeenCalledWith({
      where: { id: 'sub-789', userId: 'user-123' }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockSubmission
      })
    );
  });
});
