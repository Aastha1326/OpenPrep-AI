import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import ThemeSelectorModal from './ThemeSelectorModal';

const ThemeToggle = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  );
};

export default ThemeToggle;
