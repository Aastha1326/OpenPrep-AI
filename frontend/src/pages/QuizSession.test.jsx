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
    expect(API.post).toHaveBeenCalledWith('/quizzes/q1/submit', {
      answers: [],
      submissionId: expect.any(String),
    });
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
        submissionId: expect.any(String),
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
        submissionId: expect.any(String),
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
        },
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
    const mathContainer = rendererSpan.closest('.math-renderer');
    expect(mathContainer).toBeInTheDocument();
    const katexMath = mathContainer.querySelector('.katex');
    expect(katexMath).toBeInTheDocument();
  });

  describe('AI question explanation', () => {
    const submitAnswers = async () => {
      fireEvent.click(await screen.findByText('What is 2+2?'));
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      fireEvent.click(await screen.findByText('What is 2*3?'));
      fireEvent.click(screen.getByText('6'));
      fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }));
      expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    };

    test('renders Get AI Hint and Explain Solution buttons for every reviewed question', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      API.post.mockResolvedValue({ data: { data: { score: 50 } } });
      renderQuiz();
      await submitAnswers();

      expect(screen.getAllByRole('button', { name: /Get AI Hint/i })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: /Explain Solution/i })).toHaveLength(2);
    });

    test('requests a hint and renders the returned markdown', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      API.post.mockImplementation((url) => {
        if (url === '/quizzes/q1/submit') {
          return Promise.resolve({ data: { data: { score: 50 } } });
        }
        if (url === '/ai/explain-question') {
          return Promise.resolve({
            data: { data: { mode: 'hint', markdown: '## Hint\nThink about addition.' } },
          });
        }
        return Promise.resolve({ data: {} });
      });
      renderQuiz();
      await submitAnswers();

      fireEvent.click(screen.getAllByRole('button', { name: /Get AI Hint/i })[0]);

      expect(await screen.findByRole('heading', { name: 'Hint' })).toBeInTheDocument();
      expect(screen.getByText('Think about addition.')).toBeInTheDocument();
      expect(API.post).toHaveBeenCalledWith('/ai/explain-question', {
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        userAnswer: 1,
        explanation: '',
        mode: 'hint',
        subjectName: '',
        topicName: '',
      });
    });

    test('requests a full solution and renders its step-by-step markdown', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      API.post.mockImplementation((url) => {
        if (url === '/quizzes/q1/submit') {
          return Promise.resolve({ data: { data: { score: 50 } } });
        }
        if (url === '/ai/explain-question') {
          return Promise.resolve({
            data: {
              data: {
                mode: 'full',
                markdown:
                  '## Step-by-Step Solution\n1. Start with 2 * 3.\n2. Multiply the two numbers.\n3. The result is 6.',
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      });
      renderQuiz();
      await submitAnswers();

      fireEvent.click(screen.getAllByRole('button', { name: /Explain Solution/i })[1]);

      expect(
        await screen.findByRole('heading', { name: 'Step-by-Step Solution' })
      ).toBeInTheDocument();
      expect(screen.getByText('Multiply the two numbers.')).toBeInTheDocument();
      expect(API.post).toHaveBeenCalledWith('/ai/explain-question', {
        question: 'What is 2*3?',
        options: ['5', '6', '7'],
        correctAnswer: '6',
        userAnswer: 1,
        explanation: '',
        mode: 'full',
        subjectName: '',
        topicName: '',
      });
    });

    test('shows an error message when the AI request fails', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      API.post.mockImplementation((url) => {
        if (url === '/quizzes/q1/submit') {
          return Promise.resolve({ data: { data: { score: 50 } } });
        }
        if (url === '/ai/explain-question') {
          return Promise.reject({ response: { data: { error: 'AI service unavailable' } } });
        }
        return Promise.resolve({ data: {} });
      });
      renderQuiz();
      await submitAnswers();

      fireEvent.click(screen.getAllByRole('button', { name: /Get AI Hint/i })[0]);

      expect(await screen.findByText('AI service unavailable')).toBeInTheDocument();
    });
  });

  test('shows an empty-state notice and no submit button when the quiz has zero questions', async () => {
    const emptyQuiz = {
      id: 'q-empty',
      title: 'Empty Quiz',
      questions: [],
    };

    API.get.mockResolvedValue({ data: { data: emptyQuiz } });
    renderQuiz();

    expect(await screen.findByText('No Questions Available')).toBeInTheDocument();
    expect(screen.getByText(/has no questions to answer/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit Quiz/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });

  test('prevents duplicate submissions on rapid double-click and sends an idempotency key', async () => {
    API.get.mockResolvedValue({ data: { data: sampleQuiz } });
    let rejectPost;
    API.post.mockImplementation((url) => {
      if (url === '/quizzes/q1/submit') {
        return new Promise((_, reject) => {
          rejectPost = reject;
        });
      }
      return Promise.resolve({ data: {} });
    });
    renderQuiz();

    fireEvent.click(await screen.findByText('What is 2+2?'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    fireEvent.click(await screen.findByText('What is 2*3?'));
    fireEvent.click(screen.getByText('6'));

    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);
    // AC1: the Submit button must be disabled immediately once submission starts
    expect(submitBtn).toBeDisabled();
    fireEvent.click(submitBtn);

    // The ref guard must swallow the second click — only ONE submit POST fires.
    // (The telemetry queue also POSTs a flush, so filter for the submit URL.)
    const submitCalls = () =>
      API.post.mock.calls.filter(([u]) => u === '/quizzes/q1/submit');
    expect(submitCalls()).toHaveLength(1);
    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    const [url, payload] = submitCalls()[0];
    expect(url).toBe('/quizzes/q1/submit');
    expect(payload.answers).toHaveLength(2);
    expect(typeof payload.submissionId).toBe('string');

    // Simulate a lost response: the submitting flag clears (button re-enables) and
    // the retry reuses the SAME submissionId so the backend can drop the duplicate (#762).
    await act(async () => {
      rejectPost({ response: { data: { error: 'network error' } } });
    });

    const retryBtn = await screen.findByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(retryBtn);
    expect(submitCalls()).toHaveLength(2);
    expect(submitCalls()[1][1].submissionId).toBe(payload.submissionId);
  });

  describe('localStorage mid-quiz progress persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('persists selected answers to localStorage within 500ms debounce', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      renderQuiz();

      expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
      fireEvent.click(screen.getByText('4'));

      act(() => {
        vi.advanceTimersByTime(500);
      });

      const saved = JSON.parse(localStorage.getItem('quiz_progress_q1'));
      expect(saved).not.toBeNull();
      expect(saved.quizId).toBe('q1');
      expect(saved.answers['qq1']).toBe('4');
    });

    test('renders Resume Quiz banner when valid saved progress within 2 hours exists', async () => {
      const validSavedState = {
        quizId: 'q1',
        answers: { qq1: '4' },
        currentQuestionIndex: 0,
        startedAt: Date.now() - 30 * 60 * 1000,
      };
      localStorage.setItem('quiz_progress_q1', JSON.stringify(validSavedState));

      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      renderQuiz();

      expect(await screen.findByText('Resume quiz?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Fresh' })).toBeInTheDocument();
    });

    test('restores answers and jumps to last unanswered question when Resume is clicked', async () => {
      const validSavedState = {
        quizId: 'q1',
        answers: { qq1: '4' },
        currentQuestionIndex: 0,
        startedAt: Date.now() - 30 * 60 * 1000,
      };
      localStorage.setItem('quiz_progress_q1', JSON.stringify(validSavedState));

      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      renderQuiz();

      fireEvent.click(await screen.findByRole('button', { name: 'Resume' }));

      expect(await screen.findByText('What is 2*3?')).toBeInTheDocument();
      expect(screen.queryByText('Resume quiz?')).not.toBeInTheDocument();
    });

    test('discards saved state older than 2 hours automatically on mount', async () => {
      const expiredSavedState = {
        quizId: 'q1',
        answers: { qq1: '4' },
        currentQuestionIndex: 0,
        startedAt: Date.now() - 3 * 60 * 60 * 1000,
      };
      localStorage.setItem('quiz_progress_q1', JSON.stringify(expiredSavedState));

      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      renderQuiz();

      await screen.findByText('What is 2+2?');
      expect(screen.queryByText('Resume quiz?')).not.toBeInTheDocument();
      expect(localStorage.getItem('quiz_progress_q1')).toBeNull();
    });

    test('clears localStorage upon successful quiz submission', async () => {
      API.get.mockResolvedValue({ data: { data: sampleQuiz } });
      API.post.mockResolvedValue({ data: { data: { score: 100 } } });

      const savedState = {
        quizId: 'q1',
        answers: { qq1: '4', qq2: '6' },
        currentQuestionIndex: 1,
        startedAt: Date.now(),
      };
      localStorage.setItem('quiz_progress_q1', JSON.stringify(savedState));

      renderQuiz();

      fireEvent.click(await screen.findByText('What is 2+2?'));
      fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }));

      await waitFor(() => {
        expect(localStorage.getItem('quiz_progress_q1')).toBeNull();
      });
    });
  });
});


