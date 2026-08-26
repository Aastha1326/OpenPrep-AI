import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { AdminAnalytics } from './AdminAnalytics';
import * as api from '../services/api';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Recharts ResponsiveContainer to render children cleanly in test env
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  };
});

function renderWithStore(component) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: { user: { id: 'admin-1', role: 'admin', name: 'Admin User' }, isAuthenticated: true },
    },
  });

  return render(<Provider store={store}>{component}</Provider>);
}

describe('AdminAnalytics Component Page', () => {
  const mockAnalyticsData = {
    data: {
      success: true,
      data: {
        activeUsers: {
          totalUsers: 150,
          dau: 30,
          wau: 90,
          mau: 140,
          roleDistribution: { students: 130, contributors: 15, admins: 5 },
        },
        interviewMetrics: {
          totalInterviews: 60,
          completedInterviews: 52,
          interviewSuccessRate: 86,
          avgInterviewScore: 83.5,
          scoreDistribution: { '<50%': 2, '50-70%': 8, '70-85%': 25, '85-100%': 25 },
        },
        quizMetrics: {
          totalQuizAttempts: 350,
          quizCompletionPct: 93,
          avgQuizScore: 79.5,
          difficultyBreakdown: [
            { difficulty: 'Easy', attempts: 150, avgScore: 86 },
            { difficulty: 'Medium', attempts: 150, avgScore: 78 },
            { difficulty: 'Hard', attempts: 50, avgScore: 68 },
          ],
        },
        systemHealth: {
          status: 'healthy',
          uptimeSeconds: 100000,
          dbStatus: 'connected',
          redisStatus: 'online',
          heapUsedMB: 190,
          heapTotalMB: 320,
          avgLatencyMs: 32,
          errorRatePct: 0.04,
        },
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    api.default.get.mockResolvedValue(mockAnalyticsData);
  });

  test('renders page title and system health cards', async () => {
    renderWithStore(<AdminAnalytics />);

    expect(await screen.findByText('Admin Usage Analytics')).toBeInTheDocument();
    expect(await screen.findByText('System Vitals')).toBeInTheDocument();
    expect(await screen.findByText('API Performance')).toBeInTheDocument();
  });

  test('renders active user and interview success rate charts', async () => {
    renderWithStore(<AdminAnalytics />);

    expect(await screen.findByText('Active User Dynamics (DAU vs WAU)')).toBeInTheDocument();
    expect(await screen.findByText('Interview Success & Score Spread')).toBeInTheDocument();
    expect(await screen.findByText('Quiz Performance & Difficulty')).toBeInTheDocument();
  });
});

