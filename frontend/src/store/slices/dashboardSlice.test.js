import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer, {
  reviewFlashcard,
  fetchDueFlashcards,
} from './dashboardSlice';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

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
