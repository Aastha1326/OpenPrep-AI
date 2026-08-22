import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PomodoroProvider } from '../../context/PomodoroContext';
import TimerSettingsModal from './TimerSettingsModal';

const wrapper = ({ children }) => <PomodoroProvider>{children}</PomodoroProvider>;

describe('TimerSettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders when open', () => {
    render(<TimerSettingsModal {...defaultProps} />, { wrapper });
    expect(screen.getByText('Timer Settings')).toBeInTheDocument();
    expect(screen.getByText('Focus Duration')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
    expect(screen.getByText('Long Break')).toBeInTheDocument();
    expect(screen.getByText('Cycles Before Long Break')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TimerSettingsModal {...defaultProps} isOpen={false} />, { wrapper });
    expect(screen.queryByText('Timer Settings')).not.toBeInTheDocument();
  });

  it('shows current settings values', () => {
    render(<TimerSettingsModal {...defaultProps} />, { wrapper });
    expect(screen.getByText('25m')).toBeInTheDocument(); // workDuration
    expect(screen.getByText('5m')).toBeInTheDocument();  // shortBreakDuration
    expect(screen.getByText('15m')).toBeInTheDocument(); // longBreakDuration
    expect(screen.getByText('4')).toBeInTheDocument();   // cyclesBeforeLongBreak
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<TimerSettingsModal {...defaultProps} onClose={onClose} />, { wrapper });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Save is clicked', () => {
    const onClose = vi.fn();
    render(<TimerSettingsModal {...defaultProps} onClose={onClose} />, { wrapper });
    fireEvent.click(screen.getByText('Save Settings'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<TimerSettingsModal {...defaultProps} onClose={onClose} />, { wrapper });
    // Click the backdrop (the overlay div)
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});
