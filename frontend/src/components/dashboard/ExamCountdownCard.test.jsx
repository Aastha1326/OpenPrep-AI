import { render, screen } from '@testing-library/react';
import ExamCountdownCard from './ExamCountdownCard';

describe('ExamCountdownCard Component tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders countdown to target exam', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    render(<ExamCountdownCard targetExamName="NEET" examDateString={futureDate.toISOString()} />);
    
    expect(screen.getByText('Countdown to NEET')).toBeInTheDocument();
    expect(screen.getByText('days')).toBeInTheDocument();
    expect(screen.getByText('hours')).toBeInTheDocument();
    expect(screen.getByText('minutes')).toBeInTheDocument();
    expect(screen.getByText('seconds')).toBeInTheDocument();
  });
});
