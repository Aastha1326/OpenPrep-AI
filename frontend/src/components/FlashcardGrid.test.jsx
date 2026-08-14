import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashcardGrid from './FlashcardGrid';
import { describe, test, expect, beforeAll } from 'vitest';

describe('FlashcardGrid and FlashcardCard', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  const mockFlashcards = [
    { id: '1', front: 'Front 1', back: 'Back 1' },
    { id: '2', front: 'Front 2', back: 'Back 2' },
    { id: '3', front: 'Front 3', back: 'Back 3' },
  ];

  test('renders virtualized grid with cards', () => {
    render(<FlashcardGrid flashcards={mockFlashcards} />);
    expect(screen.getByText('Front 1')).toBeInTheDocument();
  });

  test('filters cards based on searchVal query', () => {
    render(<FlashcardGrid flashcards={mockFlashcards} searchVal="Front 2" />);
    expect(screen.queryByText('Front 1')).not.toBeInTheDocument();
    expect(screen.getByText('Front 2')).toBeInTheDocument();
  });

  test('flips individual card on click', () => {
    render(<FlashcardGrid flashcards={mockFlashcards} />);
    const card = screen.getByText('Front 1');
    fireEvent.click(card);
    expect(screen.getByText('Back 1')).toBeInTheDocument();
  });

  test('renders video playback badge and opens modal player on click', () => {
    const cardsWithVideo = [
      { id: '4', front: 'Front Video', back: 'Back Video', sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ', timestampSeconds: 120 },
    ];
    render(<FlashcardGrid flashcards={cardsWithVideo} />);

    // 120 seconds -> 2:00
    const badge = screen.getByRole('button', { name: /2:00/i });
    expect(badge).toBeInTheDocument();

    // Click badge to launch reference video modal
    fireEvent.click(badge);
    expect(screen.getByTitle('YouTube Reference Clip')).toBeInTheDocument();
  });
});
