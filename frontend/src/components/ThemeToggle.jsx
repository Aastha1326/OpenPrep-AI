import React, { useState } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeSelectorModal from './ThemeSelectorModal';
import ThemeCustomizerDrawer from './ThemeCustomizerDrawer';
import { THEME_PRESETS } from '../themePresets';

const ThemeToggle = ({ className = '', showPaletteOption = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { theme, resolvedTheme, isDarkMode, toggleTheme } = useTheme();

  const currentPresetName = THEME_PRESETS[theme]?.name || THEME_PRESETS[resolvedTheme]?.name || 'Light';
  const nextThemeLabel = isDarkMode ? 'light' : 'dark';

  return (
    <>
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer"
          aria-label={`Switch to ${nextThemeLabel} mode`}
          title={`Switch to ${nextThemeLabel} mode (Current: ${currentPresetName})`}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700" />
          )}
        </button>

        {showPaletteOption && (
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-lg transition bg-[#E3CAA5]/60 hover:bg-[#E3CAA5] text-[#2C1E16] dark:bg-[#1F150C] dark:hover:bg-[#412D15] dark:text-[#E1DCC9] border border-[#CEAB93]/40 dark:border-[#412D15] cursor-pointer"
            aria-label="Open theme customizer drawer"
            title="Open theme customizer drawer"
          >
            <Palette className="h-5 w-5" />
          </button>
        )}
      </div>

      <ThemeSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ThemeCustomizerDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default ThemeToggle;

