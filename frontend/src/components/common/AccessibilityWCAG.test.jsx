import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import App from '../../App';
import MobileNavDrawer from '../MobileNavDrawer';
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

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        token: null,
        user: null,
      },
    },
  });
};

describe('WCAG 2.1 AA Accessibility Features', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders skip-to-main-content landmark link targeting #main-content', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('wraps main views inside main landmark element with id="main-content" and role="main"', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    const mainElement = container.querySelector('main#main-content');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveAttribute('role', 'main');
  });

  it('renders mobile navigation toggle button with accessible aria-label', () => {
    render(
      <BrowserRouter>
        <MobileNavDrawer />
      </BrowserRouter>
    );

    const menuButton = screen.getByRole('button', { name: /Open menu/i });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('dismisses mobile nav drawer when Escape key is pressed', () => {
    render(
      <BrowserRouter>
        <MobileNavDrawer />
      </BrowserRouter>
    );

    const menuButton = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: /Close menu/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(screen.getByRole('button', { name: /Open menu/i })).toBeInTheDocument();
  });
});
