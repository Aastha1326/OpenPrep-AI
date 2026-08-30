import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Flashcards from './Flashcards';
import flashcardReducer from '../store/slices/flashcardSlice';
import API from '../services/api';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

const createStore = (preloadedState = {}) =>
  configureStore({
    reducer: { flashcards: flashcardReducer },
    preloadedState: {
      flashcards: {
        flashcards: [{ id: 'card-1', front: 'Q1', back: 'A1', subject: { name: 'Physics' } }],
        pagination: {
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
        },
        loading: false,
        error: null,
        ...preloadedState,
      },
    },
  });

describe('Flashcards page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title and headers', async () => {
    const mockCards = [{ id: 'card-1', front: 'Q1', back: 'A1', subject: { name: 'Physics' } }];
    API.get.mockImplementation((url) => {
      if (url.includes('/academic/subjects')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/academic/topics')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/flashcard-decks')) {
        return Promise.resolve({ data: { data: [{ id: 'deck-1', name: 'Science Chemistry', cardCount: 2 }] } });
      }
      if (url.includes('/flashcards')) {
        return Promise.resolve({
          data: {
            flashcards: mockCards,
            pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Flashcards />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Study Flashcards')).toBeInTheDocument();
    expect(await screen.findByText('Science Chemistry')).toBeInTheDocument();
  });
});

