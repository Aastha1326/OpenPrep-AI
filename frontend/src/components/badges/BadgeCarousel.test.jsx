import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BadgeCarousel from './BadgeCarousel';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('BadgeCarousel UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders category tabs and badge cards', async () => {
    const mockBadges = [
      {
        id: 'week_warrior',
        badgeCode: 'week_warrior',
        name: 'Week Warrior',
        description: 'Achieve a 7-day study streak',
        icon: 'Flame',
        category: 'streak',
        unlocked: true,
        unlockedAt: '2026-08-20T00:00:00.000Z',
        progress: 100,
      },
      {
        id: 'quiz_master',
        badgeCode: 'quiz_master',
        name: 'Quiz Master',
        description: 'Achieve a 100% score on a quiz',
        icon: 'Brain',
        category: 'quiz',
        unlocked: false,
        progress: 50,
      },
    ];

    API.get.mockResolvedValue({
      data: {
        success: true,
        data: mockBadges,
      },
    });

    render(<BadgeCarousel userId="user-123" />);

    expect(screen.getByTestId('badge-carousel-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all badges/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Week Warrior')).toBeInTheDocument();
      expect(screen.getByText('Quiz Master')).toBeInTheDocument();
    });

    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  test('filters badges when category tab is clicked', async () => {
    const mockBadges = [
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        category: 'streak',
        unlocked: true,
      },
      {
        id: 'quiz_master',
        name: 'Quiz Master',
        category: 'quiz',
        unlocked: false,
      },
    ];

    API.get.mockResolvedValue({
      data: {
        success: true,
        data: mockBadges,
      },
    });

    render(<BadgeCarousel userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    });

    const quizTab = screen.getByRole('button', { name: /quizzes/i });
    fireEvent.click(quizTab);

    expect(screen.getByText('Quiz Master')).toBeInTheDocument();
    expect(screen.queryByText('Week Warrior')).not.toBeInTheDocument();
  });
});
