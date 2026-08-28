import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PublicShare from './PublicShare';
import API from '../services/api';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createStore = (isAuthenticated = false) =>
  configureStore({
    reducer: {
      auth: (state = { isAuthenticated }) => state,
    },
  });

describe('PublicShare Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches and renders shared deck details and handles card carousel flips', async () => {
    const mockDeckData = {
      deck: {
        id: 'deck-123',
        name: 'Organic Chemistry II',
        cloneCount: 5,
        ownerName: 'Nishit Doshi',
      },
      cards: [
        { id: 'card-1', front: 'Functional Group of Alcohol', back: '-OH', hint: 'Oxygen & Hydrogen' },
        { id: 'card-2', front: 'What is Ketone?', back: 'C=O double bond in middle' },
      ],
    };

    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockDeckData,
      },
    });

    const store = createStore(true);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/share/token-xyz']}>
          <Routes>
            <Route path="/share/:token" element={<PublicShare />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Verify loading state renders first
    expect(screen.getByText(/Fetching public study/i)).toBeInTheDocument();

    // Wait for API response to render
    const deckName = await screen.findByText('Organic Chemistry II');
    expect(deckName).toBeInTheDocument();
    expect(screen.getByText('Functional Group of Alcohol')).toBeInTheDocument();

    // Click card to flip
    const flipPrompt = screen.getByText(/Click card to flip/i);
    fireEvent.click(flipPrompt);
    expect(screen.getByText('-OH')).toBeInTheDocument();
    expect(screen.getByText('Hint: Oxygen & Hydrogen')).toBeInTheDocument();
  });

  test('shows redirect to login when unauthenticated user clicks clone', async () => {
    const mockDeckData = {
      deck: { id: 'deck-123', name: 'Math Deck', cloneCount: 0, ownerName: 'Aryan' },
      cards: [{ id: 'card-1', front: '1+1', back: '2' }],
    };

    API.get.mockResolvedValueOnce({
      data: { success: true, data: mockDeckData },
    });

    const store = createStore(false); // Unauthenticated
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/share/token-xyz']}>
          <Routes>
            <Route path="/share/:token" element={<PublicShare />} />
            <Route path="/login" element={<div>Mock Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    const cloneButton = await screen.findByText('Login to Clone');
    fireEvent.click(cloneButton);

    await waitFor(() => {
      expect(screen.getByText('Mock Login Page')).toBeInTheDocument();
    });
  });
});

