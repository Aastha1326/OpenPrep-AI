import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CommunityDecks from './CommunityDecks';
import authReducer from '../store/slices/authSlice';
import API from '../services/api';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 'user-123', name: 'Test User' },
        token: 'token-123',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  });

describe('CommunityDecks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title and listings', async () => {
    const mockDecks = [
      {
        id: 'deck-1',
        name: 'Math Prep',
        description: 'Calculus fundamentals',
        ownerName: 'Alice',
        examName: 'AP Calculus',
        cloneCount: 5,
        rating: 4.5,
        ratingsCount: 2,
        tags: ['Math', 'Calculus'],
      },
    ];

    API.get.mockImplementation((url) => {
      if (url.includes('/community/decks')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockDecks,
            totalPages: 1,
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CommunityDecks />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Community Library')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Math Prep')).toBeInTheDocument();
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});

