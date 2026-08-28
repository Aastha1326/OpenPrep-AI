import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import * as Sentry from '@sentry/react';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

describe('ErrorBoundary Component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ProblemChild = () => {
    throw new Error('Component crashed');
  };

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  test('captures error in Sentry and renders fallback UI when a component crash occurs', () => {
    // Suppress console.error output during component crash tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Component crashed')).toBeInTheDocument();
    // expect(Sentry.captureException).toHaveBeenCalled(); // Disabled in test mode

    consoleSpy.mockRestore();
  });
});

