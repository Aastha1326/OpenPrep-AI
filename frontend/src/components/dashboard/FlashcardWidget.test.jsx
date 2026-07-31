import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FlashcardWidget from './FlashcardWidget';

// Sample flashcard data matching the expected shape
const sampleFlashcard = {
  front: 'What is React?',
  back: 'A JavaScript library for building user interfaces',
};

// FlashcardWidget uses useNavigate, so it must be rendered inside a Router
const renderWidget = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('FlashcardWidget', () => {
  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  test('should display loading shimmer when loading is true', () => {
    renderWidget(<FlashcardWidget loading={true} />);
    // Shimmer elements are divs with animate-pulse class
    const shimmers = document.querySelectorAll('.animate-pulse');
    expect(shimmers.length).toBeGreaterThan(0);
  });

  test('should display error state with retry button', () => {
    const handleRetry = vi.fn();
    renderWidget(<FlashcardWidget error="Failed to load" onRetry={handleRetry} />);
    expect(screen.getByText('Could not load cards')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test('should display empty state when no flashcard and no due cards', () => {
    renderWidget(<FlashcardWidget flashcard={null} totalDue={0} />);
    expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
  });

  test('should display empty state when flashcard is null but cards are due', () => {
    renderWidget(<FlashcardWidget flashcard={null} totalDue={5} />);
    expect(screen.getByText('No due flashcards')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Flip behavior
  // ---------------------------------------------------------------------------

  test('should render the front of the card by default', () => {
    renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('Click to flip')).toBeInTheDocument();
  });

  test('should toggle to back when clicked', () => {
    renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);

    // Click the card container to flip
    const cardContainer = screen.getByText('What is React?').closest('.perspective-1000');
    fireEvent.click(cardContainer);

    // After flip, the answer text appears
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
  });

  test('should flip back when clicked again', () => {
    renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);

    // Flip to back
    const cardContainer = screen.getByText('What is React?').closest('.perspective-1000');
    fireEvent.click(cardContainer);
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();

    // Click again to flip back
    fireEvent.click(cardContainer);
    expect(screen.getByText('What is React?')).toBeInTheDocument();
  });

  test('should reset flip state when flashcard prop changes', () => {
    const { rerender } = renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);

    // Flip card
    const cardContainer = screen.getByText('What is React?').closest('.perspective-1000');
    fireEvent.click(cardContainer);
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();

    // Re-render with a new flashcard (simulating cycling to next card)
    const nextFlashcard = {
      front: 'What is JSX?',
      back: 'A syntax extension for JavaScript',
    };
    rerender(<MemoryRouter><FlashcardWidget flashcard={nextFlashcard} /></MemoryRouter>);

    // Should show front of new card
    expect(screen.getByText('What is JSX?')).toBeInTheDocument();
    // Back of old card should not be visible
    expect(screen.queryByText('A JavaScript library for building user interfaces')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Total due display
  // ---------------------------------------------------------------------------

  test('should show total due count when multiple cards are due', () => {
    renderWidget(<FlashcardWidget flashcard={sampleFlashcard} totalDue={3} />);
    expect(screen.getByText('(3 due)')).toBeInTheDocument();
  });

  test('should not show count when only one card is due', () => {
    renderWidget(<FlashcardWidget flashcard={sampleFlashcard} totalDue={1} />);
    expect(screen.queryByText('(1 due)')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Audio Reader (TTS) Tests
  // ---------------------------------------------------------------------------

  describe('Audio Reader (TTS)', () => {
    let mockSpeak;
    let mockCancel;

    beforeEach(() => {
      mockSpeak = vi.fn();
      mockCancel = vi.fn();

      window.speechSynthesis = {
        speak: mockSpeak,
        cancel: mockCancel,
      };

      window.SpeechSynthesisUtterance = vi.fn().mockImplementation(function (text) {
        this.text = text;
        this.rate = 1;
        this.onend = null;
        this.onerror = null;
      });
    });

    test('should render audio read aloud button and rate toggle button', () => {
      renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);
      expect(screen.getAllByLabelText('Read question aloud')[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText('Speech rate: 1x')[0]).toBeInTheDocument();
    });

    test('should trigger speech synthesis with front text when speak button is clicked', () => {
      renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);
      const speakBtn = screen.getAllByLabelText('Read question aloud')[0];

      fireEvent.click(speakBtn);

      expect(mockCancel).toHaveBeenCalled();
      expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('What is React?');
      expect(mockSpeak).toHaveBeenCalledTimes(1);
    });

    test('should toggle speech rate (0.75x -> 1x -> 1.25x)', () => {
      renderWidget(<FlashcardWidget flashcard={sampleFlashcard} />);
      const rateBtn = screen.getAllByLabelText('Speech rate: 1x')[0];

      fireEvent.click(rateBtn);
      expect(screen.getAllByLabelText('Speech rate: 1.25x')[0]).toBeInTheDocument();

      fireEvent.click(rateBtn);
      expect(screen.getAllByLabelText('Speech rate: 0.75x')[0]).toBeInTheDocument();

      fireEvent.click(rateBtn);
      expect(screen.getAllByLabelText('Speech rate: 1x')[0]).toBeInTheDocument();
    });

    test('should cancel speech when rating buttons are clicked', () => {
      const handleReview = vi.fn();
      renderWidget(<FlashcardWidget flashcard={sampleFlashcard} onReview={handleReview} />);

      // Flip card to back
      const cardContainer = screen.getByText('What is React?').closest('.perspective-1000');
      fireEvent.click(cardContainer);

      // Click rating button
      const easyBtn = screen.getByTitle('Easy');
      fireEvent.click(easyBtn);

      expect(mockCancel).toHaveBeenCalled();
      expect(handleReview).toHaveBeenCalledWith(5);
    });
  });
});
