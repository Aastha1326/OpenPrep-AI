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
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set light</button>
      <button onClick={() => setTheme('dark')}>Set dark</button>
      <button onClick={() => setTheme('high-contrast')}>Set high-contrast</button>
      <button onClick={() => setTheme('system')}>Set system</button>
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
    localStorage.clear();
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
    localStorage.setItem('openprep_theme', 'neon');
    renderProbe();
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('switches theme, persists it, and syncs the DOM root class', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText('Set dark'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorage.getItem('openprep_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByText('Set high-contrast'));
    expect(screen.getByTestId('theme')).toHaveTextContent('high-contrast');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByText('Set light'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
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

  it('ignores OS preference changes when a fixed theme is selected', async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByText('Set dark'));

    setSystemDark(false);
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
