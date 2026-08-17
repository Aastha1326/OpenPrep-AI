import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CommunityDecksModal from './CommunityDecksModal';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('CommunityDecksModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CommunityDecksModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders loading state on open', () => {
    API.get.mockReturnValue(new Promise(() => {}));
    render(<CommunityDecksModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Scanning community marketplace...')).toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    API.get.mockRejectedValue(new Error('API failure'));
    render(<CommunityDecksModal isOpen={true} onClose={vi.fn()} />);
    expect(await screen.findByText('Could not load community decks. Please try again.')).toBeInTheDocument();
  });

  it('renders community decks list and allows cloning', async () => {
    const mockDecks = [
      {
        id: 'deck-1',
        name: 'Organic Chemistry',
        description: 'Advanced chemistry cards',
        rating: 4.8,
        tags: ['Chemistry', 'Pre-Med'],
        cardCount: 45,
        cloneCount: 120,
        ownerName: 'Alice',
        examName: 'MCAT',
      },
    ];

    API.get.mockResolvedValue({ data: { success: true, data: mockDecks } });
    API.post.mockResolvedValue({ data: { success: true } });

    render(<CommunityDecksModal isOpen={true} onClose={vi.fn()} />);

    // Marketplace title check
    expect(await screen.findByText('Community Flashcard Marketplace')).toBeInTheDocument();

    // Check deck metadata
    expect(screen.getByText('Organic Chemistry')).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/MCAT/)).toBeInTheDocument();
    expect(screen.getByText(/45/)).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();

    // Perform clone operation
    const cloneBtn = screen.getByRole('button', { name: /Clone Deck/i });
    fireEvent.click(cloneBtn);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/flashcards/decks/deck-1/clone', {});
    });
  });

  it('allows user to star a community deck', async () => {
    const mockDecks = [
      {
        id: 'deck-1',
        name: 'Organic Chemistry',
        description: 'Advanced chemistry cards',
        rating: 4.8,
        starCount: 5,
        tags: ['Chemistry'],
        cardCount: 45,
        cloneCount: 120,
        ownerName: 'Alice',
        examName: 'MCAT',
      },
    ];

    API.get.mockResolvedValue({ data: { success: true, data: mockDecks } });
    API.post.mockResolvedValue({ data: { success: true } });

    render(<CommunityDecksModal isOpen={true} onClose={vi.fn()} />);

    const starBtn = await screen.findByTitle('Star this deck');
    fireEvent.click(starBtn);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/flashcards/decks/deck-1/star', {});
    });
  });

  it('allows user to rate a community deck', async () => {
    const mockDecks = [
      {
        id: 'deck-1',
        name: 'Organic Chemistry',
        description: 'Advanced chemistry cards',
        rating: 4.8,
        starCount: 5,
        tags: ['Chemistry'],
        cardCount: 45,
        cloneCount: 120,
        ownerName: 'Alice',
        examName: 'MCAT',
      },
    ];

    API.get.mockResolvedValue({ data: { success: true, data: mockDecks } });
    API.post.mockResolvedValue({ data: { success: true } });

    render(<CommunityDecksModal isOpen={true} onClose={vi.fn()} />);

    const rateBtns = await screen.findAllByTitle(/Rate \d Stars/);
    // Click on the 5-star rate button
    fireEvent.click(rateBtns[4]);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/flashcards/decks/deck-1/rate', { rating: 5 });
    });
  });
});
