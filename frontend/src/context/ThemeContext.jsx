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

  // Fallback initial theme logic if Redux is not yet populated or in isolated context
  const getInitialTheme = () => {
    const saved = localStorage.getItem('openprep_theme') || localStorage.getItem('theme');
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  };

  const theme = reduxTheme || getInitialTheme();

  // Handle OS system preference changes dynamically if user hasn't explicitly set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('openprep_theme') || localStorage.getItem('theme');
      if (!saved) {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        dispatch(setThemeAction(newSystemTheme));
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
  }, [dispatch]);

  // Sync theme changes with DOM root (html tag) and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
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
