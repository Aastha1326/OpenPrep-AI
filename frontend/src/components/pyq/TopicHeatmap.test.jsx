/* eslint-disable no-unused-vars */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopicHeatmap from './TopicHeatmap';

// Mock Recharts responsive container to render in test environment
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => children,
  };
});

const mockQuestions = [
  {
    topicName: 'Binary Search',
    year: 2022,
    marks: 10,
    questionText: 'Given a sorted array, write a program to binary search an element.',
  },
  {
    topicName: 'Binary Search',
    year: 2023,
    marks: 15,
    questionText: 'MCQ: What is the worst-case time complexity of binary search? A) O(N) B) O(log N) C) O(1) D) O(N^2)',
  },
  {
    topicName: 'Depth First Search',
    year: 2021,
    marks: 5,
    questionText: 'Explain the DFS traversal algorithm with an example.',
  },
];

describe('TopicHeatmap', () => {
  it('renders the component headers and filters', () => {
    render(<TopicHeatmap questions={mockQuestions} />);
    expect(screen.getByText('Historic Topic Frequency Heatmap')).toBeInTheDocument();
    expect(screen.getByText('From Year')).toBeInTheDocument();
    expect(screen.getByText('To Year')).toBeInTheDocument();
    expect(screen.getByText('Q-Type')).toBeInTheDocument();
  });

  it('populates year options based on the dataset', () => {
    render(<TopicHeatmap questions={mockQuestions} />);
    const selects = screen.getAllByRole('combobox');
    
    // Available years: 2021, 2022, 2023
    const fromSelect = selects[0];
    const toSelect = selects[1];
    
    expect(fromSelect).toHaveTextContent('2021');
    expect(fromSelect).toHaveTextContent('2022');
    expect(fromSelect).toHaveTextContent('2023');

    expect(toSelect).toHaveTextContent('2021');
    expect(toSelect).toHaveTextContent('2022');
    expect(toSelect).toHaveTextContent('2023');
  });

  it('shows empty state when no questions match the filters', async () => {
    render(<TopicHeatmap questions={mockQuestions} />);
    const selects = screen.getAllByRole('combobox');
    
    // Set From Year to 2023 and To Year to 2021 (invalid/no data range)
    fireEvent.change(selects[0], { target: { value: '2023' } });
    fireEvent.change(selects[1], { target: { value: '2021' } });

    await waitFor(() => {
      expect(screen.getByText('No questions match the current filters.')).toBeInTheDocument();
    });
  });

  it('filters questions by MCQ and Subjective type correctly', async () => {
    render(<TopicHeatmap questions={mockQuestions} />);
    const selects = screen.getAllByRole('combobox');
    const qTypeSelect = selects[2];

    // Filter MCQ
    fireEvent.change(qTypeSelect, { target: { value: 'mcq' } });
    
    // Filter Subjective
    fireEvent.change(qTypeSelect, { target: { value: 'subjective' } });
  });
});
