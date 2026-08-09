import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as toggleThemeAction, setTheme as setThemeAction } from '../store/slices/dashboardSlice';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const reduxTheme = useSelector((state) => state.dashboard?.theme);

  // High contrast accessibility mode state
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openprep_high_contrast') === 'true' || localStorage.getItem('high_contrast') === 'true';
    }
    return false;
  });

  const getInitialTheme = () => {
    const saved = localStorage.getItem('openprep_theme') || localStorage.getItem('theme');
    if (saved) return saved;
    return 'system';
  };

  const theme = reduxTheme || getInitialTheme();

  // Handle OS system preference changes dynamically
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const root = window.document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  // Sync theme changes with DOM root (html tag) and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('oled');

    } else if (theme === 'oled') {
      root.classList.add('dark');
      root.classList.add('oled');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.remove('oled');
    } else if (theme === 'system') {
      root.classList.remove('oled');

      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('openprep_theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync high contrast mode changes with DOM root (html tag) and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('openprep_high_contrast', highContrast);
    localStorage.setItem('high_contrast', highContrast);
  }, [highContrast]);

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
