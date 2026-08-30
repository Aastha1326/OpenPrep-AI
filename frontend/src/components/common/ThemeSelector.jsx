import React, { useState, useEffect } from 'react';

const AVAILABLE_THEMES = [
  { id: 'light-aurora', label: '☀️ Light Aurora' },
  { id: 'dark-slate', label: '🌑 Dark Slate' },
  { id: 'midnight-oled', label: '📱 Midnight OLED' },
  { id: 'solarized-warm', label: '🍂 Solarized Warm' },
  { id: 'high-contrast-aaa', label: '♿ High-Contrast AAA' }
];

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark-slate';
  });

  const applyTheme = (themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('openprep_theme', themeId);
    setCurrentTheme(themeId);
  };

  // Keyboard Shortcut Matrix Integration (Ctrl/Cmd + Shift + T)
  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const currentIndex = AVAILABLE_THEMES.findIndex(t => t.id === currentTheme);
        const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
        applyTheme(AVAILABLE_THEMES[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [currentTheme]);

  return (
    <div className="theme-selector-wrapper flex flex-col gap-1.5 p-4 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl max-w-xs shadow-lg">
      <label htmlFor="themeSelectorDropdown" className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
        👁️ Accessibility Contrast Engine
      </label>
      
      <select
        id="themeSelectorDropdown"
        value={currentTheme}
        onChange={(e) => applyTheme(e.target.value)}
        className="w-full text-xs font-medium p-2 bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all cursor-pointer"
      >
        {AVAILABLE_THEMES.map(theme => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
      
      <span className="text-[10px] text-[var(--text-secondary)] block italic mt-1 font-mono">
        💡 Tip: Press <kbd className="bg-[var(--bg-canvas)] border px-1 rounded shadow-sm">Ctrl + Shift + T</kbd> to cycle anytime.
      </span>
    </div>
  );
}
