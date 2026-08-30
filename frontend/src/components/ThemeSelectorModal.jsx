import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Eye,
  Monitor,
  Layers,
  Trees,
  Flame,
  Feather,
  Palette,
} from 'lucide-react';
import Modal from './common/Modal';
import ThemeCustomizerDrawer from './ThemeCustomizerDrawer';

const THEME_OPTIONS = [
  { id: 'light', label: 'Light (Warm Cream)', icon: Sun },
  { id: 'dark', label: 'Dark Slate', icon: Moon },
  { id: 'glassmorphism', label: 'Modern Glassmorphism', icon: Layers },
  { id: 'oled', label: 'Midnight AMOLED Dark', icon: Moon },
  { id: 'emerald', label: 'Emerald Study', icon: Trees },
  { id: 'sunset', label: 'Sunset Warm', icon: Flame },
  { id: 'sepia', label: 'Sepia Reading', icon: Feather },
  { id: 'high-contrast', label: 'High Contrast', icon: Eye },
  { id: 'system', label: 'System Default', icon: Monitor },
];

const ThemeSelectorModal = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Select Theme Preset" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {THEME_OPTIONS.map((t) => {
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
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-400'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isSelected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  />
                  <span
                    className={`font-medium text-xs sm:text-sm ${
                      isSelected
                        ? 'text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Want custom HSL accent colors?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" /> Customize Accents
            </button>
          </div>
        </div>
      </Modal>

      <ThemeCustomizerDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default ThemeSelectorModal;

