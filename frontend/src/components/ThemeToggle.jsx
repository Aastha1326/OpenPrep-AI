import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import ThemeSelectorModal from './ThemeSelectorModal';

const ThemeToggle = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-2 rounded-lg transition bg-amber-100/50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 ${className}`}
        aria-label="Open theme selector"
        title="Change Theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      <ThemeSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
        onClick={toggleTheme}
        className="p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer"
        aria-label="Toggle theme"
        title={`Toggle Theme (Current: ${isDark ? 'Dark' : 'Light'})`}
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-[#E1DCC9]" />
        ) : (
          <Sun className="h-5 w-5 text-[#AD8B73]" />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;

