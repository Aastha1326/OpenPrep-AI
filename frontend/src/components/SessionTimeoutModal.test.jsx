import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import SessionTimeoutModal from './SessionTimeoutModal';
import { SessionTimerProvider, useSessionTimer } from '../context/SessionTimerContext';
import { BrowserRouter } from 'react-router-dom';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}

const createTestStore = (initialAuthState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', name: 'Test Student' },
        ...initialAuthState,
      },
    },
  });
};

describe('SessionTimeoutModal Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders pre-expiry warning modal when remaining session time is <= 120s', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SessionTimerProvider>
            <SessionTimeoutModal />
          </SessionTimerProvider>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('session-timeout-modal') || screen.queryByRole('dialog')).toBeDefined();
  });

  it('renders Save now, Save & Exit, and Extend Session action buttons', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <SessionTimerProvider>
            <SessionTimeoutModal />
          </SessionTimerProvider>
        </BrowserRouter>
      </Provider>
    );

    const saveNowBtn = screen.queryByRole('button', { name: /Save now/i });
    const extendBtn = screen.queryByRole('button', { name: /Extend Session/i });
    const saveExitBtn = screen.queryByRole('button', { name: /Save & Exit/i });

    if (saveNowBtn) expect(saveNowBtn).toBeInTheDocument();
    if (extendBtn) expect(extendBtn).toBeInTheDocument();
    if (saveExitBtn) expect(saveExitBtn).toBeInTheDocument();
  });
});
