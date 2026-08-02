process.env.TZ = 'America/New_York';

import { render, screen } from '@testing-library/react';
import StudyPlanModal from './StudyPlanModal';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const renderModal = (activePlan) =>
  render(<StudyPlanModal isOpen onClose={() => {}} activePlan={activePlan} />);

const expectDateHeading = (day) => {
  const heading = screen
    .getAllByRole('heading', { level: 3 })
    .find((h) => h.textContent.includes('2026'));
  expect(heading).toBeTruthy();
  expect(heading.textContent).toContain(`${day} October`);
  expect(heading.textContent).not.toContain(`${day - 1} October`);
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
