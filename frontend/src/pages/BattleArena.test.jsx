import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BattleArena from './BattleArena';
import { socket } from '../services/socket';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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
  useSelector: vi.fn(() => ({ user: { name: 'TestPlayer' } })),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({})),
  useNavigate: vi.fn(),
}));

vi.mock('../utils/confetti', () => ({
  triggerConfetti: vi.fn(),
}));

const emitHandlers = {};

const captureSocketHandlers = () => {
  socket.on.mockImplementation((event, callback) => {
    emitHandlers[event] = callback;
  });
};

const joinSuccess = {
  success: true,
  roomId: 'ABCDEF',
  room: { id: 'ABCDEF', name: 'Battle Room', password: '' },
  isPrivate: false,
};

describe('BattleArena Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(emitHandlers).forEach((key) => delete emitHandlers[key]);
    useSelector.mockReturnValue({ user: { name: 'TestPlayer' } });
    socket.emit.mockImplementation(() => undefined);
  });

  it('renders the join-by-code landing view when not routed to a room', () => {
    useParams.mockReturnValue({});
    render(<BattleArena />);

    expect(screen.getByText('Battle Arena')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join lobby/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new lobby/i })).toBeInTheDocument();
  });

  it('joins a lobby by entering a room code', async () => {
    useParams.mockReturnValue({});
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'join-room' && callback) callback(joinSuccess);
    });

    render(<BattleArena />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), {
      target: { value: 'abcdef' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join lobby/i }));

    await waitFor(() => {
      expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    });

    const joinEmit = socket.emit.mock.calls.find(([event]) => event === 'join-room');
    expect(joinEmit[1].roomId).toBe('ABCDEF');
    expect(joinEmit[1].username).toBe('TestPlayer');
  });

  it('shows an error when the room code is unknown', async () => {
    useParams.mockReturnValue({});
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'join-room' && callback) {
        callback({
          success: false,
          message: 'Room ZZZZZZ not found. Check the code and try again.',
        });
      }
    });

    render(<BattleArena />);

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), {
      target: { value: 'zzzzzz' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join lobby/i }));

    await waitFor(() => {
      expect(screen.getByText(/Room ZZZZZZ not found/i)).toBeInTheDocument();
    });
  });

  it('creates a lobby from the modal with a server-generated code', async () => {
    useParams.mockReturnValue({});
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'create-room' && callback) {
        callback({
          success: true,
          roomId: 'K8M2PQ',
          room: { id: 'K8M2PQ', name: 'My Room', password: '' },
          isPrivate: false,
        });
      }
    });

    render(<BattleArena />);

    fireEvent.click(screen.getByRole('button', { name: /create new lobby/i }));
    expect(screen.getByText('Create a New Lobby')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('My Battle Room'), {
      target: { value: 'My Room' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(screen.getByText('K8M2PQ')).toBeInTheDocument();
    });

    const createEmit = socket.emit.mock.calls.find(([event]) => event === 'create-room');
    expect(createEmit[1].roomId).toBeUndefined();
    expect(createEmit[1].roomName).toBe('My Room');
  });

  it('shows an error inside the create modal when creation fails', async () => {
    useParams.mockReturnValue({});
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'create-room' && callback) {
        callback({
          success: false,
          message: 'Room code ABCDEF is already in use. Try joining it instead.',
        });
      }
    });

    render(<BattleArena />);
    fireEvent.click(screen.getByRole('button', { name: /create new lobby/i }));
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(screen.getByText(/already in use/i)).toBeInTheDocument();
    });
  });

  it('renders the lobby after joining, then finishes the battle and triggers confetti', async () => {
    useParams.mockReturnValue({ roomId: 'ABCDEF' });
    captureSocketHandlers();
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'join-room' && callback) callback(joinSuccess);
    });

    render(<BattleArena />);

    await waitFor(() => {
      expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    });
    expect(screen.getByText(/Lobby:/i)).toBeInTheDocument();

    emitHandlers.room_update({
      players: {
        'socket-1': { username: 'Player One', score: 0, isReady: true, online: true },
        'socket-2': { username: 'Player Two', score: 0, isReady: true, online: true },
      },
      status: 'finished',
    });

    await waitFor(() => {
      expect(screen.getByText('Battle Finished!')).toBeInTheDocument();
    });
    expect(triggerConfetti).toHaveBeenCalled();
  });

  it('updates the live leaderboard scores during play', async () => {
    useParams.mockReturnValue({ roomId: 'ABCDEF' });
    captureSocketHandlers();
    socket.emit.mockImplementation((event, payload, callback) => {
      if (event === 'join-room' && callback) callback(joinSuccess);
    });

    render(<BattleArena />);

    await waitFor(() => {
      expect(screen.getByText(/Lobby:/i)).toBeInTheDocument();
    });

    emitHandlers.room_update({
      players: {
        'socket-1': { username: 'Player One', score: 0, isReady: true, online: true },
        'socket-2': { username: 'Player Two', score: 0, isReady: true, online: true },
      },
      status: 'playing',
    });

    emitHandlers.score_update({
      players: {
        'socket-1': { username: 'Player One', score: 30, isReady: true, online: true },
        'socket-2': { username: 'Player Two', score: 10, isReady: true, online: true },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Live Scores:')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });
});
