import { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const AudioReader = ({
  text,
  className = '',
  buttonClassName = '',
  rateClassName = '',
  rates,
  initialRate,
  onSentenceChange,
}) => {
  const { supported, isSpeaking, rate, toggle, cycleRate, activeSentenceIndex } =
    useTextToSpeech(text, { rates, initialRate });

  useEffect(() => {
    if (onSentenceChange) onSentenceChange(activeSentenceIndex);
  }, [activeSentenceIndex, onSentenceChange]);

  if (!supported || !text || !text.trim()) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        title={isSpeaking ? 'Stop reading' : 'Listen to this text'}
        aria-label={isSpeaking ? 'Stop reading' : 'Listen to text'}
        className={`p-1.5 rounded-full transition-colors ${
          isSpeaking
            ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 animate-pulse'
            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-slate-700'
        } ${buttonClassName}`}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <button
        type="button"
        onClick={cycleRate}
        title="Adjust reading speed"
        aria-label={`Speech rate: ${rate}x`}
        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
          isSpeaking
            ? 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50'
            : 'text-neutral-600 bg-neutral-100 dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600'
        } ${rateClassName}`}
      >
        {rate}x
      </button>
    </div>
  );
};

export default AudioReader;
