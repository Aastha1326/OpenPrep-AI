import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PYQAnalytics from './PYQAnalytics';
import API from '../services/api';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: 'http://localhost/api' },
  },
}));

describe('PYQAnalytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title and empty state', async () => {
    const mockSubjects = [
      { id: 'subj-1', name: 'Organic Chemistry' },
    ];

    API.get.mockImplementation((url) => {
      if (url.includes('/academic/subjects')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSubjects,
          },
        });
      }
      if (url.includes('/pyqs/subject/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: [],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <MemoryRouter>
        <PYQAnalytics />
      </MemoryRouter>
    );

    expect(screen.getByText('PYQ Trend Analyzer')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No Past Papers Analyzed Yet')).toBeInTheDocument();
    });
  });
});

