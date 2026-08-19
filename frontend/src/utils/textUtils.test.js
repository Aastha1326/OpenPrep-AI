import { describe, it, expect } from 'vitest';
import { splitSentences, findSentenceAt, toSentenceSegments } from './textUtils';

describe('splitSentences', () => {
  it('returns an empty array for unusable input', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences(null)).toEqual([]);
    expect(splitSentences(undefined)).toEqual([]);
    expect(splitSentences(42)).toEqual([]);
    expect(splitSentences('   ')).toEqual([]);
  });

  it('splits on sentence terminators', () => {
    const sentences = splitSentences('One. Two! Three?');
    expect(sentences.map((s) => s.text)).toEqual(['One.', 'Two!', 'Three?']);
  });

  it('keeps a trailing fragment with no terminator', () => {
    const sentences = splitSentences('Done. Not finished');
    expect(sentences.map((s) => s.text)).toEqual(['Done.', 'Not finished']);
  });

  it('keeps closing punctuation with its sentence', () => {
    const sentences = splitSentences('He said "go!" Then left.');
    expect(sentences[0].text).toBe('He said "go!"');
  });

  it('handles a single sentence with no terminator', () => {
    expect(splitSentences('Just words').map((s) => s.text)).toEqual(['Just words']);
  });

  // The core regression: offsets used to come from the untrimmed regex match
  // while `text` was trimmed, so every range was shifted.
  describe('offset integrity', () => {
    const cases = [
      'First sentence. Second sentence. Third one.',
      '  Leading whitespace. Then more.',
      'Multi\nline. Across paragraphs.\n\nAnd another.',
      'Tight.Packed.Sentences.',
      'Trailing space. ',
    ];

    it.each(cases)('slice(start, end) round-trips the reported text for %j', (source) => {
      for (const sentence of splitSentences(source)) {
        expect(source.slice(sentence.start, sentence.end)).toBe(sentence.text);
      }
    });

    it.each(cases)('produces non-overlapping, ascending ranges for %j', (source) => {
      const sentences = splitSentences(source);
      for (let i = 1; i < sentences.length; i += 1) {
        expect(sentences[i - 1].end).toBeLessThanOrEqual(sentences[i].start);
        expect(sentences[i].start).toBeLessThan(sentences[i].end);
      }
    });

    it('does not include leading whitespace in a sentence range', () => {
      const source = 'One. Two.';
      const [, second] = splitSentences(source);
      // 'Two.' starts at 5; index 4 is the separating space.
      expect(second.start).toBe(5);
      expect(source[second.start]).toBe('T');
    });
  });
});

describe('findSentenceAt', () => {
  const source = 'First sentence. Second sentence. Third one.';
  const sentences = splitSentences(source);

  it('returns -1 when there is nothing to match', () => {
    expect(findSentenceAt([], 0)).toBe(-1);
    expect(findSentenceAt(null, 0)).toBe(-1);
    expect(findSentenceAt(sentences, -1)).toBe(-1);
    expect(findSentenceAt(sentences, NaN)).toBe(-1);
  });

  // A boundary event fires at the first character of a word, so for the first
  // word of a sentence charIndex lands exactly on that sentence's start. The
  // old inclusive `start <= i <= end` test matched the *previous* sentence
  // there and returned early, leaving the highlight one sentence behind.
  it.each([0, 1, 2])('maps a sentence start to that sentence (index %i)', (index) => {
    expect(findSentenceAt(sentences, sentences[index].start)).toBe(index);
  });

  it('maps an index inside a sentence to that sentence', () => {
    const middle = sentences[1].start + 3;
    expect(findSentenceAt(sentences, middle)).toBe(1);
  });

  it('maps an index past the end to the final sentence', () => {
    expect(findSentenceAt(sentences, source.length + 10)).toBe(sentences.length - 1);
  });

  it('advances monotonically across every offset in the source', () => {
    let previous = -1;
    for (let i = 0; i < source.length; i += 1) {
      const current = findSentenceAt(sentences, i);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it('never selects a sentence that has not started yet', () => {
    for (let i = 0; i < source.length; i += 1) {
      const index = findSentenceAt(sentences, i);
      if (index >= 0) {
        expect(sentences[index].start).toBeLessThanOrEqual(i);
      }
    }
  });
});

describe('toSentenceSegments', () => {
  it('returns an empty array for unusable input', () => {
    expect(toSentenceSegments('')).toEqual([]);
    expect(toSentenceSegments(null)).toEqual([]);
  });

  it('preserves the exact whitespace between sentences', () => {
    expect(toSentenceSegments('Line one.\n\nLine two.')).toEqual([
      { lead: '', text: 'Line one.', index: 0 },
      { lead: '\n\n', text: 'Line two.', index: 1 },
    ]);
  });

  it('keeps leading whitespace on the first segment', () => {
    const [first] = toSentenceSegments('   Indented start. Next.');
    expect(first.lead).toBe('   ');
  });

  it('reassembles into the original string with no characters lost', () => {
    const source = '  One.\n\nTwo.   Three?\n';
    const rebuilt = toSentenceSegments(source)
      .map((segment) => `${segment.lead}${segment.text}${segment.trail || ''}`)
      .join('');
    expect(rebuilt).toBe(source);
  });

  it('numbers segments so the index lines up with splitSentences', () => {
    const source = 'A. B. C.';
    expect(toSentenceSegments(source).map((s) => s.index)).toEqual([0, 1, 2]);
    expect(toSentenceSegments(source).map((s) => s.text)).toEqual(
      splitSentences(source).map((s) => s.text)
    );
  });
});
