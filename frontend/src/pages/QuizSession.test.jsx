import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuizSession from './QuizSession';
import API from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const sampleQuiz = {
  id: 'q1',
  title: 'Math Quiz',
  questions: [
    {
      _id: 'qq1',
      questionText: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: '4',
      explanation: '',
    },
    {
      _id: 'qq2',
      questionText: 'What is 2*3?',
      options: ['5', '6', '7'],
      correctAnswer: '6',
      explanation: '',
    },
  ],
};

const renderQuiz = () =>
  render(
    <MemoryRouter initialEntries={['/quiz/q1']}>
      <Routes>
        <Route path="/quiz/:id" element={<QuizSession />} />
      </Routes>
    </MemoryRouter>
  );

// Ensure effects (e.g. the countdown interval) are installed before advancing fake timers.
const flushEffects = () => act(async () => {});

describe('QuizSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders a countdown timer with the full time limit for the quiz', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    renderQuiz();

    // 2 questions * 60 seconds each = 02:00
    expect(await screen.findByText('02:00')).toBeInTheDocument();
  });

  test('counts down each second', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    renderQuiz();
    await screen.findByText('02:00');
    await flushEffects();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(await screen.findByText('01:59')).toBeInTheDocument();
  });

  test('shows the Time Elapsed overlay and auto-submits when the timer reaches zero', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    API.post.mockReturnValue(new Promise(() => {})); // keep submission pending
    renderQuiz();
    await screen.findByText('02:00');
    await flushEffects();

    act(() => {
      vi.advanceTimersByTime(120 * 1000);
    });

    expect(screen.getByText('Time Elapsed')).toBeInTheDocument();
    expect(screen.getByText('Submitting Quiz...')).toBeInTheDocument();
    expect(API.post).toHaveBeenCalledWith('/quizzes/q1/submit', { answers: [] });
  });

  test('auto-submits the selected answers when time runs out and shows the result', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    API.post.mockResolvedValue({ data: { data: { score: 50 } } });
    renderQuiz();

    fireEvent.click(await screen.findByText('What is 2+2?'));
    await flushEffects();
    fireEvent.click(screen.getByText('4'));

    act(() => {
      vi.advanceTimersByTime(120 * 1000);
    });

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/quizzes/q1/submit', {
        answers: [{ questionId: 'qq1', selectedAnswer: '4' }],
      });
    });
    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  test('freezes answer selection once time has elapsed', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    API.post.mockReturnValue(new Promise(() => {}));
    renderQuiz();
    await screen.findByText('02:00');
    await flushEffects();

    act(() => {
      vi.advanceTimersByTime(120 * 1000);
    });

    expect(screen.getByRole('button', { name: '4' })).toBeDisabled();
  });

  test('manual submit still posts answers before the timer runs out', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    API.post.mockResolvedValue({ data: { data: { score: 100 } } });
    renderQuiz();

    fireEvent.click(await screen.findByText('What is 2+2?'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    fireEvent.click(await screen.findByText('What is 2*3?'));
    fireEvent.click(screen.getByText('6'));
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/quizzes/q1/submit', {
        answers: [
          { questionId: 'qq1', selectedAnswer: '4' },
          { questionId: 'qq2', selectedAnswer: '6' },
        ],
      });
    });
    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
  });

  test('renders mathematical formulas containing LaTeX notation via MathRenderer', async () => {
    const mathQuiz = {
      id: 'q-math',
      title: 'Science Quiz',
      questions: [
        {
          _id: 'q_math_1',
          questionText: 'Solve the equation: $\\sin^2 x + \\cos^2 x = ?$',
          options: ['$0$', '$1$', '$\\infty$'],
          correctAnswer: '$1$',
          explanation: 'Since $\\sin^2 x + \\cos^2 x = 1$ is a standard trigonometric identity.',
        }
      ],
    };

    API.get.mockResolvedValue({ data: { data: mathQuiz } });
    render(
      <MemoryRouter initialEntries={['/quiz/q-math']}>
        <Routes>
          <Route path="/quiz/:id" element={<QuizSession />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify equation container gets rendered in active question view
    const rendererSpan = await screen.findByText(/Solve the equation/);
    expect(rendererSpan).toBeInTheDocument();
    
    // Check for inline math structure generated by KaTeX
    const katexMath = rendererSpan.querySelector('.katex');
    expect(katexMath).toBeInTheDocument();
  });
});
