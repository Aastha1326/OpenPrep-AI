import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PyqDashboard from './PyqDashboard';
import API from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AudioReader and HighlightedText components
vi.mock('../components/AudioReader', () => ({
  default: () => <div data-testid="audio-reader">AudioReader</div>,
}));

vi.mock('../components/HighlightedText', () => ({
  default: ({ text }) => <div>{text}</div>,
}));

// Mock recharts ResponsiveContainer and charts to prevent rendering library errors in test
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe('PyqDashboard Component', () => {
  const mockSubjects = [
    { id: 'subj-1', name: 'Software Engineering' },
  ];

  const mockPyqs = [
    {
      id: 'pyq-1',
      title: 'Midterm 2025',
      year: 2025,
      difficulty: 'Medium',
      chapters: ['Requirements', 'Testing'],
      analysisResults: {
        chapterWeightage: [{ chapterName: 'Requirements', weightage: 60 }],
        importantTopics: [{ topicName: 'Agile', importance: 'High', frequency: 3 }],
        repeatedQuestions: [],
        trendAnalysis: 'Focus on agile practices.',
      },
    },
  ];

  const mockForecast = {
    predictedDifficulty: 'Hard',
    expectedEasyPercent: 20,
    expectedMediumPercent: 50,
    expectedHardPercent: 30,
    topicTrends: [
      { topicName: 'CI/CD Pipeline Design', expectedProbability: 95, trendStatus: 'High Probability in 2026' },
      { topicName: 'Object Oriented Architecture', expectedProbability: 80, trendStatus: 'Rising Weightage' },
    ],
    revisionStrategy: 'Revise design patterns and practice system diagramming daily.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with uploaded papers and switches tabs to show AI forecast', async () => {
    // Mock APIs
    API.get.mockImplementation((url) => {
      if (url === '/academic/subjects') {
        return Promise.resolve({ data: { success: true, data: mockSubjects } });
      }
      if (url === '/pyqs') {
        return Promise.resolve({ data: { success: true, data: mockPyqs } });
      }
      if (url === '/pyqs/forecast') {
        return Promise.resolve({ data: { success: true, data: mockForecast } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <MemoryRouter>
        <PyqDashboard />
      </MemoryRouter>
    );

    // Verify paper title is rendered
    expect(await screen.findByText('Midterm 2025')).toBeInTheDocument();

    // Verify Tab buttons exist
    const paperTab = screen.getByRole('button', { name: /Paper Insights/i });
    const forecastTab = screen.getByRole('button', { name: /AI Upcoming Forecast/i });
    expect(paperTab).toBeInTheDocument();
    expect(forecastTab).toBeInTheDocument();

    // Toggle to AI Upcoming Forecast Tab
    fireEvent.click(forecastTab);

    // Assert that forecast details are loaded and rendered
    expect(await screen.findByText('Predicted Upcoming Difficulty')).toBeInTheDocument();
    expect(screen.getByText('HARD')).toBeInTheDocument();
    expect(screen.getByText('CI/CD Pipeline Design')).toBeInTheDocument();
    expect(screen.getByText('High Probability in 2026')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
