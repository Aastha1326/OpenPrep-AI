const createSyncHandler = require('../../sockets/noteSyncHandler');
const otSyncService = require('../../services/otSyncService');

describe('OT WebSocket Sync Room Handler', () => {
  let mockIo, mockSocket, registeredEvents;

  beforeEach(() => {
    vi.restoreAllMocks();
    createSyncHandler.activeParticipants.clear();

    registeredEvents = {};
    mockSocket = {
      id: 'socket-444',
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
      data: {},
      on: vi.fn((event, cb) => {
        registeredEvents[event] = cb;
      }),
    };

    mockIo = {
      of: vi.fn().mockReturnThis(),
      on: vi.fn((event, cb) => {
        if (event === 'connection') {
          cb(mockSocket);
        }
      }),
      to: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    createSyncHandler(mockIo);
  });

  test('on connection binds events and joins collab room', async () => {
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(registeredEvents['ot:join_room']).toBeDefined();

    await registeredEvents['ot:join_room']({
      noteId: 'note-789',
      user: { name: 'Alice' },
    });

    expect(mockSocket.join).toHaveBeenCalledWith('note-789');
    expect(mockSocket.data.noteId).toBe('note-789');
    expect(mockSocket.data.user.name).toBe('Alice');
    expect(mockSocket.to).toHaveBeenCalledWith('note-789');
    expect(mockSocket.emit).not.toHaveBeenCalledWith('ot:error');

    const participants = createSyncHandler.activeParticipants.get('note-789');
    expect(participants).toBeDefined();
    expect(participants.has('socket-444')).toBe(true);
  });

  test('on edit processes operation transformation, triggers ack and emits edit to collaborators', async () => {
    expect(registeredEvents['ot:edit']).toBeDefined();

    mockSocket.data.noteId = 'note-789';

    vi.spyOn(otSyncService, 'processEdit').mockResolvedValue({
      revision: 5,
      op: [{ retain: 2 }, { insert: 't' }],
      content: 'cat',
    });

    const callback = vi.fn();
    await registeredEvents['ot:edit'](
      { noteId: 'note-789', revision: 4, op: [{ retain: 2 }, { insert: 't' }] },
      callback
    );

    expect(otSyncService.processEdit).toHaveBeenCalledWith(
      'note-789',
      4,
      [{ retain: 2 }, { insert: 't' }],
      'socket-444'
    );
    expect(callback).toHaveBeenCalledWith({ success: true, revision: 5 });
    expect(mockSocket.to).toHaveBeenCalledWith('note-789');
    expect(mockSocket.emit).toHaveBeenCalledWith('ot:edited', expect.objectContaining({
      revision: 5,
      content: 'cat',
    }));
  });

  test('on cursor relays selection coordinates', () => {
    expect(registeredEvents['ot:cursor']).toBeDefined();

    mockSocket.data.noteId = 'note-789';
    mockSocket.data.user = { name: 'Alice' };

    registeredEvents['ot:cursor']({ noteId: 'note-789', selection: { anchor: 2, head: 5 } });

    expect(mockSocket.to).toHaveBeenCalledWith('note-789');
    expect(mockSocket.emit).toHaveBeenCalledWith('ot:cursor_moved', expect.objectContaining({
      senderSocketId: 'socket-444',
      selection: { anchor: 2, head: 5 },
    }));
  });
});
