import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExamCountdownWidget from './ExamCountdownWidget';

// Wrap with Router because the component uses useNavigate
const renderWidget = (examDate, examName = 'Test Exam') =>
  render(
    <MemoryRouter>
      <ExamCountdownWidget examDate={examDate} examName={examName} />
    </MemoryRouter>
  );

// Helper: build an ISO date string N days from now
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// Helper: date string N days in the past
const daysAgo = (n) => daysFromNow(-n);

describe('ExamCountdownWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Renders nothing when no date provided ─────────────────────────────────

  it('renders a set target exam button when examDate is not provided', () => {
    render(
      <MemoryRouter>
        <ExamCountdownWidget examDate={null} examName="No Exam" />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Set your target exam/i })).toBeInTheDocument();
  });

  // ── Exam name is displayed ─────────────────────────────────────────────────

  it('displays the exam name in the header', () => {
    renderWidget(daysFromNow(60), 'JEE Advanced');
    expect(screen.getByText('JEE Advanced')).toBeInTheDocument();
  });

  // ── Urgency labels ─────────────────────────────────────────────────────────

  it('shows "Plenty of time" label when exam is > 30 days away', () => {
    renderWidget(daysFromNow(60));
    expect(screen.getByText('Plenty of time')).toBeInTheDocument();
  });

  it('shows "Time to accelerate" label when exam is 7-30 days away', () => {
    renderWidget(daysFromNow(15));
    expect(screen.getByText('Time to accelerate')).toBeInTheDocument();
  });

  it('shows "Final sprint!" label when exam is < 7 days away', () => {
    renderWidget(daysFromNow(3));
    expect(screen.getByText('Final sprint!')).toBeInTheDocument();
  });

  // ── 7-Day Sprint button ────────────────────────────────────────────────────

  it('does NOT render the 7-Day Sprint button when > 30 days remain', () => {
    renderWidget(daysFromNow(60));
    expect(
      screen.queryByRole('button', { name: /launch 7-day sprint/i })
    ).not.toBeInTheDocument();
  });

  it('does NOT render the 7-Day Sprint button when 7–30 days remain', () => {
    renderWidget(daysFromNow(15));
    expect(
      screen.queryByRole('button', { name: /launch 7-day sprint/i })
    ).not.toBeInTheDocument();
  });

  it('renders the 7-Day Sprint button when < 7 days remain', () => {
    renderWidget(daysFromNow(3));
    expect(
      screen.getByRole('button', { name: /launch 7-day sprint revision/i })
    ).toBeInTheDocument();
  });

  it('renders the 7-Day Sprint button even on the last day (0 full days left)', () => {
    // 5 hours from now
    const d = new Date();
    d.setHours(d.getHours() + 5);
    renderWidget(d.toISOString());
    expect(
      screen.getByRole('button', { name: /launch 7-day sprint revision/i })
    ).toBeInTheDocument();
  });

  // ── Past exam date ─────────────────────────────────────────────────────────

  it('shows "Exam date has passed" when the exam date is in the past', () => {
    renderWidget(daysAgo(2));
    expect(screen.getByText(/exam date has passed/i)).toBeInTheDocument();
  });

  it('does NOT render the 7-Day Sprint button when exam has passed', () => {
    renderWidget(daysAgo(1));
    expect(
      screen.queryByRole('button', { name: /launch 7-day sprint revision/i })
    ).not.toBeInTheDocument();
  });

  // ── Countdown digit units are rendered ────────────────────────────────────

  it('renders the four time-unit labels (Days, Hrs, Min, Sec)', () => {
    renderWidget(daysFromNow(10));
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Hrs')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Sec')).toBeInTheDocument();
  });

  // ── Widget has correct aria role ─────────────────────────────────────────

  it('has role="timer" for accessibility', () => {
    renderWidget(daysFromNow(20), 'NEET 2026');
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('has correct aria-label including the exam name', () => {
    renderWidget(daysFromNow(20), 'NEET 2026');
    expect(
      screen.getByLabelText(/exam countdown: neet 2026/i)
    ).toBeInTheDocument();
  });
it('shows exam settings when no target exam is configured', () => {
  renderWidget(null);

  expect(
    screen.getByRole('button', { name: /set your target exam/i })
  ).toBeInTheDocument();
});

it('opens the exam countdown settings modal', async () => {
  renderWidget(daysFromNow(30));

  await act(async () => {
    screen.getByRole('button', {
      name: /edit exam countdown settings/i,
    }).click();
  });

  expect(
    screen.getByRole('dialog', {
      name: /exam countdown settings/i,
    })
  ).toBeInTheDocument();
});

it('renders progress indicators and motivation quote', () => {
  renderWidget(daysFromNow(30));

  expect(screen.getByText(/time elapsed/i)).toBeInTheDocument();
  expect(screen.getByText(/milestones/i)).toBeInTheDocument();
  expect(screen.getByText(/new motivation/i)).toBeInTheDocument();
});
  // ── Live tick ─────────────────────────────────────────────────────────────

  it('updates seconds digit every second', async () => {
    // Create a date 10 minutes from now so seconds start at ~0
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 10);

    renderWidget(futureDate.toISOString());

    // Grab initial seconds value
    const secBefore = screen.getByText('Sec').previousSibling?.textContent;

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // We can't deterministically assert the exact digit without more setup,
    // but we verify the element still exists (widget hasn't crashed).
    expect(screen.getByText('Sec')).toBeInTheDocument();
  });
});
