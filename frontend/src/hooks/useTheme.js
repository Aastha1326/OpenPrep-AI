/**
 * @fileoverview Custom hook for managing theme and accessibility settings.
 * Handles localStorage persistence, system preference detection, and FOUC prevention.
 */
import { useState, useEffect } from 'react';

const THEME_KEY = 'openprep-theme';
const FONT_SCALE_KEY = 'openprep-font-scale';
const DYSLEXIC_KEY = 'openprep-dyslexic-font';
const REDUCED_MOTION_KEY = 'openprep-reduced-motion';

export const useTheme = () => {
    // Initialize state from localStorage or system preference
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved) return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    const [fontScale, setFontScale] = useState(() => {
        return parseFloat(localStorage.getItem(FONT_SCALE_KEY)) || 1.0;
    });

    const [useDyslexicFont, setUseDyslexicFont] = useState(() => {
        return localStorage.getItem(DYSLEXIC_KEY) === 'true';
    });

    const [reduceMotion, setReduceMotion] = useState(() => {
        return localStorage.getItem(REDUCED_MOTION_KEY) === 'true';
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    // Apply font scale to document
    useEffect(() => {
        document.documentElement.style.setProperty('--font-scale', fontScale.toString());
        localStorage.setItem(FONT_SCALE_KEY, fontScale.toString());
    }, [fontScale]);

    // Apply dyslexic font class to body
    useEffect(() => {
        if (useDyslexicFont) {
            document.body.classList.add('font-dyslexic');
        } else {
            document.body.classList.remove('font-dyslexic');
        }
        localStorage.setItem(DYSLEXIC_KEY, useDyslexicFont.toString());
    }, [useDyslexicFont]);

    // Apply reduced motion class to body
    useEffect(() => {
        if (reduceMotion) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
        localStorage.setItem(REDUCED_MOTION_KEY, reduceMotion.toString());
    }, [reduceMotion]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return {
        theme,
        setTheme,
        fontScale,
        setFontScale,
        useDyslexicFont,
        setUseDyslexicFont,
        reduceMotion,
        setReduceMotion,
    };
};
