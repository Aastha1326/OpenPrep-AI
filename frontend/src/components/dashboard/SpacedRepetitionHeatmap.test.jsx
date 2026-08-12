import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SpacedRepetitionHeatmap from './SpacedRepetitionHeatmap';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SpacedRepetitionHeatmap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    API.get.mockReturnValue(new Promise(() => {}));
    render(<SpacedRepetitionHeatmap />);
    // Shimmer/loading div should be present
    expect(screen.queryByText('30-Day Review Forecast')).not.toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    API.get.mockRejectedValue(new Error('Network error'));
    render(<SpacedRepetitionHeatmap />);
    expect(await screen.findByText('Failed to load review forecast')).toBeInTheDocument();
  });

  it('renders forecast heatmap correctly when data is fetched', async () => {
    const mockData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        count: i % 5 === 0 ? 10 : 0, // mock some reviews
      };
    });

    API.get.mockResolvedValue({ data: { success: true, data: mockData } });
    render(<SpacedRepetitionHeatmap />);

    expect(await screen.findByText('30-Day Review Forecast')).toBeInTheDocument();

    // Check that grid days are rendered
    const dayLabels = weekdaysList();
    dayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('displays tooltip on hover over a cell', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const mockData = [{ date: todayStr, count: 12 }];

    API.get.mockResolvedValue({ data: { success: true, data: mockData } });
    render(<SpacedRepetitionHeatmap />);

    // Wait for load
    await screen.findByText('30-Day Review Forecast');

    // Find the cell representing today's day number
    const todayNum = today.getDate().toString();
    const cell = screen.getByText(todayNum);
    expect(cell).toBeInTheDocument();

    // Trigger mouse enter
    fireEvent.mouseEnter(cell);

    // Verify tooltip contents
    expect(screen.getByText('12 cards due')).toBeInTheDocument();
    expect(screen.getByText('Medium workload')).toBeInTheDocument();
  });
});

const weekdaysList = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
