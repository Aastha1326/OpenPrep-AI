import { describe, it, expect } from 'vitest';
import podcastScriptService from '../../services/podcastScriptService';
import audioSynthesisService from '../../services/audioSynthesisService';

describe('Podcast Studio & Audio Scripting Unit Tests', () => {
  const sampleCards = [
    { front: 'What is ACID in DBMS?', back: 'Atomicity, Consistency, Isolation, and Durability.' },
    { front: 'What is a B-Tree index?', back: 'A self-balancing tree data structure that maintains sorted data.' },
  ];

  it('should generate structured dialogue with thinking intervals and chapters', () => {
    const result = podcastScriptService.generatePodcastScript(sampleCards, 'DBMS Core', 5);

    expect(result.title).toBe('DBMS Core');
    expect(result.chapters.length).toBe(2);
    expect(result.script.length).toBeGreaterThan(sampleCards.length * 2);

    // Verify thinking intervals exist
    const pauses = result.script.filter((s) => s.type === 'THINK_PAUSE');
    expect(pauses.length).toBe(2);
    expect(pauses[0].durationSec).toBe(5);
  });

  it('should generate valid WebVTT cue stream for audio seeking', () => {
    const episode = audioSynthesisService.generateEpisodeData(sampleCards, {
      title: 'OS Concepts',
      thinkTimeSeconds: 4,
    });

    expect(episode.vttTrack).toContain('WEBVTT');
    expect(episode.vttTrack).toContain('-->');
    expect(episode.chapters.length).toBe(2);
  });
});
