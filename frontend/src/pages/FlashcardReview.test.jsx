import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FlashcardReview from './FlashcardReview';
import API from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const sampleCards = [
  { id: 'c1', front: 'What is React?', back: 'A UI library', interval: 1, repetitions: 0, efactor: 2.5 },
  { id: 'c2', front: 'What is Redux?', back: 'A state container', interval: 1, repetitions: 0, efactor: 2.5 },
  { id: 'c3', front: 'What is JSX?', back: 'HTML-like syntax', interval: 1, repetitions: 0, efactor: 2.5 },
];

const renderReview = () =>
  render(
    <MemoryRouter initialEntries={['/flashcards/review']}>
      <FlashcardReview />
    </MemoryRouter>
  );

const flipCurrentCard = async (frontText) => {
  fireEvent.click(await screen.findByText(frontText));
};

describe('FlashcardReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    API.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: {
            success: true,
            user: {
              sm2EasyFactorModifier: 1.0,
              sm2IntervalModifier: 1.0,
              sm2Step1Interval: 1,
              sm2Step2Interval: 6,
            }
          }
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  test('shows loading state while fetching due cards', () => {
    API.get.mockReturnValue(new Promise(() => {}));
    renderReview();
    expect(screen.getByText(/Loading your review queue/)).toBeInTheDocument();
  });

  test('shows error message when fetching due cards fails', async () => {
    API.get.mockRejectedValue(new Error('network error'));
    renderReview();
    expect(await screen.findByText('Failed to fetch due flashcards.')).toBeInTheDocument();
  });

  test('renders the first due card after loading', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    renderReview();
    expect(await screen.findByText('What is React?')).toBeInTheDocument();
  });

  test('saves each rating via API.put and advances to the next card', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    API.put.mockResolvedValue({ data: { data: { id: 'c1' } } });

    renderReview();
    await flipCurrentCard('What is React?');
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/flashcards/c1/review', { quality: 4 });
    });
    expect(await screen.findByText('What is Redux?')).toBeInTheDocument();
  });

  test('does not advance to the next card when the rating fails to save', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    API.put.mockRejectedValue(new Error('network error'));

    renderReview();
    await flipCurrentCard('What is React?');
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));

    expect(await screen.findByText(/Could not save this rating/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(API.put).toHaveBeenCalledTimes(3);
  });

  test('keeps a dismissed save error but stays on the current card', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    API.put.mockRejectedValue(new Error('network error'));

    renderReview();
    await flipCurrentCard('What is React?');
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));

    const dismissBtn = await screen.findByRole('button', { name: /dismiss/i }, { timeout: 4000 });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Could not save this rating/)).not.toBeInTheDocument();
    });
    expect(screen.getByText('What is React?')).toBeInTheDocument();
  });

  test('persists a session checkpoint after each rating', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    API.put.mockResolvedValue({ data: { data: { id: 'c1' } } });

    renderReview();
    await flipCurrentCard('What is React?');
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));

    await waitFor(() => {
      const parsed = JSON.parse(sessionStorage.getItem('flashcardReviewSession'));
      expect(parsed.currentIndex).toBe(1);
      expect(parsed.cards).toHaveLength(3);
      expect(parsed.sessionStats.reviewed).toBe(1);
      expect(parsed.sessionStats.mastered).toBe(1);
    });
  });

  test('restores an in-progress session on mount without refetching', async () => {
    sessionStorage.setItem(
      'flashcardReviewSession',
      JSON.stringify({
        cards: sampleCards,
        currentIndex: 1,
        sessionStats: { reviewed: 1, mastered: 1, hard: 0 },
        savedAt: Date.now(),
      })
    );

    renderReview();
    expect(await screen.findByText('What is Redux?')).toBeInTheDocument();
    expect(API.get).not.toHaveBeenCalledWith(expect.stringContaining('/flashcards'));
  });

  test('clears the saved session once the queue is complete', async () => {
    sessionStorage.setItem(
      'flashcardReviewSession',
      JSON.stringify({
        cards: sampleCards,
        currentIndex: 2,
        sessionStats: { reviewed: 2, mastered: 2, hard: 0 },
        savedAt: Date.now(),
      })
    );
    API.put.mockResolvedValue({ data: { data: { id: 'c3' } } });

    renderReview();
    await flipCurrentCard('What is JSX?');
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));

    expect(await screen.findByText('Session Complete')).toBeInTheDocument();
    expect(sessionStorage.getItem('flashcardReviewSession')).toBeNull();
  });

  test('Exit Session clears the saved checkpoint before navigating away', async () => {
    sessionStorage.setItem(
      'flashcardReviewSession',
      JSON.stringify({
        cards: sampleCards,
        currentIndex: 1,
        sessionStats: { reviewed: 1, mastered: 0, hard: 0 },
        savedAt: Date.now(),
      })
    );

    renderReview();
    await screen.findByText('What is Redux?');
    fireEvent.click(screen.getByRole('button', { name: /Exit Session/i }));

    expect(sessionStorage.getItem('flashcardReviewSession')).toBeNull();
  });

  test('supports flipping and rating via keyboard', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });
    API.put.mockResolvedValue({ data: { data: { id: 'c1' } } });

    renderReview();
    await screen.findByText('What is React?');

    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: '4' });

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/flashcards/c1/review', { quality: 4 });
    });
    expect(await screen.findByText('What is Redux?')).toBeInTheDocument();
  });

  test('disables rating buttons and ignores rapid clicks while a review is pending', async () => {
    API.get.mockResolvedValue({ data: { data: sampleCards } });

    // Keep the API.put request pending so we can observe the in-flight state.
    let resolvePut;
    API.put.mockImplementationOnce(() => new Promise((resolve) => { resolvePut = resolve; }));

    renderReview();
    await screen.findByText('What is React?');

    // Flip the card and start a review that stays pending.
    fireEvent.keyDown(window, { key: ' ' });
    const goodButton = screen.getByRole('button', { name: 'Good' });
    fireEvent.click(goodButton);

    // Rating buttons are disabled while the request is pending...
    await waitFor(() => expect(goodButton).toBeDisabled());

    // ...so rapid keyboard input is debounced and only one request fires.
    fireEvent.keyDown(window, { key: '4' });
    fireEvent.keyDown(window, { key: '5' });
    await waitFor(() => expect(API.put).toHaveBeenCalledTimes(1));
    expect(API.put).toHaveBeenCalledWith('/flashcards/c1/review', { quality: 4 });

    // Resolving the request advances to the next card and re-enables buttons.
    resolvePut({ data: { data: { id: 'c1' } } });
    expect(await screen.findByText('What is Redux?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeEnabled();
  });
});
