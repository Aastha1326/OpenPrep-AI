import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../../store/slices/dashboardSlice';
import Dashboard from '../Dashboard';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: { layout: null } } })),
    post: vi.fn(() => Promise.resolve({ data: { data: { layout: [] } } })),
  },
}));

// ResizeObserver mock
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const renderCustomizableDashboard = (initialState = {}) => {
  const store = configureStore({
    reducer: { dashboard: dashboardReducer },
    preloadedState: {
      dashboard: {
        theme: 'light',
        layout: [
          { id: 'quick-start', colSpan: 12, order: 0 },
          { id: 'progress-chart', colSpan: 6, order: 1 },
          { id: 'recent-tests', colSpan: 6, order: 2 },
        ],
        isCustomizing: false,
        stats: null,
        weeklyChartData: [],
        recentActivity: [],
        ...initialState,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>
  );
};

describe('Customizable Dashboard Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('renders default starter widgets properly', () => {
    renderCustomizableDashboard();
    expect(screen.getByText('Quick Actions & Launcher')).toBeInTheDocument();
    expect(screen.getByText('Study Progress & Activity')).toBeInTheDocument();
    expect(screen.getByText('Recent Tests & Practice')).toBeInTheDocument();
  });

  test('toggles customize dashboard mode on button click', () => {
    renderCustomizableDashboard();

    const customizeBtn = screen.getByRole('button', { name: /customize dashboard/i });
    expect(customizeBtn).toBeInTheDocument();

    fireEvent.click(customizeBtn);

    expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save & done/i })).toBeInTheDocument();
  });

  test('opens Add Widget modal in customize mode', () => {
    renderCustomizableDashboard({ isCustomizing: true });

    const addBtn = screen.getByRole('button', { name: /add widget/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add Dashboard Widgets')).toBeInTheDocument();
  });
});
