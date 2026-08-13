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
});
