import { render, screen, fireEvent } from '@testing-library/react';
import ExamCountdownCard from './ExamCountdownCard';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ExamCountdownCard Component tests', () => {
  const mockStats = {
    targetExamDate: '2026-09-01T00:00:00.000Z',
    daysUntilExam: 18,
    requiredDailyMinutes: 240,
    loggedMinutesToday: 180,
    paceStatus: 'Slightly Behind',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders remaining days countdown and target velocity tracking numbers', () => {
    render(<ExamCountdownCard stats={mockStats} onRefresh={() => {}} />);

    // Renders days left text
    expect(screen.getByText('Left')).toBeInTheDocument();

    // Renders required daily hours vs logged today
    expect(screen.getByText('3.0 / 4.0 Hrs Logged Today')).toBeInTheDocument();

    // Renders pace badge
    expect(screen.getByText('Slightly Behind')).toBeInTheDocument();
  });

  test('opens Date Picker modal on change date click', () => {
    render(<ExamCountdownCard stats={mockStats} onRefresh={() => {}} />);

    const changeBtn = screen.getByRole('button', { name: /change date/i });
    fireEvent.click(changeBtn);

    expect(screen.getByText('Set Target Exam Date')).toBeInTheDocument();
  });

  test('opens Log Study Session modal on log study session click', () => {
    API.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    render(<ExamCountdownCard stats={mockStats} onRefresh={() => {}} />);

    const logBtn = screen.getByRole('button', { name: /log study session/i });
    fireEvent.click(logBtn);

    expect(screen.getByText('Log Study Session')).toBeInTheDocument();
  });
});
