import { describe, it, expect } from 'vitest';
import audioPodcastService from '../../services/audioPodcastService';

describe('AudioPodcastService Unit Tests', () => {
  const mockCards = [
    { front: 'What is Mitochondria?', back: 'Powerhouse of the cell generating ATP.', hint: 'Energy production' },
    { front: 'What is Ribosome?', back: 'Site of protein synthesis in biological cells.' },
  ];

  it('should generate a conversational dialogue script between Host A and Host B', async () => {
    const scriptData = await audioPodcastService.generatePodcastScript(mockCards, 'Cell Biology');

    expect(scriptData).toBeDefined();
    expect(scriptData.title).toBeDefined();
    expect(scriptData.dialogue).toBeInstanceOf(Array);
    expect(scriptData.dialogue.length).toBeGreaterThan(0);

    const speakers = scriptData.dialogue.map((d) => d.speaker);
    expect(speakers).toContain('Host A');
    expect(speakers).toContain('Host B');
  });

  it('should synthesize audio and generate a timestamped transcript with formatted timestamps', async () => {
    const dialogue = [
      { speaker: 'Host A', text: 'Welcome to Cell Biology review.' },
      { speaker: 'Host B', text: 'What is Mitochondria?' },
      { speaker: 'Host A', text: 'Powerhouse of the cell generating ATP.' },
    ];

    const result = await audioPodcastService.synthesizeAndMixAudio(dialogue, {
      ambientTrack: 'lofi',
      outputFilename: `test-podcast-${Date.now()}.mp3`,
    });

    expect(result).toBeDefined();
    expect(result.audioUrl).toContain('/uploads/podcasts/');
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.transcript).toBeInstanceOf(Array);
    expect(result.transcript.length).toBe(3);

    const firstTurn = result.transcript[0];
    expect(firstTurn.speaker).toBe('Host A');
    expect(firstTurn.text).toBe('Welcome to Cell Biology review.');
    expect(firstTurn.timestamp).toMatch(/^\d{2}:\d{2}$/);
    expect(typeof firstTurn.startSec).toBe('number');
    expect(typeof firstTurn.endSec).toBe('number');
  });

  it('should correctly format timestamps', () => {
    expect(audioPodcastService.formatTimestamp(0)).toBe('00:00');
    expect(audioPodcastService.formatTimestamp(65)).toBe('01:05');
    expect(audioPodcastService.formatTimestamp(305)).toBe('05:05');
  });
});
