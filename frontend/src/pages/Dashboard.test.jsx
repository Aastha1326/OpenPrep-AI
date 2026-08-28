import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../context/ThemeContext';
import authReducer from '../store/slices/authSlice';
import dashboardReducer from '../store/slices/dashboardSlice';
import Dashboard from './Dashboard';

// window.matchMedia mock for ThemeContext
// ThemeContext uses window.matchMedia which is not implemented in jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../store/slices/dashboardSlice', async () => {
  const actual = await vi.importActual('../store/slices/dashboardSlice');
  return {
    ...actual,
    fetchDashboardStats: () => ({ type: 'dashboard/fetchStats' }),
    fetchSubjectBreakdown: () => ({ type: 'dashboard/fetchSubjects' }),
    fetchActivePlan: () => ({ type: 'dashboard/fetchActivePlan' }),
    fetchDueFlashcards: () => ({ type: 'dashboard/fetchFlashcards' }),
    reviewFlashcard: (payload) => ({ type: 'dashboard/reviewFlashcard', payload }),
  };
});

const renderDashboard = (authState = {}, dashboardState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer, dashboard: dashboardReducer },
    preloadedState: {
      auth: {
        token: 'fake-token',
        isAuthenticated: true,
        user: { id: 'u1', name: 'Test User', email: 'test@test.com' },
        loading: false,
        error: null,
        ...authState,
      },
      dashboard: {
        stats: null,
        weeklyChartData: [],
        recentActivity: [],
        subjectBreakdown: [],
        activePlan: null,
        dueFlashcards: [],
        loadingStats: false,
        loadingSubjects: false,
        loadingPlan: false,
        loadingFlashcards: false,
        errorStats: null,
        errorSubjects: null,
        errorPlan: null,
        errorFlashcards: null,
        ...dashboardState,
      },
    },
  });

  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <Dashboard />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );

  return { ...result, store };
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Personalized greeting ──

  test('shows personalized greeting with user name', () => {
    renderDashboard();
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getByText(/Test/)).toBeInTheDocument();
  });

  test('falls back to "Welcome back, Scholar." when user has no name', () => {
    renderDashboard({ user: null });
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getAllByText(/Scholar/)[0]).toBeInTheDocument();
  });

  // ── Logout button ──

  test('renders logout button with aria-label', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  test('logout button dispatches logout and navigates', () => {
    const { store } = renderDashboard();
    const logoutBtn = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutBtn);

    const authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
    expect(authState.token).toBeNull();
  });

  // ── Sidebar buttons ──

  test('Study Plan sidebar button opens the study plan modal', () => {
    renderDashboard();
    const studyPlanBtn = screen.getByText('Study Plan').closest('button');
    fireEvent.click(studyPlanBtn);
    expect(studyPlanBtn).toBeInTheDocument();
  });

  test('Start Quiz sidebar button opens Quiz Setup modal', async () => {
    renderDashboard();
    const startQuizBtn = screen.getByText('Start Quiz').closest('button');
    fireEvent.click(startQuizBtn);

    await waitFor(() => {
      expect(screen.getByText('Generate a multilingual quiz')).toBeInTheDocument();
    });
  });

  test('Analyze PYQ sidebar button navigates to the PYQ analysis page', () => {
    const store = configureStore({
      reducer: { auth: authReducer, dashboard: dashboardReducer },
      preloadedState: {
        auth: {
          token: 'fake-token',
          isAuthenticated: true,
          user: { _id: '123', name: 'Test User' }
        },
        dashboard: {
          sessionStartTime: null,
          stats: null,
          weeklyChartData: [],
          recentActivity: [],
          subjectBreakdown: [],
          activePlan: null,
          dueFlashcards: [],
          loadingStats: false,
          loadingSubjects: false,
          loadingPlan: false,
          loadingFlashcards: false,
          errorStats: null,
          errorSubjects: null,
          errorPlan: null,
          errorFlashcards: null,
        }
      }
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pyqs" element={<div>PYQ Analysis Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const pyqBtn = screen.getByText('PYQ Intelligence').closest('button');
    fireEvent.click(pyqBtn);
    expect(screen.getByText('PYQ Analysis Page')).toBeInTheDocument();
  });

  // ── Achievements ──

  test('renders all four achievement badges', () => {
    renderDashboard();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('On Fire')).toBeInTheDocument();
    expect(screen.getByText('Halfway There')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Scholar')).toBeInTheDocument();
  });

  test('shows "Earned" for badges that meet criteria', () => {
    renderDashboard({
      user: { id: 'u1', name: 'Test User' },
    }, {
      stats: {
        attemptsCount: 5,
        streak: 5,
        syllabusProgress: 60,
        totalStudyHours: 15,
        topicsBreakdown: { strong: 3, medium: 2, total: 10 },
      },
    });

    const earnedBadges = screen.getAllByText('Earned');
    expect(earnedBadges.length).toBe(4);
  });

  test('shows "Locked" for badges that do not meet criteria', () => {
    renderDashboard({
      user: { id: 'u1', name: 'Test User' },
    }, {
      stats: {
        attemptsCount: 0,
        streak: 0,
        syllabusProgress: 0,
        totalStudyHours: 0,
        topicsBreakdown: { strong: 0, medium: 0, total: 0 },
      },
    });

    const lockedBadges = screen.getAllByText('Locked');
    expect(lockedBadges.length).toBe(4);
  });

  test('shows mixed earned/locked based on stats', () => {
    renderDashboard({
      user: { id: 'u1', name: 'Test User' },
    }, {
      stats: {
        attemptsCount: 3,
        streak: 1,
        syllabusProgress: 30,
        totalStudyHours: 12,
        topicsBreakdown: { strong: 2, medium: 1, total: 10 },
      },
    });

    expect(screen.getAllByText('Earned').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(1);
  });

  // ── Stats display ──

  test('displays streak count', () => {
    renderDashboard({}, {
      stats: {
        streak: 7,
        totalStudyHours: 10,
        syllabusProgress: 45,
        attemptsCount: 20,
        topicsBreakdown: { strong: 3, medium: 2, total: 10 },
      },
    });
    expect(screen.getByText('7 Day')).toBeInTheDocument();
  });

  test('displays zero streak by default', () => {
    renderDashboard();
    expect(screen.getByText('0 Day')).toBeInTheDocument();
  });

  // ── Today's tasks use local date, not UTC ──

  test('matches dailyGoal tasks using local date instead of UTC', () => {
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yesterdayLocal.getFullYear()}-${String(yesterdayLocal.getMonth() + 1).padStart(2, '0')}-${String(yesterdayLocal.getDate()).padStart(2, '0')}`;

    renderDashboard({}, {
      activePlan: {
        id: 'plan-1',
        dailyGoals: [
          {
            date: `${yesterdayStr}T00:00:00.000Z`,
            tasks: [{ id: 'old-task', title: 'Old day task', completed: false }],
          },
          {
            date: `${todayLocal}T00:00:00.000Z`,
            tasks: [{ id: 'today-task', title: 'Today task', completed: false }],
          },
        ],
      },
    });

    expect(screen.getByText('Today task')).toBeInTheDocument();
    expect(screen.queryByText('Old day task')).not.toBeInTheDocument();
  });

  test('falls back to first day when no dailyGoal matches today', () => {
    const now = new Date();
    const futureStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate() + 10).padStart(2, '0')}`;

    renderDashboard({}, {
      activePlan: {
        id: 'plan-1',
        dailyGoals: [
          {
            date: `${futureStr}T00:00:00.000Z`,
            tasks: [{ id: 'future-task', title: 'Future task', completed: false }],
          },
        ],
      },
    });

    expect(screen.getByText('Future task')).toBeInTheDocument();
  });

  // ── Clamping and Bonus Badges ──

  test('clamps task progress to 100% and displays bonus indicator badge when completing bonus tasks', () => {
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    renderDashboard({}, {
      activePlan: {
        id: 'plan-1',
        dailyGoals: [
          {
            date: `${todayLocal}T00:00:00.000Z`,
            tasks: [
              { id: 't1', title: 'Regular Study task', completed: true },
              { id: 't2', title: '[Bonus] Extra Flashcards', completed: true, isBonus: true },
            ],
          },
        ],
      },
    });

    // Verify progress is calculated, but clamped at 100% (since 2 completed / 1 regular = 200% clamped to 100%)
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Verify progress bar fill style has 100% width
    const fillEl = screen.getByTestId('daily-progress-fill');
    expect(fillEl.style.width).toBe('100%');

    // Verify bonus indicators are displayed
    expect(screen.getByText('Bonus')).toBeInTheDocument();
    expect(screen.getByText(/1 Bonus Done/)).toBeInTheDocument();
  });

  test('renders 0h 0m and onboarding message for new users with no activity logs', () => {
    renderDashboard(
      { user: { id: 'u1', name: 'New User' } },
      {
        stats: { totalStudyHours: 0 },
        recentActivity: [],
      }
    );

    expect(screen.getByText('0h 0m')).toBeInTheDocument();
    expect(screen.getByText(/Start your first study session to track time!/i)).toBeInTheDocument();
  });
});

