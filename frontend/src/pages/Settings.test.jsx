import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import Settings from './Settings';
import API from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { user: {} } })),
    patch: vi.fn(),
  },
}));

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

const renderSettings = (userOverides = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { id: 'u1', name: 'Test Student', leaderboardVisible: true, ...userOverides },
        token: 'fake-token',
        loading: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Settings page with default leaderboard setting as Public', () => {
    renderSettings({ leaderboardVisible: true });

    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByText('Public Leaderboard Name')).toBeInTheDocument();
    const toggleBtn = screen.getByRole('switch');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
  });

  test('toggles leaderboard privacy and calls PATCH /auth/settings', async () => {
    API.patch.mockResolvedValueOnce({ data: { success: true } });
    API.get.mockResolvedValueOnce({ data: { user: { id: 'u1', leaderboardVisible: false } } });

    renderSettings({ leaderboardVisible: true });

    const toggleBtn = screen.getByRole('switch');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(API.patch).toHaveBeenCalledWith('/auth/settings', { leaderboardVisible: false });
    });

    expect(await screen.findByText('Preferences saved successfully.')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Student')).toBeInTheDocument();
  });

  test('shows error message if setting update fails', async () => {
    API.patch.mockRejectedValueOnce({
      response: { data: { error: 'Failed to save settings' } },
    });

    renderSettings({ leaderboardVisible: true });

    const toggleBtn = screen.getByRole('switch');
    fireEvent.click(toggleBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save settings');
  });
});
