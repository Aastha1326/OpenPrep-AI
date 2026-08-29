const { accumulateAudioChunk, processSessionAudio, audioBuffers } = require('../../services/audioStreamProcessor');
const { MockInterviewSession } = require('../../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('Audio Stream Processor Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    audioBuffers.clear();
  });

  test('accumulateAudioChunk correctly appends chunk buffers to room key', () => {
    accumulateAudioChunk('room-123', Buffer.from([1, 2, 3]));
    accumulateAudioChunk('room-123', Buffer.from([4, 5, 6]));

    const list = audioBuffers.get('room-123');
    expect(list).toBeDefined();
    expect(list.length).toBe(2);
    expect(Buffer.concat(list).length).toBe(6);
  });

  test('processSessionAudio performs amplitude analysis, runs Gemini transcribing and saves session', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    // Mock binary audio buffer input (PCM 16-bit)
    const mockAudioBuffer = Buffer.alloc(32000); // 2 seconds of 8kHz 16-bit audio
    for (let i = 0; i < mockAudioBuffer.length; i += 2) {
      mockAudioBuffer.writeInt16LE(15000, i); // normal volume level
    }

    accumulateAudioChunk('room-123', mockAudioBuffer);

    // Mock Gemini
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Explain how time complexity works.'
        }
      })
    };
    vi.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue(mockModel);

    // Mock Database
    const mockSession = {
      id: 'session-555',
      userId: 'user-777',
      roomId: 'room-123',
      transcription: 'Explain how time complexity works.',
      metrics: {
        avgVolume: 40,
        hesitationSeconds: 0,
        totalDurationSeconds: 2,
        speechSpeedWpm: 150,
        overallScore: 9,
      }
    };
    vi.spyOn(MockInterviewSession, 'create').mockResolvedValue(mockSession);

    const result = await processSessionAudio('room-123', 'user-777');

    expect(MockInterviewSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-777',
        roomId: 'room-123',
        status: 'completed',
        transcription: 'Explain how time complexity works.',
        metrics: expect.objectContaining({
          avgVolume: expect.any(Number),
          overallScore: expect.any(Number),
        })
      })
    );

    expect(result.id).toBe('session-555');
    expect(audioBuffers.has('room-123')).toBe(false); // check cleanup
  });
});
