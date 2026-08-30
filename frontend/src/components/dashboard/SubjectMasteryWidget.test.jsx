import { render, screen, fireEvent } from '@testing-library/react';
import SubjectMasteryWidget from './SubjectMasteryWidget';
import API from '../../services/api';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

const masteryData = {
  success: true,
  data: {
    overallMastery: 72,
    overallTier: 'Intermediate',
    subjects: [
      {
        id: 's1',
        name: 'Mathematics',
        masteryPercentage: 85,
        tier: 'Master',
        chapters: [
          { id: 't1', name: 'Algebra', masteryPercentage: 90, tier: 'Master' },
          { id: 't2', name: 'Geometry', masteryPercentage: 60, tier: 'Intermediate' },
        ],
      },
      {
        id: 's2',
        name: 'Physics',
        masteryPercentage: 40,
        tier: 'Beginner',
        chapters: [],
      },
    ],
  },
};

// API.get resolves to the axios response object, whose `.data` is the payload
const apiResponse = { data: masteryData };

describe('SubjectMasteryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders overall mastery, tier badges, and subject cards', async () => {
    API.get.mockResolvedValueOnce(apiResponse);

    render(<SubjectMasteryWidget />);

    expect(await screen.findByText('Subject Mastery')).toBeInTheDocument();
    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Overall Mastery')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  test('renders empty state when there are no subjects', async () => {
    API.get.mockResolvedValueOnce({
      data: { success: true, data: { overallMastery: 0, overallTier: 'Beginner', subjects: [] } },
    });

    render(<SubjectMasteryWidget />);

    expect(
      await screen.findByText(/Add subjects and start studying to unlock mastery badges/i)
    ).toBeInTheDocument();
  });

  test('expands subject to show chapter breakdown', async () => {
    API.get.mockResolvedValueOnce(apiResponse);

    render(<SubjectMasteryWidget />);

    await screen.findByText('Mathematics');

    const expandBtn = screen.getByRole('button', { name: /Expand Mathematics chapters/i });
    fireEvent.click(expandBtn);

    expect(await screen.findByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
  });

  test('renders error state and handles retry click', async () => {
    API.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<SubjectMasteryWidget />);

    expect(await screen.findByText('Could not load subject mastery levels')).toBeInTheDocument();

    API.get.mockResolvedValueOnce(apiResponse);

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
  });
});

