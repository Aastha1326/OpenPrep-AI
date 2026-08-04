import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LeaderboardWidget from './LeaderboardWidget';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('LeaderboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders top entries when API returns leaderboard data', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          weekStart: '2026-08-03T00:00:00.000Z',
          weekEnd: '2026-08-09T23:59:59.999Z',
          entries: [
            {
              userId: 'u1',
              name: 'Alice Scholar',
              rank: 1,
              weeklyHours: 10,
              quizzesCompleted: 2,
              flashcardsReviewed: 5,
              score: 16.5,
            },
            {
              userId: 'u2',
              name: 'Anonymous Student #4567',
              rank: 2,
              weeklyHours: 5,
              quizzesCompleted: 1,
              flashcardsReviewed: 0,
              score: 7,
            },
          ],
          currentUser: { userId: 'u1', rank: 1, score: 16.5 },
          totalParticipants: 2,
        },
      },
    });

    render(<LeaderboardWidget />);

    expect(await screen.findByText('Alice Scholar')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Student #4567')).toBeInTheDocument();
    expect(screen.getByText('16.5')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('(you)')).toBeInTheDocument();
    expect(screen.getByText(/2 students participated this week/i)).toBeInTheDocument();
  });

  test('renders empty state when there is no activity', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          weekStart: '2026-08-03T00:00:00.000Z',
          weekEnd: '2026-08-09T23:59:59.999Z',
          entries: [],
          currentUser: null,
          totalParticipants: 0,
        },
      },
    });

    render(<LeaderboardWidget />);

    expect(await screen.findByText('No study activity this week yet')).toBeInTheDocument();
  });

  test('renders error state and handles retry click', async () => {
    API.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<LeaderboardWidget />);

    expect(await screen.findByText('Unable to load the weekly leaderboard')).toBeInTheDocument();

    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          weekStart: '2026-08-03T00:00:00.000Z',
          weekEnd: '2026-08-09T23:59:59.999Z',
          entries: [],
          currentUser: null,
          totalParticipants: 0,
        },
      },
    });

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('No study activity this week yet')).toBeInTheDocument();
  });
});
