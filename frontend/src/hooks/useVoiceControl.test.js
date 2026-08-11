import { renderHook, act } from '@testing-library/react';
import useVoiceControl from './useVoiceControl';

describe('useVoiceControl', () => {
  let MockRecognition;
  let mockRecognitionInstance;
  let mockSynth;
  let mockOnCommand;

  beforeEach(() => {
    mockRecognitionInstance = {
      start: vi.fn(),
      abort: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: '',
    };
    
    MockRecognition = vi.fn(() => mockRecognitionInstance);
    window.SpeechRecognition = MockRecognition;

    mockSynth = {
      speak: vi.fn(),
      cancel: vi.fn(),
    };
    window.speechSynthesis = mockSynth;
    
    mockOnCommand = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.SpeechRecognition;
    delete window.speechSynthesis;
  });

  it('handles unsupported browsers', () => {
    delete window.SpeechRecognition;
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    expect(result.current.isSupported).toBe(false);
  });

  it('starts in IDLE state', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    expect(result.current.isSupported).toBe(true);
    expect(result.current.status).toBe('IDLE');
    expect(result.current.isEnabled).toBe(false);
  });

  it('transitions to LISTENING when enabled', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    act(() => {
      result.current.toggleVoiceMode();
    });

    expect(result.current.isEnabled).toBe(true);
    expect(mockRecognitionInstance.start).toHaveBeenCalled();

    act(() => {
      mockRecognitionInstance.onstart();
    });

    expect(result.current.status).toBe('LISTENING');
  });

  it('parses commands correctly above confidence threshold', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    act(() => {
      result.current.toggleVoiceMode();
      mockRecognitionInstance.onstart();
    });

    // Simulate speech recognition result
    act(() => {
      const event = {
        results: [
          [{ transcript: 'flip', confidence: 0.8 }]
        ]
      };
      mockRecognitionInstance.onresult(event);
    });

    expect(result.current.status).toBe('PROCESSING');
    expect(mockOnCommand).toHaveBeenCalledWith('FLIP');

    act(() => {
      vi.advanceTimersByTime?.(500);
    });
  });

  it('ignores commands below confidence threshold', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    act(() => {
      result.current.toggleVoiceMode();
      mockRecognitionInstance.onstart();
    });

    act(() => {
      const event = {
        results: [
          [{ transcript: 'flip', confidence: 0.5 }]
        ]
      };
      mockRecognitionInstance.onresult(event);
    });

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('handles pause and resume commands', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    act(() => {
      result.current.toggleVoiceMode();
      mockRecognitionInstance.onstart();
    });

    act(() => {
      mockRecognitionInstance.onresult({
        results: [[{ transcript: 'pause', confidence: 0.9 }]]
      });
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.status).toBe('IDLE');

    act(() => {
      mockRecognitionInstance.onresult({
        results: [[{ transcript: 'resume', confidence: 0.9 }]]
      });
    });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.status).toBe('LISTENING');
  });

  it('mutes recognition while speaking', () => {
    const { result } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    act(() => {
      result.current.toggleVoiceMode();
      mockRecognitionInstance.onstart();
    });

    act(() => {
      result.current.speak('Hello world');
    });

    expect(result.current.status).toBe('SPEAKING');
    expect(mockRecognitionInstance.abort).toHaveBeenCalled();
    expect(mockSynth.cancel).toHaveBeenCalled();
    expect(mockSynth.speak).toHaveBeenCalled();

    // simulate speech recognition result while speaking
    act(() => {
      mockRecognitionInstance.onresult({
        results: [[{ transcript: 'flip', confidence: 0.9 }]]
      });
    });

    expect(mockOnCommand).not.toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useVoiceControl({ onCommand: mockOnCommand }));
    
    unmount();
    
    expect(mockRecognitionInstance.abort).toHaveBeenCalled();
    expect(mockSynth.cancel).toHaveBeenCalled();
  });
});
