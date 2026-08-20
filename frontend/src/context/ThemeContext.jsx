import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

const STORAGE_KEY = 'openprep_theme';
const LEGACY_STORAGE_KEY = 'theme';
const VALID_THEMES = ['light', 'dark', 'high-contrast', 'system'];

const readSavedTheme = () => {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  return VALID_THEMES.includes(saved) ? saved : 'system';
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const ThemeProvider = ({ children }) => {
  // Theme can be: 'light', 'dark', 'high-contrast', 'system'
  const [theme, setThemeState] = useState(readSavedTheme);
  // Tracks the live OS preference so 'system' mode can react to changes
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // The theme actually applied to the UI, resolving 'system' against the OS preference
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') return systemDark ? 'dark' : 'light';
    return theme;
  }, [theme, systemDark]);

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const currentResolved = prevTheme === 'system' ? (systemDark ? 'dark' : 'light') : prevTheme;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  };

  // Listen for OS system preference changes (used while theme === 'system')
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemDark(e.matches);

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
  }, []);

  // Sync the resolved theme to the DOM <html> root and persist the user's selection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.remove('dark', 'oled', 'high-contrast');

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else if (resolvedTheme === 'high-contrast') {
      root.classList.add('high-contrast');
    }

    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(LEGACY_STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
