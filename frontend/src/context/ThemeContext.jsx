import { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as toggleThemeAction, setTheme as setThemeAction } from '../store/slices/dashboardSlice';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const reduxTheme = useSelector((state) => state.dashboard?.theme);

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

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


