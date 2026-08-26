import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import API from '../../services/api';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('CommandPalette Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('combobox')).toBeNull();
  });

  test('renders input and triggers search API when open', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          topics: [{ id: 'topic-1', name: 'Quantum Physics' }],
          decks: [{ id: 'deck-1', name: 'Formula list' }],
          quizzes: [],
          tasks: [],
        },
      },
    });

    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'quantum' } });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/search?q=quantum');
    });

    expect(await screen.findByText('Quantum Physics')).toBeInTheDocument();
    expect(screen.getByText('Formula list')).toBeInTheDocument();
  });

  test('handles keyboard arrow navigation and entry selection', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          topics: [
            { id: 'topic-1', name: 'Mechanics' },
            { id: 'topic-2', name: 'Electromagnetism' },
          ],
          decks: [],
          quizzes: [],
          tasks: [],
        },
      },
    });

    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'physics' } });

    await waitFor(() => {
      expect(screen.getByText('Mechanics')).toBeInTheDocument();
    });

    // Press ArrowDown to select Electromagnetism
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    const secondOption = screen.getByText('Electromagnetism').closest('[role="option"]');
    expect(secondOption).toHaveAttribute('aria-selected', 'true');
  });

  test('triggers onClose when escape key is pressed', () => {
    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={mockOnClose} />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });
});

