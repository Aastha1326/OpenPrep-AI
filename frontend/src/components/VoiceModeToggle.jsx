import React from 'react';
import { Mic, MicOff, AlertCircle, Pause, Play } from 'lucide-react';

const VoiceModeToggle = ({
  isSupported,
  isEnabled,
  isPaused,
  toggleVoiceMode,
  errorMsg,
  status,
  speechRate,
  onSpeechRateChange,
  language,
  onLanguageChange,
  supportedLanguages = [],
}) => {
  if (!isSupported) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/50"
      >
        <AlertCircle className="w-4 h-4" />
        <span>
          Voice mode is unavailable in this browser. You can still review
          cards normally.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {errorMsg && (
        <div
          role="alert"
          className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded dark:bg-red-900/30"
        >
          {errorMsg}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {`Hands-free mode is ${
          isEnabled ? (isPaused ? 'paused' : 'enabled') : 'disabled'
        }. Status: ${status}.`}
      </div>

      <button
        type="button"
        onClick={toggleVoiceMode}
        aria-pressed={isEnabled}
        aria-label={
          isEnabled
            ? 'Disable hands-free mode'
            : 'Enable hands-free mode'
        }
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-colors border ${
          isEnabled
            ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50'
            : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200 dark:bg-slate-800 dark:text-neutral-400 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
      >
        {isEnabled ? (
          <Mic className="w-4 h-4" aria-hidden="true" />
        ) : (
          <MicOff className="w-4 h-4" aria-hidden="true" />
        )}

        {isEnabled
          ? isPaused
            ? 'Hands-Free: Paused'
            : 'Hands-Free: On'
          : 'Hands-Free: Off'}
      </button>

      {isEnabled && (
        <>
          <label className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Speed</span>
            <select
              value={speechRate}
              onChange={(event) =>
                onSpeechRateChange(Number(event.target.value))
              }
              aria-label="Speech speed"
              className="rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1"
            >
              <option value="0.75">0.75×</option>
              <option value="1">1×</option>
              <option value="1.25">1.25×</option>
            </select>
          </label>

          <label className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Language</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              aria-label="Speech language"
              className="rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1"
            >
              {supportedLanguages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {isPaused ? (
              <Pause className="w-3 h-3" aria-hidden="true" />
            ) : status === 'LISTENING' ||
              status === 'SPEAKING' ||
              status === 'PROCESSING' ? (
              <Play className="w-3 h-3 text-primary-500" aria-hidden="true" />
            ) : null}

            <span className="uppercase tracking-wider">{status}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceModeToggle;