import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PacingCoachDashboard from './PacingCoachDashboard';
import { getPacingPlan, getLivePacing, getPacingAutopsy, getSubjectPacingProfile } from '../services/pacingCoachApi';
import '@testing-library/jest-dom';

// Mock the API calls
jest.mock('../services/pacingCoachApi', () => ({
  getPacingPlan: jest.fn(),
  getLivePacing: jest.fn(),
  getPacingAutopsy: jest.fn(),
  getSubjectPacingProfile: jest.fn(),
}));

// Mock Recharts to avoid ResizeObserver and actual SVG rendering issues in tests
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div style={{ width: '800px', height: '600px' }}>{children}</div>,
  };
});

describe('PacingCoachDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial setup state', () => {
    render(<PacingCoachDashboard />);
    expect(screen.getByText(/Pacing Coach Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the Pacing Coach/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Simulation Attempt/i })).toBeInTheDocument();
  });

  it('progresses to live pacing state when simulation starts', async () => {
    getSubjectPacingProfile.mockResolvedValueOnce({ data: { factor: 1.0, message: 'On pace' } });
    getPacingPlan.mockResolvedValueOnce({
      data: {
        totalDurationSeconds: 600,
        reviewBufferPercent: 10,
        reviewBufferSeconds: 60,
        usableTimeSeconds: 540,
        allocatedTotalSeconds: 540,
        questionBudgets: [
          { questionId: 'q1', budgetSeconds: 100, difficulty: 'easy', order: 1 },
          { questionId: 'q2', budgetSeconds: 150, difficulty: 'medium', order: 2 }
        ]
      }
    });
    getLivePacing.mockResolvedValueOnce({
      data: {
        paceState: 'on_track',
        elapsedSeconds: 110,
        remainingTime: 490,
        consumedBudget: 100,
        remainingBudget: 440,
        projectedCompletion: {
          projectedUnanswered: 0,
          estimatedFinishingTime: 500,
          projectedCompletionPercentage: 100
        },
        bleedState: {
          isBleeding: false,
          threshold: 262.5
        }
      }
    });

    render(<PacingCoachDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Start Simulation Attempt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Exam Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Pacing View/i)).toBeInTheDocument();
      // Wait for the mock components to render their data
      expect(screen.getByText(/Pace: ON TRACK/i)).toBeInTheDocument();
    });
  });

  it('shows error state if API fails', async () => {
    getSubjectPacingProfile.mockRejectedValueOnce(new Error('Network error'));
    getPacingPlan.mockRejectedValueOnce(new Error('Plan generation failed'));

    render(<PacingCoachDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Start Simulation Attempt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Plan generation failed/i)).toBeInTheDocument();
    });
  });

  it('renders autopsy after finishing attempt', async () => {
    // Simulate being in live state first
    getSubjectPacingProfile.mockResolvedValueOnce({ data: { factor: 1.0, message: 'On pace' } });
    getPacingPlan.mockResolvedValueOnce({
      data: {
        totalDurationSeconds: 600,
        reviewBufferPercent: 10,
        reviewBufferSeconds: 60,
        usableTimeSeconds: 540,
        allocatedTotalSeconds: 540,
        questionBudgets: [
          { questionId: 'q1', budgetSeconds: 100, difficulty: 'easy', order: 1 }
        ]
      }
    });
    getLivePacing.mockResolvedValueOnce({ data: { paceState: 'on_track', projectedCompletion: {} } });
    
    render(<PacingCoachDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Start Simulation Attempt/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finish Attempt & View Autopsy/i })).toBeInTheDocument();
    });

    // Mock autopsy response
    getPacingAutopsy.mockResolvedValueOnce({
      data: {
        totalTimeSpent: 500,
        totalBudget: 540,
        estimatedOpportunityCostMarks: 2,
        classifications: {
          efficient: 1,
          slow_win: 0,
          time_sink: 1,
          rushed_loss: 0
        },
        analyzedQuestions: [
          { questionId: 'q1', ratio: 0.5, marksEarned: 1, classification: 'efficient' },
          { questionId: 'q2', ratio: 2.0, marksEarned: 0, classification: 'time_sink' }
        ],
        skipRecommendations: [
          { questionId: 'q2', message: 'Skip earlier' }
        ]
      }
    });

    fireEvent.click(screen.getByRole('button', { name: /Finish Attempt & View Autopsy/i }));

    await waitFor(() => {
      expect(screen.getByText(/Post-Attempt Time Autopsy/i)).toBeInTheDocument();
      expect(screen.getByText(/Skip Recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/Skip earlier/i)).toBeInTheDocument();
      expect(screen.getByText(/Reset Simulation/i)).toBeInTheDocument();
    });
  });
});
