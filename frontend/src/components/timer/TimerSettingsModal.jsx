import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { usePomodoro } from '../../context/PomodoroContext';

/**
 * TimerSettingsModal — configure Pomodoro work / break durations.
 */

const TimerSettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = usePomodoro();

  const [local, setLocal] = useState({ ...settings });

  const handleChange = useCallback((field, value) => {
    const num = parseInt(value, 10);
    if (Number.isNaN(num) || num < 1) return;
    setLocal((prev) => ({ ...prev, [field]: num }));
  }, []);

  const handleSave = useCallback(() => {
    updateSettings(local);
    onClose();
  }, [local, updateSettings, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Timer settings"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Timer Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            aria-label="Close settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Focus Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Focus Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="60"
                value={local.workDuration}
                onChange={(e) => handleChange('workDuration', e.target.value)}
                className="flex-1 h-2 cursor-pointer accent-amber-500"
                aria-label="Focus duration in minutes"
              />
              <span className="w-12 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {local.workDuration}m
              </span>
            </div>
          </div>

          {/* Short Break */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Short Break
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                value={local.shortBreakDuration}
                onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
                className="flex-1 h-2 cursor-pointer accent-emerald-500"
                aria-label="Short break duration in minutes"
              />
              <span className="w-12 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {local.shortBreakDuration}m
              </span>
            </div>
          </div>

          {/* Long Break */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Long Break
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="60"
                value={local.longBreakDuration}
                onChange={(e) => handleChange('longBreakDuration', e.target.value)}
                className="flex-1 h-2 cursor-pointer accent-blue-500"
                aria-label="Long break duration in minutes"
              />
              <span className="w-12 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {local.longBreakDuration}m
              </span>
            </div>
          </div>

          {/* Cycles before long break */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cycles Before Long Break
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="8"
                value={local.cyclesBeforeLongBreak}
                onChange={(e) => handleChange('cyclesBeforeLongBreak', e.target.value)}
                className="flex-1 h-2 cursor-pointer accent-purple-500"
                aria-label="Cycles before long break"
              />
              <span className="w-12 text-center text-sm font-semibold text-slate-900 dark:text-white">
                {local.cyclesBeforeLongBreak}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 cursor-pointer transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

TimerSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TimerSettingsModal;
