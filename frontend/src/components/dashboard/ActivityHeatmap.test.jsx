import { render, screen, fireEvent } from '@testing-library/react';
import ActivityHeatmap from './ActivityHeatmap';
import API from '../../services/api';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

const todayStr = new Date().toISOString().split('T')[0];

const heatmapData = {
  success: true,
  data: [
    {
      date: todayStr,
      questionsSolved: 14,
      flashcardsReviewed: 2,
      total: 16,
    },
    {
      date: '2026-08-06',
      questionsSolved: 0,
      flashcardsReviewed: 0,
      total: 0,
    },
  ],
};

// API.get resolves to the axios response object, whose `.data` is the payload
const apiResponse = { data: heatmapData };

describe('ActivityHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders title, legend, and 365 day cells', async () => {
    API.get.mockResolvedValueOnce(apiResponse);

    render(<ActivityHeatmap />);

    expect(await screen.findByText('Study Activity')).toBeInTheDocument();
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();

    // 365 cells + up to 6 leading spacer cells (spacers are aria-hidden via opacity-0)
    const cells = document.querySelectorAll('[class*="cursor-help"]');
    expect(cells.length).toBe(365);
  });

  test('shows tooltip with activity details on hover', async () => {
    API.get.mockResolvedValueOnce(apiResponse);

    render(<ActivityHeatmap />);

    await screen.findByText('Study Activity');

    const cells = document.querySelectorAll('[class*="cursor-help"]');
    // Last cell is today (365th day)
    fireEvent.mouseEnter(cells[364]);

    expect(
      await screen.findByText(/14 questions solved, 2 flashcard decks reviewed/i)
    ).toBeInTheDocument();
  });

  test('shows "No activity" tooltip for empty days', async () => {
    API.get.mockResolvedValueOnce(apiResponse);

    render(<ActivityHeatmap />);

    await screen.findByText('Study Activity');

    const cells = document.querySelectorAll('[class*="cursor-help"]');
    // First cell is the oldest day (no activity in mock data)
    fireEvent.mouseEnter(cells[0]);

    expect(await screen.findByText('No activity')).toBeInTheDocument();
  });

  test('renders error state on API failure', async () => {
    API.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<ActivityHeatmap />);

    expect(await screen.findByText('Failed to load activity heatmap')).toBeInTheDocument();
  });
});
