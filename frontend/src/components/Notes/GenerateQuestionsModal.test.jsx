import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenerateQuestionsModal from './GenerateQuestionsModal';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('GenerateQuestionsModal UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(<GenerateQuestionsModal isOpen={false} onClose={() => {}} noteContent="Sample content" />);
    expect(screen.queryByText('AI Question Generator')).not.toBeInTheDocument();
  });

  test('renders modal header and options when isOpen is true', () => {
    render(<GenerateQuestionsModal isOpen={true} onClose={() => {}} noteContent="Sample content" noteTitle="Chemistry Notes" />);
    expect(screen.getByText('AI Question Generator')).toBeInTheDocument();
    expect(screen.getByText('Source: Chemistry Notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate questions/i })).toBeInTheDocument();
  });

  test('displays loading spinner during generation and renders Q&A list on response', async () => {
    API.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  success: true,
                  data: [
                    {
                      id: 'q-1',
                      question: 'What is the atomic number of Carbon?',
                      answer: '6',
                      options: ['4', '6', '12', '14'],
                      type: 'multiple_choice',
                      difficulty: 'easy',
                    },
                  ],
                },
              }),
            100
          )
        )
    );

    render(<GenerateQuestionsModal isOpen={true} onClose={() => {}} noteContent="Carbon notes content" noteTitle="Chemistry Notes" />);

    const generateBtn = screen.getByRole('button', { name: /generate questions/i });
    fireEvent.click(generateBtn);

    // Verify loading spinner is displayed
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Verify Q&A list is displayed after promise resolves
    await waitFor(() => {
      expect(screen.getByText('1. What is the atomic number of Carbon?')).toBeInTheDocument();
    });

    expect(screen.getByText('Answer & Explanation:')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
