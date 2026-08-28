import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ExportDeckDropdown from './ExportDeckDropdown';
import API from '../../services/api';

vi.mock('../../services/api.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ExportDeckDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and opens dropdown options', async () => {
    API.get.mockResolvedValue({ data: { success: true, data: [] } });
    render(<ExportDeckDropdown subjectId="subj-1" />);

    const button = screen.getByRole('button', { name: /Deck Actions/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    // Options should show up
    expect(screen.getByText('Plain CSV')).toBeInTheDocument();
    expect(screen.getByText('Structured JSON')).toBeInTheDocument();
    expect(screen.getByText('Anki (.apkg)')).toBeInTheDocument();
    expect(screen.getByText('Publish to Market')).toBeInTheDocument();
  });

  it('toggles sharing state on click and updates backend', async () => {
    // Mock get subjects returning the subject as private
    API.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'subj-1', name: 'Math', isPublic: false }],
      },
    });

    API.put.mockResolvedValue({
      data: {
        success: true,
        data: { id: 'subj-1', name: 'Math', isPublic: true },
      },
    });

    render(<ExportDeckDropdown subjectId="subj-1" />);

    // Wait for the share state fetch to finish
    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/subjects');
    });

    const button = screen.getByRole('button', { name: /Deck Actions/i });
    fireEvent.click(button);

    const publishBtn = screen.getByText('Publish to Market');
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/flashcards/decks/subj-1/share', { isPublic: true });
    });
  });
});

