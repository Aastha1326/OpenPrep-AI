import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';
import { CONNECTIVITY_EVENT } from '../../services/api';

const emit = (online) => {
  act(() => {
    window.dispatchEvent(new CustomEvent(CONNECTIVITY_EVENT, { detail: { online } }));
  });
};

describe('OfflineBanner', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders nothing while the connection is healthy', () => {
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  test('shows an offline message when connectivity drops', () => {
    render(<OfflineBanner />);

    emit(false);

    const banner = screen.getByTestId('offline-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/offline/i);
    // Explains the automatic retry, so the user doesn't re-submit by hand.
    expect(banner).toHaveTextContent(/retried automatically/i);
  });

  test('announces politely rather than interrupting the screen reader', () => {
    render(<OfflineBanner />);
    emit(false);

    const banner = screen.getByTestId('offline-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  test('confirms recovery, then hides itself', () => {
    vi.useFakeTimers();
    render(<OfflineBanner />);

    emit(false);
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline/i);

    emit(true);
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/back online/i);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  test('does not flash a recovery message when the connection never dropped', () => {
    render(<OfflineBanner />);

    emit(true);

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  test('stops listening once unmounted', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<OfflineBanner />);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(CONNECTIVITY_EVENT, expect.any(Function));
    removeSpy.mockRestore();
  });
});
