import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import SessionTimeoutModal from './SessionTimeoutModal';
import { BrowserRouter } from 'react-router-dom';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}

const createMockJwt = (expInSecondsFromNow) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expInSecondsFromNow;
  const payload = btoa(JSON.stringify({ id: 'user-123', exp }));
  return `${header}.${payload}.signature`;
};

const createTestStore = (initialAuthState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        token: createMockJwt(3600),
        refreshToken: 'mock-refresh-token',
        user: { id: '1', name: 'Test Student' },
        ...initialAuthState,
      },
    },
  });
};

const renderComponent = (store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <SessionTimeoutModal />
      </BrowserRouter>
    </Provider>
  );
};

describe('SessionTimeoutModal Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('does not render warning modal when token validity is over 2 minutes (120s)', () => {
    const freshToken = createMockJwt(600);
    const store = createTestStore({ token: freshToken });
    window.localStorage.setItem('token', freshToken);

    renderComponent(store);

    expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
  });

  it('renders pre-expiry warning modal with formatted countdown when token has <= 120s remaining', () => {
    const nearExpiryToken = createMockJwt(90); // 90 seconds remaining (~01:30)
    const store = createTestStore({ token: nearExpiryToken });
    window.localStorage.setItem('token', nearExpiryToken);

    renderComponent(store);

    expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText(/01:(29|30)/)).toBeInTheDocument();
  });

  it('formats remaining time countdown as MM:SS', () => {
    const nearExpiryToken = createMockJwt(45); // 45 seconds (~00:45)
    const store = createTestStore({ token: nearExpiryToken });
    window.localStorage.setItem('token', nearExpiryToken);

    renderComponent(store);

    expect(screen.getByText(/00:(44|45)/)).toBeInTheDocument();
  });

  it('renders Log Out Now and Extend Session action buttons', () => {
    const nearExpiryToken = createMockJwt(60);
    const store = createTestStore({ token: nearExpiryToken });
    window.localStorage.setItem('token', nearExpiryToken);

    renderComponent(store);

    expect(screen.getByRole('button', { name: /Log Out Now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extend Session/i })).toBeInTheDocument();
  });
});
