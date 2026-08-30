const embeddingService = require('../../services/embeddingService');
const embeddingsProcessor = require('../../services/embeddingsProcessor');

describe('Embedding Service Compatibility Wrapper', () => {
  test('should export the exact functions from embeddingsProcessor', () => {
    expect(embeddingService.generateVector).toBe(embeddingsProcessor.generateVector);
    expect(embeddingService.attachHooks).toBe(embeddingsProcessor.attachHooks);
    expect(embeddingService.registerWorkerHandler).toBe(embeddingsProcessor.registerWorkerHandler);
  });
});
