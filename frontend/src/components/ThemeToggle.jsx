import { Sun, Moon, Eye, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-amber-100/50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition"
        aria-label="Toggle theme"
        title={`Toggle Theme (Current: ${theme})`}
      >
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-amber-400" />
        ) : theme === 'light' ? (
          <Sun className="h-5 w-5 text-amber-900" />
        ) : (
          <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      <button
        onClick={toggleHighContrast}
        className={`p-2 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold ${
          highContrast
            ? 'bg-black text-white border-2 border-white dark:bg-white dark:text-black dark:border-black'
            : 'bg-amber-100/50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-amber-900 dark:text-amber-200'
        }`}
        aria-label="Toggle High Contrast Mode"
        title="Toggle High Contrast Accessibility Mode"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">High Contrast</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
