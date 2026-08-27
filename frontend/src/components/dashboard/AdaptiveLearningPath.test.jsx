import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdaptiveLearningPath from './AdaptiveLearningPath';
import API from '../../services/api';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('AdaptiveLearningPath UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders learning path timeline with items and progress bar', async () => {
    const mockPathData = {
      id: 'lp-1',
      goal: 'Prepare for SAT Exam',
      overallProgress: 25,
      pathItems: [
        {
          itemId: 'item-1',
          topicName: 'Algebra & Functions',
          subjectName: 'Math',
          accuracy: 40,
          masteryStatus: 'weak',
          status: 'in_progress',
          targetDate: '2026-08-25',
          recommendedResources: [
            { title: 'Algebra Notes', type: 'note', url: '/notes/1' },
          ],
        },
      ],
    };

    API.get.mockResolvedValue({
      data: {
        success: true,
        data: mockPathData,
      },
    });

    render(<AdaptiveLearningPath />);

    expect(screen.getByTestId('adaptive-learning-path-widget')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1. Algebra & Functions')).toBeInTheDocument();
      expect(screen.getByText('Weak Gap')).toBeInTheDocument();
    });

    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate path/i })).toBeInTheDocument();
  });

  test('regenerates path on button click', async () => {
    API.get.mockResolvedValue({
      data: {
        success: true,
        data: { goal: 'SAT Prep', overallProgress: 0, pathItems: [] },
      },
    });

    API.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          goal: 'SAT Prep',
          overallProgress: 0,
          pathItems: [
            {
              itemId: 'new-1',
              topicName: 'Geometry Basics',
              subjectName: 'Math',
              accuracy: 0,
              masteryStatus: 'unattempted',
              status: 'in_progress',
              targetDate: '2026-08-26',
            },
          ],
        },
      },
    });

    render(<AdaptiveLearningPath />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /regenerate path/i })).toBeInTheDocument();
    });

    const regenBtn = screen.getByRole('button', { name: /regenerate path/i });
    fireEvent.click(regenBtn);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/learning-path/generate', expect.any(Object));
      expect(screen.getByText('1. Geometry Basics')).toBeInTheDocument();
    });
  });
});

