import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

// Controllable matchMedia mock so tests can simulate OS preference changes
const mediaListeners = [];
let systemDark = false;

const createMatchMediaMock = () =>
  vi.fn().mockImplementation((query) => ({
    matches: systemDark,
    media: query,
    onchange: null,
    addListener: (cb) => mediaListeners.push(cb),
    removeListener: vi.fn(),
    addEventListener: (type, cb) => mediaListeners.push(cb),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const setSystemDark = (value) => {
  systemDark = value;
  act(() => {
    mediaListeners.forEach((cb) => cb({ matches: value }));
  });
};

const Probe = () => {
  const {
    theme,
    resolvedTheme,
    accentColors,
    setTheme,
    toggleTheme,
    setAccentColors,
    resetAccentColors,
  } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <span data-testid="primary-accent">{accentColors?.primary?.hex}</span>
      <span data-testid="secondary-accent">{accentColors?.secondary?.hex}</span>
      <button onClick={() => setTheme('light')}>Set light</button>
      <button onClick={() => setTheme('dark')}>Set dark</button>
      <button onClick={() => setTheme('glassmorphism')}>Set glassmorphism</button>
      <button onClick={() => setTheme('oled')}>Set oled</button>
      <button onClick={() => setTheme('emerald')}>Set emerald</button>
      <button onClick={() => setTheme('sunset')}>Set sunset</button>
      <button onClick={() => setTheme('sepia')}>Set sepia</button>
      <button onClick={() => setTheme('high-contrast')}>Set high-contrast</button>
      <button onClick={() => setTheme('system')}>Set system</button>
      <button onClick={() => setAccentColors({ primary: { h: 200, s: 80, l: 50, hex: '#1fa2ff' } })}>
        Set custom primary
      </button>
      <button onClick={resetAccentColors}>Reset accent</button>
      <button onClick={toggleTheme}>Toggle theme</button>
    </div>
  );
};

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );

describe('ThemeContext', () => {
  beforeEach(() => {
    mediaListeners.length = 0;
    systemDark = false;
    let store = {};
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
      },
    });
    document.documentElement.className = '';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(),
    });
  });

  it('defaults to "system" when no preference is saved', () => {
    renderProbe();
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('loads a saved preference from localStorage', () => {
    localStorage.setItem('openprep_theme', 'dark');
    renderProbe();
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('falls back to "system" for an invalid saved value', () => {
    localStorage.setItem('openprep_theme', 'invalid-theme');
    renderProbe();
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('switches to preset themes and syncs DOM classes', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText('Set glassmorphism'));
    expect(screen.getByTestId('theme')).toHaveTextContent('glassmorphism');
    expect(document.documentElement.classList.contains('theme-glassmorphism')).toBe(true);

    await user.click(screen.getByText('Set emerald'));
    expect(screen.getByTestId('theme')).toHaveTextContent('emerald');
    expect(document.documentElement.classList.contains('theme-emerald')).toBe(true);

    await user.click(screen.getByText('Set sunset'));
    expect(screen.getByTestId('theme')).toHaveTextContent('sunset');
    expect(document.documentElement.classList.contains('theme-sunset')).toBe(true);

    await user.click(screen.getByText('Set sepia'));
    expect(screen.getByTestId('theme')).toHaveTextContent('sepia');
    expect(document.documentElement.classList.contains('theme-sepia')).toBe(true);
  });

  it('applies custom HSL accent colors to root CSS properties and localStorage', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText('Set custom primary'));
    expect(screen.getByTestId('primary-accent')).toHaveTextContent('#1fa2ff');
    expect(document.documentElement.style.getPropertyValue('--accent-primary')).toBe('#1fa2ff');

    await user.click(screen.getByText('Reset accent'));
    expect(document.documentElement.style.getPropertyValue('--accent-primary')).not.toBe('#1fa2ff');
  });

  it('resolves "system" to dark when the OS prefers dark', () => {
    systemDark = true;
    renderProbe();
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('dynamically updates the resolved theme when the OS preference changes', () => {
    renderProbe();
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');

    setSystemDark(true);
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    setSystemDark(false);
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme back and forth with toggleTheme helper', async () => {
    const user = userEvent.setup();
    renderProbe();

    expect(screen.getByTestId('resolved')).toHaveTextContent('light');

    await user.click(screen.getByText('Toggle theme'));
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByText('Toggle theme'));
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

