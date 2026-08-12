import React from 'react';
import { Mic, MicOff, AlertCircle, Pause, Play } from 'lucide-react';

const VoiceModeToggle = ({ isSupported, isEnabled, isPaused, toggleVoiceMode, errorMsg, status }) => {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/50">
        <AlertCircle className="w-4 h-4" />
        <span>Voice mode not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {errorMsg && (
        <div className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded dark:bg-red-900/30">
          {errorMsg}
        </div>
      )}
      
      <div aria-live="polite" className="sr-only">
        {`Voice mode is ${isEnabled ? (isPaused ? 'paused' : 'enabled') : 'disabled'}. Status: ${status}.`}
      </div>

      <button
        onClick={toggleVoiceMode}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-colors border ${
          isEnabled
            ? 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50'
            : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200 dark:bg-slate-800 dark:text-neutral-400 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
        title="Toggle Hands-Free Voice Mode"
      >
        {isEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        {isEnabled ? (isPaused ? 'Voice: Paused' : 'Voice: On') : 'Voice: Off'}
      </button>
      
      {isEnabled && (
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
           {isPaused ? <Pause className="w-3 h-3" /> : (status === 'LISTENING' || status === 'SPEAKING' || status === 'PROCESSING') ? <Play className="w-3 h-3 text-primary-500" /> : null}
           <span className="uppercase tracking-wider">{status}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceModeToggle;
