import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildWeakCardContext } from './remediationService';

vi.mock('./cacheService', () => ({
  default: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

vi.mock('./geminiService', () => ({
  generateQuiz: vi.fn(async () => ({
    title: 'Diagnostic Quiz',
    questions: [
      { questionText: 'What is an aldehyde?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'CHO group' },
    ],
  })),
}));

describe('remediationService.buildWeakCardContext', () => {
  it('formats weak cards into a numbered list', () => {
    const cards = [
      { id: '1', front: 'What is X?', back: 'X is Y' },
      { id: '2', front: 'Define Z', back: 'Z is W' },
    ];
    const result = buildWeakCardContext(cards);
    expect(result).toContain('1. Term: "What is X?" — Answer: "X is Y"');
    expect(result).toContain('2. Term: "Define Z" — Answer: "Z is W"');
  });

  it('caps the output at 20 cards', () => {
    const cards = Array.from({ length: 25 }, (_, i) => ({
      id: String(i), front: `Q${i}`, back: `A${i}`,
    }));
    const result = buildWeakCardContext(cards);
    const lines = result.split('\n');
    expect(lines.length).toBe(20);
  });
});

describe('remediationService.generateRemediationQuiz', () => {
  it('throws if fewer than 2 cards are provided', async () => {
    const { generateRemediationQuiz } = await import('./remediationService');
    await expect(
      generateRemediationQuiz({ userId: 'u1', deckId: 'd1', subjectName: 'Bio', weakCards: [{ id: '1', front: 'Q', back: 'A' }] })
    ).rejects.toThrow('At least 2 failed cards');
  });

  it('calls geminiService.generateQuiz and returns result', async () => {
    const { generateRemediationQuiz } = await import('./remediationService');
    const gemini = await import('./geminiService');

    const result = await generateRemediationQuiz({
      userId: 'u1',
      deckId: 'd1',
      subjectName: 'Chemistry',
      weakCards: [
        { id: '1', front: 'Aldehyde?', back: 'CHO' },
        { id: '2', front: 'Ketone?', back: 'CO' },
      ],
      count: 5,
    });

    expect(gemini.generateQuiz).toHaveBeenCalled();
    expect(result.title).toBe('Diagnostic Quiz');
    expect(result.questions.length).toBeGreaterThan(0);
  });
});
