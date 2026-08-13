import { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Theme can be: 'light', 'dark', 'high-contrast', 'system'
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('openprep_theme') || localStorage.getItem('theme');
      return saved || 'system';
    }
    return 'system';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

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
    
    // Clear old classes
    root.classList.remove('dark', 'oled', 'high-contrast');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'high-contrast') {
      root.classList.add('high-contrast');
    } else if (theme === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      }
    }
    
    localStorage.setItem('openprep_theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
