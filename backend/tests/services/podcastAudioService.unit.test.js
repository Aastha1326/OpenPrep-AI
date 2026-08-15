const { getSilenceBuffer, splitText, compilePodcastEpisode } = require('../../services/podcastAudioService');

describe('podcastAudioService Unit Tests', () => {
  describe('splitText helper', () => {
    it('should split long text on natural word boundaries under max length', () => {
      const longText = 'This is a very long text sentence that should be split into smaller blocks because the Google Translate Text-to-Speech API limits request query lengths to under 200 characters.';
      const chunks = splitText(longText, 60);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(60);
      });
    });

    it('returns empty array for empty inputs', () => {
      expect(splitText('')).toEqual([]);
      expect(splitText(null)).toEqual([]);
    });
  });

  describe('getSilenceBuffer helper', () => {
    it('returns silent mp3 audio buffer based on requested duration', () => {
      const buf1 = getSilenceBuffer(1);
      const buf2 = getSilenceBuffer(2);

      expect(buf1).toBeInstanceOf(Buffer);
      expect(buf2).toBeInstanceOf(Buffer);
      expect(buf2.length).toBe(buf1.length * 2);
    });
  });

  describe('compilePodcastEpisode main flow', () => {
    it('concatenates welcome introductions, cards fronts, recall silences, backs, and goodbye outro prompts', async () => {
      const mockCards = [
        { front: 'What is mitochondria?', back: 'The powerhouse of the cell.', hint: 'Powerhouse' },
        { front: 'What is photosynthesis?', back: 'Process of turning sunlight to glucose.' }
      ];

      // In testing mode, network calls are bypassed returning dummy frame buffers
      const result = await compilePodcastEpisode(mockCards, 'Biology');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.durationSeconds).toBeGreaterThan(0);
    });
  });
});
