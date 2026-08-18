import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from './useTextToSpeech';
import { splitSentences } from '../utils/textUtils';

describe('useTextToSpeech', () => {
  let utterances;
  let mockSynth;

  beforeEach(() => {
    utterances = [];

    // Capture what the hook actually hands to the engine, so a test can drive
    // boundary events against the same string the browser would.
    window.SpeechSynthesisUtterance = vi.fn(function MockUtterance(text) {
      this.text = text;
      this.rate = 1;
      this.onboundary = null;
      this.onend = null;
      this.onerror = null;
      utterances.push(this);
    });

    mockSynth = { speak: vi.fn(), cancel: vi.fn() };
    window.speechSynthesis = mockSynth;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.SpeechSynthesisUtterance;
    delete window.speechSynthesis;
  });

  /** Fire a boundary event at `charIndex` on the most recent utterance. */
  const boundaryAt = (charIndex) => {
    const utterance = utterances[utterances.length - 1];
    act(() => {
      utterance.onboundary({ charIndex, name: 'word' });
    });
  };

  it('reports support based on the speechSynthesis API', () => {
    const { result } = renderHook(() => useTextToSpeech('Hello.'));
    expect(result.current.supported).toBe(true);
  });

  it('speaks the trimmed text', () => {
    const { result } = renderHook(() => useTextToSpeech('  Hello there.  '));
    act(() => result.current.speak());

    expect(mockSynth.speak).toHaveBeenCalled();
    expect(utterances[0].text).toBe('Hello there.');
  });

  it('does not speak empty or whitespace-only text', () => {
    const { result } = renderHook(() => useTextToSpeech('   '));
    act(() => result.current.speak());
    expect(mockSynth.speak).not.toHaveBeenCalled();
  });

  it('marks the first sentence active as soon as it starts', () => {
    const { result } = renderHook(() => useTextToSpeech('One. Two.'));
    act(() => result.current.speak());
    expect(result.current.activeSentenceIndex).toBe(0);
  });

  /**
   * The regression this hook had: sentence offsets were computed from the raw
   * prop while the engine received the trimmed string, so leading whitespace
   * shifted every boundary comparison and the wrong sentence was highlighted.
   */
  describe('sentence highlighting with leading whitespace', () => {
    const raw = '  First sentence. Second sentence. Third one.';
    const spoken = raw.trim();
    const sentences = splitSentences(spoken);

    it('speaks the trimmed string', () => {
      const { result } = renderHook(() => useTextToSpeech(raw));
      act(() => result.current.speak());
      expect(utterances[0].text).toBe(spoken);
    });

    it.each([0, 1, 2])('highlights sentence %i at its own start offset', (index) => {
      const { result } = renderHook(() => useTextToSpeech(raw));
      act(() => result.current.speak());

      boundaryAt(sentences[index].start);
      expect(result.current.activeSentenceIndex).toBe(index);
    });

    it('highlights the right sentence mid-word', () => {
      const { result } = renderHook(() => useTextToSpeech(raw));
      act(() => result.current.speak());

      boundaryAt(sentences[1].start + 4);
      expect(result.current.activeSentenceIndex).toBe(1);
    });

    it('never moves the highlight backwards as the reading advances', () => {
      const { result } = renderHook(() => useTextToSpeech(raw));
      act(() => result.current.speak());

      let previous = result.current.activeSentenceIndex;
      for (let i = 0; i < spoken.length; i += 1) {
        boundaryAt(i);
        expect(result.current.activeSentenceIndex).toBeGreaterThanOrEqual(previous);
        previous = result.current.activeSentenceIndex;
      }
      expect(previous).toBe(sentences.length - 1);
    });
  });

  it('clears the highlight when speech ends', () => {
    const { result } = renderHook(() => useTextToSpeech('One. Two.'));
    act(() => result.current.speak());
    act(() => utterances[0].onend());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.activeSentenceIndex).toBe(-1);
  });

  it('clears the highlight on error', () => {
    const { result } = renderHook(() => useTextToSpeech('One. Two.'));
    act(() => result.current.speak());
    act(() => utterances[0].onerror());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.activeSentenceIndex).toBe(-1);
  });

  it('stop() cancels speech and resets state', () => {
    const { result } = renderHook(() => useTextToSpeech('One. Two.'));
    act(() => result.current.speak());
    act(() => result.current.stop());

    expect(mockSynth.cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.activeSentenceIndex).toBe(-1);
  });

  it('toggle() starts then stops', () => {
    const { result } = renderHook(() => useTextToSpeech('One. Two.'));

    act(() => result.current.toggle());
    expect(result.current.isSpeaking).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('cycles through the configured rates', () => {
    const { result } = renderHook(() => useTextToSpeech('One.', { rates: [1, 2] }));

    act(() => result.current.cycleRate());
    expect(result.current.rate).toBe(2);

    act(() => result.current.cycleRate());
    expect(result.current.rate).toBe(1);
  });

  it('re-derives sentences when the text prop changes', () => {
    const { result, rerender } = renderHook(({ text }) => useTextToSpeech(text), {
      initialProps: { text: 'One. Two.' },
    });

    rerender({ text: '   Alpha. Beta. Gamma.' });
    act(() => result.current.speak());

    expect(utterances[utterances.length - 1].text).toBe('Alpha. Beta. Gamma.');

    const next = splitSentences('Alpha. Beta. Gamma.');
    boundaryAt(next[2].start);
    expect(result.current.activeSentenceIndex).toBe(2);
  });
});
