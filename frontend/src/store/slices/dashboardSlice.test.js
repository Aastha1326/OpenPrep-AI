import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer, {
  reviewFlashcard,
  toggleTheme,
  setTheme,
} from './dashboardSlice';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// window.matchMedia mock for ThemeContext
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

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { dashboard: dashboardReducer },
    preloadedState: {
      dashboard: {
        stats: null,
        weeklyChartData: [],
        recentActivity: [],
        subjectBreakdown: [],
        activePlan: null,
        dueFlashcards: [
          { id: 'card-1', front: 'Q1', back: 'A1' },
          { id: 'card-2', front: 'Q2', back: 'A2' },
        ],
        loadingStats: false,
        loadingSubjects: false,
        loadingPlan: false,
        loadingFlashcards: false,
        errorStats: null,
        errorSubjects: null,
        errorPlan: null,
        errorFlashcards: null,
        ...preloadedState,
      },
    },
  });

describe('dashboardSlice - reviewFlashcard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('removes reviewed card from dueFlashcards on success', async () => {
    API.put.mockResolvedValueOnce({
      data: { data: { id: 'card-1', front: 'Q1', back: 'A1', interval: 1 } },
    });

    const store = createStore();
    await store.dispatch(reviewFlashcard({ cardId: 'card-1', quality: 4 }));

    const { dueFlashcards } = store.getState().dashboard;
    expect(dueFlashcards).toHaveLength(1);
    expect(dueFlashcards[0].id).toBe('card-2');
  });

  test('does not remove other cards when review fails', async () => {
    API.put.mockRejectedValueOnce({
      response: { data: { error: 'Flashcard not found' } },
    });

    const store = createStore();
    await store.dispatch(reviewFlashcard({ cardId: 'card-1', quality: 4 }));

    const { dueFlashcards } = store.getState().dashboard;
    expect(dueFlashcards).toHaveLength(2);
  });

  test('calls API.put with correct card ID and quality', async () => {
    API.put.mockResolvedValueOnce({
      data: { data: { id: 'card-1' } },
    });

    const store = createStore();
    await store.dispatch(reviewFlashcard({ cardId: 'card-1', quality: 3 }));

    expect(API.put).toHaveBeenCalledWith('/flashcards/card-1/review', { quality: 3 });
  });

  test('handles reviewing the last card in the queue', async () => {
    API.put.mockResolvedValueOnce({
      data: { data: { id: 'card-1' } },
    });

    const store = createStore({
      dueFlashcards: [{ id: 'card-1', front: 'Q1', back: 'A1' }],
    });
    await store.dispatch(reviewFlashcard({ cardId: 'card-1', quality: 5 }));

    const { dueFlashcards } = store.getState().dashboard;
    expect(dueFlashcards).toHaveLength(0);
  });
});

describe('dashboardSlice - theme persistence', () => {
  beforeEach(() => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
      }
    } catch (_e) {}
    vi.clearAllMocks();
  });

  test('toggles theme and updates localStorage openprep_theme', () => {
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    expect(store.getState().dashboard.theme).toBe('system');
    store.dispatch(toggleTheme());

    expect(store.getState().dashboard.theme).toBe('light');
    expect(localStorage.getItem('openprep_theme')).toBe('light');

    store.dispatch(toggleTheme());
    expect(store.getState().dashboard.theme).toBe('dark');
    expect(localStorage.getItem('openprep_theme')).toBe('dark');
    
    store.dispatch(toggleTheme());
    expect(store.getState().dashboard.theme).toBe('high-contrast');
    expect(localStorage.getItem('openprep_theme')).toBe('high-contrast');
  });

  test('sets theme explicitly and updates localStorage', () => {
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    store.dispatch(setTheme('light'));
    expect(store.getState().dashboard.theme).toBe('light');
    expect(localStorage.getItem('openprep_theme')).toBe('light');
  });
});

describe('dashboardSlice - layout management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('adds a new widget to layout and persists to localStorage', () => {
    const { addWidget } = require('./dashboardSlice');
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    const initialCount = store.getState().dashboard.layout.length;
    store.dispatch(addWidget({ id: 'readiness-widget', colSpan: 6 }));

    const updatedLayout = store.getState().dashboard.layout;
    expect(updatedLayout.length).toBe(initialCount + 1);
    expect(updatedLayout.some((w) => w.id === 'readiness-widget')).toBe(true);

    const savedLocalStorage = JSON.parse(localStorage.getItem('openprep_dashboard_layout'));
    expect(savedLocalStorage).toBeDefined();
    expect(savedLocalStorage.some((w) => w.id === 'readiness-widget')).toBe(true);
  });

  test('removes a widget from layout', () => {
    const { removeWidget } = require('./dashboardSlice');
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    store.dispatch(removeWidget('progress-chart'));

    const updatedLayout = store.getState().dashboard.layout;
    expect(updatedLayout.some((w) => w.id === 'progress-chart')).toBe(false);
  });

  test('resizes a widget colSpan in layout', () => {
    const { resizeWidget } = require('./dashboardSlice');
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    store.dispatch(resizeWidget({ id: 'progress-chart', colSpan: 12 }));

    const targetWidget = store.getState().dashboard.layout.find((w) => w.id === 'progress-chart');
    expect(targetWidget.colSpan).toBe(12);
  });

  test('resets layout to DEFAULT_LAYOUT', () => {
    const { resetDashboardLayout, removeWidget, DEFAULT_LAYOUT } = require('./dashboardSlice');
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    store.dispatch(removeWidget('progress-chart'));
    expect(store.getState().dashboard.layout.length).toBeLessThan(DEFAULT_LAYOUT.length);

    store.dispatch(resetDashboardLayout());
    expect(store.getState().dashboard.layout).toEqual(DEFAULT_LAYOUT);
  });
});


