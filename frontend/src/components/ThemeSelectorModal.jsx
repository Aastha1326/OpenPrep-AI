import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Eye, Monitor } from 'lucide-react';
import Modal from './common/Modal';

const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'high-contrast', label: 'High Contrast', icon: Eye },
    { id: 'system', label: 'System Default', icon: Monitor },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Theme" size="sm">
      <div className="space-y-2">
        {themes.map((t) => {
          const Icon = t.icon;
          const isSelected = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                onClose();
              }}
              aria-pressed={isSelected}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              <span
                className={`font-medium ${
                  isSelected
                    ? 'text-indigo-900 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default ThemeSelectorModal;
