import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeSelectorModal from './ThemeSelectorModal';

const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High Contrast',
  system: 'System',
};

const ThemeToggle = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const currentLabel =
    theme === 'system' ? `${THEME_LABELS[resolvedTheme]} (System)` : THEME_LABELS[theme];

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer ${className}`}
        aria-label="Open theme selector"
        title={`Change Theme (Current: ${currentLabel})`}
      >
        <Palette className="h-5 w-5" />
      </button>

      <ThemeSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default ThemeToggle;
