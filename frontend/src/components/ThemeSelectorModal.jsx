import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Eye, Monitor, X } from 'lucide-react';

const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'high-contrast', label: 'High Contrast', icon: Eye },
    { id: 'system', label: 'System Default', icon: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="theme-modal-title"
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="theme-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Theme
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close theme selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  onClose();
                }}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border-2 ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400' 
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className={`font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectorModal;
