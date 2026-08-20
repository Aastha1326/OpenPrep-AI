import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AdminDashboard from './AdminDashboard';
import API from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock recharts because SVG charting renders can fail or complicate jsdom test setups
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    AreaChart: ({ children }) => <div>{children}</div>,
  };
});

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 'admin-1', name: 'Super Admin', role: 'admin' } }) => state,
    },
  });

describe('AdminDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches stats and user directory lists correctly', async () => {
    API.get.mockImplementation((url) => {
      if (url.includes('/admin/stats')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              totalUsers: 150,
              dau: 12,
              totalQuizzes: 450,
              totalFlashcards: 800,
              aiRequestsToday: 30,
            },
          },
        });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          data: {
            success: true,
            page: 1,
            limit: 10,
            totalPages: 1,
            data: [
              { id: 'user-1', name: 'Jack Student', email: 'jack@gmail.com', role: 'student', createdAt: new Date() },
              { id: 'user-2', name: 'Jill Contributor', email: 'jill@gmail.com', role: 'contributor', createdAt: new Date() },
            ],
          },
        });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </Provider>
    );

    // Verify MetricCard renders values
    expect(await screen.findByText('150')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();

    // Verify User directory listing
    expect(screen.getByText('Jack Student')).toBeInTheDocument();
    expect(screen.getByText('Jill Contributor')).toBeInTheDocument();
  });

  test('handles user role promotions successfully', async () => {
    API.get.mockImplementation((url) => {
      if (url.includes('/admin/stats')) {
        return Promise.resolve({ data: { success: true, data: {} } });
      }
      if (url.includes('/admin/users')) {
        return Promise.resolve({
          data: {
            success: true,
            page: 1,
            limit: 10,
            totalPages: 1,
            data: [
              { id: 'user-1', name: 'Jack Student', email: 'jack@gmail.com', role: 'student', createdAt: new Date() },
            ],
          },
        });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    API.put.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Promoted successfully',
        data: { id: 'user-1', role: 'contributor' },
      },
    });

    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </Provider>
    );

    const promoteButton = await screen.findByTitle('Promote to Contributor');
    fireEvent.click(promoteButton);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/admin/users/user-1/role', { role: 'contributor' });
      expect(alertSpy).toHaveBeenCalledWith('Promoted successfully');
    });

    alertSpy.mockRestore();
  });
});
