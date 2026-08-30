import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeCustomizerDrawer from './ThemeCustomizerDrawer';
import { ThemeProvider } from '../context/ThemeContext';

describe('ThemeCustomizerDrawer Component', () => {
  beforeEach(() => {
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
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <ThemeProvider>
        <ThemeCustomizerDrawer isOpen={false} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.queryByText('Theme Customizer')).not.toBeInTheDocument();
  });

  it('renders drawer header and presets when isOpen is true', () => {
    render(
      <ThemeProvider>
        <ThemeCustomizerDrawer isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText('Theme Customizer')).toBeInTheDocument();
    expect(screen.getByText('Modern Glassmorphism')).toBeInTheDocument();
    expect(screen.getByText('Midnight AMOLED Dark')).toBeInTheDocument();
    expect(screen.getByText('Emerald Study')).toBeInTheDocument();
    expect(screen.getByText('Sunset Warm')).toBeInTheDocument();
    expect(screen.getByText('Sepia Reading')).toBeInTheDocument();
  });

  it('selects preset when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeCustomizerDrawer isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    const emeraldPresetBtn = screen.getByText('Emerald Study').closest('button');
    await user.click(emeraldPresetBtn);

    expect(document.documentElement.classList.contains('theme-emerald')).toBe(true);
  });

  it('triggers onClose when close or done button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ThemeProvider>
        <ThemeCustomizerDrawer isOpen={true} onClose={handleClose} />
      </ThemeProvider>
    );

    const doneBtn = screen.getByRole('button', { name: /Done/i });
    await user.click(doneBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
