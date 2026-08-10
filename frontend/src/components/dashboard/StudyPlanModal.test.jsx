process.env.TZ = 'America/New_York';

import { render, screen, waitFor } from '@testing-library/react';
import StudyPlanModal from './StudyPlanModal';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const API = (await import('../../services/api')).default;

afterEach(() => {
  API.get.mockReset();
  API.post.mockReset();
});

const renderModal = (activePlan, syllabusPrefill) =>
  render(
    <StudyPlanModal isOpen onClose={() => {}} activePlan={activePlan} syllabusPrefill={syllabusPrefill} />
  );

const expectDateHeading = (day) => {
  const heading = screen
    .getAllByRole('heading', { level: 3 })
    .find((h) => h.textContent.includes('2026'));
  expect(heading).toBeTruthy();
  const text = heading.textContent;
  const dayFirst = text.match(/(^|[^0-9])(\d{1,2})\s+October/);
  const monthFirst = text.match(/October\s+(\d{1,2})\b/);
  const renderedDay = dayFirst ? dayFirst[2] : monthFirst?.[1];
  expect(renderedDay).toBe(String(day));
};

describe('StudyPlanModal date rendering (issue #461)', () => {
  it('renders plain YYYY-MM-DD goal dates on the correct calendar day', () => {
    renderModal({
      id: 'plan-1',
      dailyGoals: [
        {
          date: '2026-10-10',
          tasks: [{ title: 'Review Algebra', duration: 60, completed: false, topic: null }],
        },
      ],
    });

    expect(screen.getByText('Review Algebra')).toBeInTheDocument();
    // In a negative-offset timezone the old new Date("YYYY-MM-DD") path would
    // render October 9; the fix must keep the schedule on October 10.
    expectDateHeading(10);
  });

  it('renders legacy ISO timestamp goal dates on the correct calendar day', () => {
    renderModal({
      id: 'plan-2',
      dailyGoals: [
        {
          date: '2026-10-10T00:00:00.000Z',
          tasks: [{ title: 'Practice Calculus', duration: 90, completed: false, topic: null }],
        },
      ],
    });

    expect(screen.getByText('Practice Calculus')).toBeInTheDocument();
    expectDateHeading(10);
  });
});

describe('StudyPlanModal milestones (issue #623)', () => {
  it('renders milestone checkpoints from the active plan', () => {
    renderModal({
      id: 'plan-m1',
      dailyGoals: [{ date: '2026-08-01', tasks: [] }],
      milestones: [
        {
          id: 'm1',
          title: 'Week 1 Checkpoint',
          date: '2026-08-07',
          type: 'weekly_checkpoint',
          description: 'Review material studied this week.',
          status: 'pending',
        },
        {
          id: 'm2',
          title: 'Semester Exams — Exam Day',
          date: '2026-08-31',
          type: 'exam_day',
          description: 'Exam day. Stay calm and give it your best.',
          status: 'pending',
        },
      ],
    });

    expect(screen.getByText(/Milestones & Checkpoints/)).toBeInTheDocument();
    expect(screen.getByText('Week 1 Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Semester Exams — Exam Day')).toBeInTheDocument();
    expect(screen.getByText('Exam day. Stay calm and give it your best.')).toBeInTheDocument();
  });

  it('marks completed milestones with a completed badge', () => {
    renderModal({
      id: 'plan-m2',
      dailyGoals: [{ date: '2026-08-01', tasks: [] }],
      milestones: [
        {
          id: 'm1',
          title: 'Week 1 Checkpoint',
          date: '2026-08-07',
          type: 'weekly_checkpoint',
          description: 'Review material studied this week.',
          status: 'completed',
        },
      ],
    });

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});

describe('StudyPlanModal syllabus prefill (issue #623)', () => {
  it('prefills exam and end date from the imported syllabus', async () => {
    API.get.mockResolvedValue({
      data: {
        data: [{ id: 'exam-1', name: 'Semester Exams', date: '2026-08-31' }],
      },
    });

    renderModal(null, {
      examId: 'exam-1',
      examName: 'Semester Exams',
      examDate: '2026-08-31',
    });

    expect(await screen.findByText(/Prefilled from imported syllabus/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('combobox').value).toBe('exam-1');
    });
    expect(screen.getByDisplayValue('2026-08-31')).toBeInTheDocument();
  });
});
