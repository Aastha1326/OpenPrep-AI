import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AudioReader from './AudioReader';

const setupSpeech = () => {
  const utterances = [];
  global.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.onboundary = null;
      this.onend = null;
      this.onerror = null;
      utterances.push(this);
    }
  };
  const speak = vi.fn();
  const cancel = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: { speak, cancel },
  });
  return { utterances, speak, cancel };
};

const teardownSpeech = () => {
  delete window.speechSynthesis;
  delete global.SpeechSynthesisUtterance;
};

describe('AudioReader', () => {
  afterEach(() => {
    teardownSpeech();
  });

  it('renders nothing when speech synthesis is not supported', () => {
    render(<AudioReader text="Hello world." />);
    expect(screen.queryByLabelText('Listen to text')).not.toBeInTheDocument();
  });

  it('renders nothing when text is empty', () => {
    setupSpeech();
    render(<AudioReader text="" />);
    expect(screen.queryByLabelText('Listen to text')).not.toBeInTheDocument();
  });

  it('starts reading on play and stops on a second click', () => {
    const { speak, cancel } = setupSpeech();
    render(<AudioReader text="Hello world. This is a test." />);

    fireEvent.click(screen.getByLabelText('Listen to text'));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Stop reading')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Stop reading'));
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByLabelText('Listen to text')).toBeInTheDocument();
  });

  it('speaks the provided text with the current rate', () => {
    const { utterances } = setupSpeech();
    render(<AudioReader text="Revision summary text." />);

    fireEvent.click(screen.getByLabelText('Listen to text'));
    expect(utterances).toHaveLength(1);
    expect(utterances[0].text).toBe('Revision summary text.');
    expect(utterances[0].rate).toBe(1);
  });

  it('cycles the reading speed between 1x, 1.25x and 1.5x', () => {
    setupSpeech();
    render(<AudioReader text="Speed control test." />);

    expect(screen.getByLabelText('Speech rate: 1x')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Speech rate: 1x'));
    expect(screen.getByLabelText('Speech rate: 1.25x')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Speech rate: 1.25x'));
    expect(screen.getByLabelText('Speech rate: 1.5x')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Speech rate: 1.5x'));
    expect(screen.getByLabelText('Speech rate: 1x')).toBeInTheDocument();
  });

  it('restarts speech with the new rate when speed changes while reading', () => {
    const { utterances, speak } = setupSpeech();
    render(<AudioReader text="Restart with new rate test." />);

    fireEvent.click(screen.getByLabelText('Listen to text'));
    expect(speak).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Speech rate: 1x'));
    expect(speak).toHaveBeenCalledTimes(2);
    expect(utterances[utterances.length - 1].rate).toBe(1.25);
  });

  it('reports the active sentence as speech boundary events fire', async () => {
    const { utterances } = setupSpeech();
    const onSentenceChange = vi.fn();
    render(
      <AudioReader
        text="Hello world. This is a second sentence."
        onSentenceChange={onSentenceChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Listen to text'));

    act(() => {
      utterances[0].onboundary({ charIndex: 21 });
    });

    await waitFor(() =>
      expect(onSentenceChange.mock.calls.some(([index]) => index === 1)).toBe(true)
    );
  });
});
