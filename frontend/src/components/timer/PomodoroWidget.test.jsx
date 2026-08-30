import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PomodoroProvider } from '../../context/PomodoroContext';
import PomodoroWidget from './PomodoroWidget';

// Mock the audio utility
vi.mock('../../utils/audio', () => ({
  playTimerCompleteSound: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api.js', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: {} }) },
}));

// Mock AmbientAudioPlayer to avoid jsdom audio element issues
vi.mock('./AmbientAudioPlayer', () => ({
  default: function MockAmbientAudioPlayer() {
    return <div data-testid="ambient-audio-player" />;
  },
}));

const wrapper = ({ children }) => <PomodoroProvider>{children}</PomodoroProvider>;

describe('PomodoroWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the timer display', () => {
    render(<PomodoroWidget />, { wrapper });
    expect(screen.getByText('25:00')).toBeInTheDocument();
    // The mode label appears as a small uppercase label — query the specific one
    const focusLabels = screen.getAllByText('Focus');
    expect(focusLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Start button when paused', () => {
    render(<PomodoroWidget />, { wrapper });
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
  });

  it('renders Reset button', () => {
    render(<PomodoroWidget />, { wrapper });
    expect(screen.getByRole('button', { name: /reset timer/i })).toBeInTheDocument();
  });

  it('renders Settings button', () => {
    render(<PomodoroWidget />, { wrapper });
    expect(screen.getByRole('button', { name: /timer settings/i })).toBeInTheDocument();
  });

  it('renders Minimize button', () => {
    render(<PomodoroWidget />, { wrapper });
    expect(screen.getByRole('button', { name: /minimize timer/i })).toBeInTheDocument();
  });

  it('shows cycle indicators', () => {
    render(<PomodoroWidget />, { wrapper });
    // 4 cycles (default) → 4 dots
    const dots = screen.getAllByLabelText(/cycle/i);
    expect(dots).toHaveLength(4);
  });

  it('toggles collapsed mode', () => {
    render(<PomodoroWidget />, { wrapper });

    // Click minimize
    fireEvent.click(screen.getByRole('button', { name: /minimize timer/i }));
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand pomodoro timer/i })).toBeInTheDocument();

    // Click expand
    fireEvent.click(screen.getByRole('button', { name: /expand pomodoro timer/i }));
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
  });

  it('shows Pause button when timer is running', () => {
    render(<PomodoroWidget />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
  });

  it('opens settings modal', () => {
    render(<PomodoroWidget />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /timer settings/i }));
    expect(screen.getByRole('dialog', { name: /timer settings/i })).toBeInTheDocument();
  });
});

