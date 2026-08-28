const { generateVector, attachHooks, registerWorkerHandler } = require('../../services/embeddingsProcessor');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const queueService = require('../../services/queueService');
const { Note, Quiz } = require('../../models');

describe('Embeddings Processor Service & Background Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('generateVector calls Gemini embedContent and extracts float values', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';

    const mockEmbedding = {
      values: Array(768).fill(0.15),
    };
    const mockModel = {
      embedContent: vi.fn().mockResolvedValue({ embedding: mockEmbedding }),
    };

    vi.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue(mockModel);

    const vector = await generateVector('Sample search query text.');

    expect(GoogleGenerativeAI.prototype.getGenerativeModel).toHaveBeenCalledWith({ model: 'text-embedding-004' });
    expect(mockModel.embedContent).toHaveBeenCalledWith('Sample search query text.');
    expect(vector.length).toBe(768);
    expect(vector[0]).toBe(0.15);
  });

  test('worker handler updates record embedding', async () => {
    const mockRecord = {
      id: 'note-111',
      embedding: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Note, 'findByPk').mockResolvedValue(mockRecord);
    
    const mockEmbedding = { values: Array(768).fill(0.3) };
    const mockModel = {
      embedContent: vi.fn().mockResolvedValue({ embedding: mockEmbedding }),
    };
    vi.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue(mockModel);

    // Register handler
    registerWorkerHandler({ Note, Quiz });

    const handler = queueService.jobHandlers.get('generate_embeddings');
    expect(handler).toBeDefined();

    await handler({
      modelName: 'Note',
      recordId: 'note-111',
      text: 'Content details',
    });

    expect(Note.findByPk).toHaveBeenCalledWith('note-111');
    expect(mockRecord.embedding).toBeDefined();
    expect(mockRecord.embedding.length).toBe(768);
    expect(mockRecord.save).toHaveBeenCalledWith({ hooks: false });
  });
});
