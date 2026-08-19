import React, { useState } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeSelectorModal from './ThemeSelectorModal';

const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High Contrast',
  system: 'System',
};

const ThemeToggle = ({ className = '', showPaletteOption = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const nextThemeLabel = isDark ? 'light' : 'dark';
  const currentLabel =
    theme === 'system' ? `${THEME_LABELS[resolvedTheme]} (System)` : THEME_LABELS[theme];

  return (
    <>
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer"
          aria-label={`Switch to ${nextThemeLabel} mode`}
          title={`Switch to ${nextThemeLabel} mode (Current: ${currentLabel})`}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700" />
          )}
        </button>

        {showPaletteOption && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer"
            aria-label="Open theme selector modal"
            title="Open theme selector modal"
          >
            <Palette className="h-5 w-5" />
          </button>
        )}
      </div>

      <ThemeSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ThemeToggle;
