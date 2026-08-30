import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  }
});

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../../store/slices/dashboardSlice';
import authReducer from '../../store/slices/authSlice';
import InteractiveDashboard from './InteractiveDashboard';

// Mock Recharts ResponsiveContainer to render children cleanly in test env
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

const createTestStore = (analyticsData = null) => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
      auth: authReducer,
    },
    preloadedState: {
      dashboard: {
        interactiveAnalytics: analyticsData || {
          totalQuizzes: 15,
          averageScore: 84,
          totalTimeSpentMinutes: 320,
          difficultyScore: 1120,
          scoreTrend: [
            { date: 'Mon', score: 70, difficulty: 'Easy' },
            { date: 'Tue', score: 85, difficulty: 'Medium' },
          ],
          weeklyActivity: [
            { day: 'Mon', quizzesCompleted: 3, minutesSpent: 45 },
          ],
          subjectMastery: [
            { subject: 'Data Structures', masteryPercentage: 88, color: '#f59e0b' },
          ],
          difficultyDistribution: [
            { level: 'Easy', count: 4, percentage: 25 },
            { level: 'Medium', count: 8, percentage: 50 },
            { level: 'Hard', count: 4, percentage: 25 },
          ],
        },
        loadingAnalytics: false,
        errorAnalytics: null,
      },
    },
  });
};

describe('InteractiveDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interactive progress dashboard with KPI cards', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InteractiveDashboard />
      </Provider>
    );

    expect(screen.getByTestId('interactive-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Learning Journey & Performance')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // totalQuizzes
    expect(screen.getByText('84%')).toBeInTheDocument(); // averageScore
    expect(screen.getByText('320m')).toBeInTheDocument(); // totalTimeSpentMinutes
    expect(screen.getByText('1120 ELO')).toBeInTheDocument();
  });

  it('renders score trend and weekly activity chart containers', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InteractiveDashboard />
      </Provider>
    );

    expect(screen.getByText('Score Progression Trend')).toBeInTheDocument();
    expect(screen.getByText('Weekly Study Activity')).toBeInTheDocument();
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders subject mastery radial gauge and difficulty level breakdown', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InteractiveDashboard />
      </Provider>
    );

    expect(screen.getByText('Subject Mastery Radial Indicators')).toBeInTheDocument();
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level Breakdown')).toBeInTheDocument();
  });
});
