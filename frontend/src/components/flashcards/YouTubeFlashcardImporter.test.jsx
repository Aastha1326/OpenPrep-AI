import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import YouTubeFlashcardImporter from './YouTubeFlashcardImporter';
import API from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    post: vi.fn(),
  },
}));

describe('YouTubeFlashcardImporter Component tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dialog form elements when isOpen is true', async () => {
    render(<YouTubeFlashcardImporter isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('YouTube Flashcard Generator')).toBeInTheDocument();
    expect(screen.getByLabelText(/youtube video url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /extract ai flashcards/i })).toBeInTheDocument();
  });

  test('extracts video ID and displays iframe preview on valid URL input', async () => {
    render(<YouTubeFlashcardImporter isOpen={true} onClose={() => {}} />);

    const input = screen.getByLabelText(/youtube video url/i);
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    // Wait for the iframe to render with correct embed url
    const iframe = screen.getByTitle('YouTube Video Preview');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0');
  });

  test('triggers generation and displays success screen on successful response', async () => {
    API.post.mockResolvedValueOnce({
      data: {
        success: true,
        count: 5,
        data: [],
      },
    });

    render(<YouTubeFlashcardImporter isOpen={true} onClose={() => {}} onImported={() => {}} />);

    const input = screen.getByLabelText(/youtube video url/i);
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    const submitBtn = screen.getByRole('button', { name: /extract ai flashcards/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Import Successful!')).toBeInTheDocument();
      expect(screen.getByText(/generated and saved/i)).toBeInTheDocument();
    });

    expect(API.post).toHaveBeenCalledWith('/flashcards/from-youtube', {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      subjectId: null,
      count: 10,
    });
  });
});
