const { transcribeHandwriting, preprocessHandwrittenImage } = require('../../services/handwritingOcrService');
const redisService = require('../../services/redisService');
const Jimp = require('jimp');

describe('Handwriting OCR Service with Gemini Vision', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should process image and call Gemini Vision API', async () => {
    process.env.GEMINI_API_KEY = 'test_api_key';

    // Mock Jimp image processing
    const mockImage = {
      grayscale: vi.fn().mockReturnThis(),
      normalize: vi.fn().mockReturnThis(),
      contrast: vi.fn().mockReturnThis(),
      getBufferAsync: vi.fn().mockResolvedValue(Buffer.from('processed_image')),
    };
    vi.spyOn(Jimp, 'read').mockResolvedValue(mockImage);

    // Mock Gemini API call
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Transcribed math proof: $x^2 + y^2 = z^2$'
        }
      })
    };
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    vi.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue(mockModel);

    const result = await transcribeHandwriting(Buffer.from('input_image'), 'image/jpeg');

    expect(Jimp.read).toHaveBeenCalled();
    expect(mockImage.grayscale).toHaveBeenCalled();
    expect(mockImage.normalize).toHaveBeenCalled();
    expect(mockModel.generateContent).toHaveBeenCalledWith([
      expect.any(String),
      expect.objectContaining({
        inlineData: expect.objectContaining({
          data: expect.any(String),
          mimeType: 'image/jpeg'
        })
      })
    ]);
    expect(result.transcription).toContain('$x^2 + y^2 = z^2$');
    expect(result.confidence).toBe(90);
  });
});
