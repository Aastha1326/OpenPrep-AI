const initializeStudyRoomSockets = require('../../sockets/studyRoomSocket');
const redisService = require('../../services/redisService');

describe('Collaborative Study Room Socket Handlers', () => {
  let ioMock;
  let socketMock;
  let onConnectionCallback;
  let registeredEvents;

  beforeEach(() => {
    vi.restoreAllMocks();
    redisService.isReady = false;
    registeredEvents = {};

    socketMock = {
      id: 'socket-123',
      join: vi.fn(),
      to: vi.fn().mockImplementation(() => ({
        emit: (event, data) => {
          if (registeredEvents[event]) {
            registeredEvents[event](data);
          }
        }
      })),
      emit: vi.fn(),
      data: {},
      on: vi.fn().mockImplementation((event, callback) => {
        registeredEvents[event] = callback;
      }),
    };

    ioMock = {
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'connection') {
          onConnectionCallback = callback;
        }
      }),
      to: vi.fn().mockImplementation(() => ({
        emit: vi.fn()
      })),
    };

    initializeStudyRoomSockets(ioMock);
    if (onConnectionCallback) {
      onConnectionCallback(socketMock);
    }
  });

  it('should register connection handler and join room with state sync', async () => {
    expect(ioMock.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('join_room', expect.any(Function));

    const joinRoomHandler = registeredEvents['join_room'];
    expect(joinRoomHandler).toBeDefined();

    // Trigger join_room (local fallback mode)
    await joinRoomHandler({ roomId: 'room-abc', username: 'StudiousStudent' });

    expect(socketMock.join).toHaveBeenCalledWith('room-abc');
    expect(socketMock.data.roomId).toBe('room-abc');
    expect(socketMock.data.username).toBe('StudiousStudent');

    // Should emit state sync containing joined user
    expect(socketMock.emit).toHaveBeenCalledWith('room_state_sync', expect.objectContaining({
      users: expect.arrayContaining([
        expect.objectContaining({ id: 'socket-123', username: 'StudiousStudent' })
      ]),
      whiteboard: []
    }));
  });

  it('should store drawing strokes and broadcast to room peers', async () => {
    const joinRoomHandler = registeredEvents['join_room'];
    const drawStrokeHandler = registeredEvents['draw_stroke'];

    await joinRoomHandler({ roomId: 'room-abc', username: 'Artist' });

    const stroke = { x: 10, y: 20, color: '#ff0000', width: 5 };
    const toSpy = vi.spyOn(socketMock, 'to');

    await drawStrokeHandler({ roomId: 'room-abc', strokeData: stroke });

    expect(toSpy).toHaveBeenCalledWith('room-abc');
  });

  it('should support clearing the whiteboard', async () => {
    const joinRoomHandler = registeredEvents['join_room'];
    const clearWhiteboardHandler = registeredEvents['clear_whiteboard'];

    await joinRoomHandler({ roomId: 'room-abc', username: 'Artist' });

    const toSpy = vi.spyOn(socketMock, 'to');
    await clearWhiteboardHandler({ roomId: 'room-abc' });

    expect(toSpy).toHaveBeenCalledWith('room-abc');
  });

  it('should clean up user and broadcast exit on disconnect', async () => {
    const joinRoomHandler = registeredEvents['join_room'];
    const disconnectHandler = registeredEvents['disconnect'];

    await joinRoomHandler({ roomId: 'room-abc', username: 'LeavingSoon' });

    const toSpy = vi.spyOn(socketMock, 'to');
    await disconnectHandler();

    expect(toSpy).toHaveBeenCalledWith('room-abc');
  });

  it('should query Redis for state if Redis is active', async () => {
    redisService.isReady = true;
    redisService.client = {
      hgetall: vi.fn().mockResolvedValue({
        'socket-999': JSON.stringify({ id: 'socket-999', username: 'RedisUser' })
      }),
      hset: vi.fn().mockResolvedValue(1),
      hdel: vi.fn().mockResolvedValue(1),
      lrange: vi.fn().mockResolvedValue([
        JSON.stringify({ x: 5, y: 5 })
      ]),
      rpush: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
    };

    const joinRoomHandler = registeredEvents['join_room'];
    await joinRoomHandler({ roomId: 'room-redis', username: 'ActiveUser' });

    expect(redisService.client.hset).toHaveBeenCalled();
    expect(redisService.client.hgetall).toHaveBeenCalled();
    expect(redisService.client.lrange).toHaveBeenCalled();

    redisService.isReady = false;
    redisService.client = null;
  });
});
