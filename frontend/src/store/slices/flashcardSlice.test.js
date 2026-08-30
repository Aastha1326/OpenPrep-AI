import { configureStore } from '@reduxjs/toolkit';
import flashcardReducer, {
  fetchFlashcards,
  createFlashcard,
  deleteFlashcard,
} from './flashcardSlice';
import API from '../../services/api.js';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { flashcards: flashcardReducer },
    preloadedState: {
      flashcards: {
        flashcards: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
        loading: false,
        error: null,
        ...preloadedState,
      },
    },
  });

describe('flashcardSlice thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetchFlashcards success', async () => {
    const mockData = {
      flashcards: [{ id: 'card-1', front: 'Q1', back: 'A1' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    API.get.mockResolvedValueOnce({ data: mockData });

    const store = createStore();
    await store.dispatch(fetchFlashcards({ page: 1, limit: 20 }));

    const state = store.getState().flashcards;
    expect(state.flashcards).toHaveLength(1);
    expect(state.pagination.total).toBe(1);
    expect(API.get).toHaveBeenCalledWith('/flashcards', { params: { page: 1, limit: 20 } });
  });

  test('createFlashcard success', async () => {
    const newCard = { id: 'card-2', front: 'Q2', back: 'A2' };
    API.post.mockResolvedValueOnce({ data: { data: newCard } });

    const store = createStore();
    await store.dispatch(createFlashcard({ front: 'Q2', back: 'A2' }));

    const state = store.getState().flashcards;
    expect(state.flashcards).toHaveLength(1);
    expect(state.flashcards[0].id).toBe('card-2');
    expect(state.pagination.total).toBe(1);
  });

  test('deleteFlashcard success', async () => {
    API.delete.mockResolvedValueOnce({});
    const store = createStore({
      flashcards: [{ id: 'card-1', front: 'Q1', back: 'A1' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    await store.dispatch(deleteFlashcard('card-1'));

    const state = store.getState().flashcards;
    expect(state.flashcards).toHaveLength(0);
    expect(state.pagination.total).toBe(0);
  });
});

