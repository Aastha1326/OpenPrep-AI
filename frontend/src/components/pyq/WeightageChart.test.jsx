import { render, screen } from '@testing-library/react';
import WeightageChart, { CustomTooltip } from './WeightageChart';

const mockData = [
  { chapterName: 'Thermodynamics', weightage: 25, questionCount: 10 },
  { chapterName: 'Kinematics', weightage: 40, questionCount: 16 },
  { chapterName: 'Optics', weightage: 15, questionCount: 6 },
  { chapterName: 'Electromagnetism', weightage: 20, questionCount: 8 },
];

describe('WeightageChart Component', () => {
  test('renders chart title and container', () => {
    render(<WeightageChart data={mockData} title="Physics Topic Weightage" />);
    expect(screen.getByText('Physics Topic Weightage')).toBeInTheDocument();
    expect(screen.getByText('Highest First')).toBeInTheDocument();
  });

  test('displays empty notice when data is empty', () => {
    render(<WeightageChart data={[]} />);
    expect(screen.getByText('No topic weightage data available.')).toBeInTheDocument();
  });

  test('CustomTooltip renders active data with chapter name, weightage, and question count', () => {
    const payload = [
      {
        payload: {
          name: 'Kinematics',
          weightage: 40,
          questionCount: 16,
        },
      },
    ];

    render(<CustomTooltip active={true} payload={payload} />);
    expect(screen.getByText('Kinematics')).toBeInTheDocument();
    expect(screen.getByText(/Weightage: 40%/i)).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });
});
