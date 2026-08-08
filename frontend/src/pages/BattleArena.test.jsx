import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BattleArena from './BattleArena';
import { socket } from '../services/socket';
import { triggerConfetti } from '../utils/confetti';

vi.mock('../services/socket', () => ({
  socket: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  },
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(() => ({ name: 'TestPlayer' })),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ roomId: 'ROOM123' })),
  useNavigate: vi.fn(),
}));

vi.mock('../utils/confetti', () => ({
  triggerConfetti: vi.fn(),
}));

describe('BattleArena Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and connects to sockets, then triggers confetti when battle completes', async () => {
    let roomUpdateCallback;
    
    // Intercept socket.on to grab the room_update listener
    socket.on.mockImplementation((event, callback) => {
      if (event === 'room_update') {
        roomUpdateCallback = callback;
      }
    });

    render(<BattleArena />);

    // Fast-forward useEffect to trigger state callbacks
    expect(socket.connect).toHaveBeenCalled();

    // Trigger lobby setup via socket callback
    if (roomUpdateCallback) {
      roomUpdateCallback({
        players: {
          'socket-1': { username: 'Player One', score: 0, isReady: true, online: true },
          'socket-2': { username: 'Player Two', score: 0, isReady: true, online: true },
        },
        status: 'finished',
      });
    }

    // Verify finished header and winner
    await waitFor(() => {
      expect(screen.getByText('Battle Finished!')).toBeInTheDocument();
    });
    expect(triggerConfetti).toHaveBeenCalled();
  });
});
