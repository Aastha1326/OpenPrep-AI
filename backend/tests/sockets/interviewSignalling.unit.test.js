const createSignallingHandler = require('../../sockets/interviewSignalling');
const redisService = require('../../services/redisService');
const audioStreamProcessor = require('../../services/audioStreamProcessor');

describe('WebRTC Signalling Gateway Socket Namespace', () => {
  let mockIo, mockSocket, registeredEvents;

  beforeEach(() => {
    vi.restoreAllMocks();
    createSignallingHandler.localActiveRooms.clear();

    registeredEvents = {};
    mockSocket = {
      id: 'socket-999',
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

    // Initialize signalling handler
    createSignallingHandler(mockIo);
  });

  test('should bind connection events and handle room registration', async () => {
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(registeredEvents['join-room']).toBeDefined();

    // Trigger join-room event
    redisService.isReady = false; // test local map fallback
    await registeredEvents['join-room']({
      roomId: 'room-abc',
      userId: 'user-xyz',
      userName: 'Candidate Alpha',
    });

    expect(mockSocket.join).toHaveBeenCalledWith('room-abc');
    expect(mockSocket.data.roomId).toBe('room-abc');
    expect(mockSocket.data.userId).toBe('user-xyz');
    expect(mockSocket.to).toHaveBeenCalledWith('room-abc');
    expect(mockSocket.emit).toHaveBeenCalledWith('current-peers', []);

    const peerMap = createSignallingHandler.localActiveRooms.get('room-abc');
    expect(peerMap).toBeDefined();
    expect(peerMap.has('socket-999')).toBe(true);
  });

  test('should relay WebRTC offer/answer/ICE parameters correctly', () => {
    expect(registeredEvents['send-offer']).toBeDefined();
    expect(registeredEvents['send-answer']).toBeDefined();
    expect(registeredEvents['send-ice-candidate']).toBeDefined();

    // Mock direct to-socket routing
    registeredEvents['send-offer']({ targetSocketId: 'peer-111', sdp: 'sdp-offer-string' });
    expect(mockIo.to).toHaveBeenCalledWith('peer-111');
    expect(mockIo.emit).toHaveBeenCalledWith('receive-offer', {
      senderSocketId: 'socket-999',
      sdp: 'sdp-offer-string',
    });

    registeredEvents['send-answer']({ targetSocketId: 'peer-111', sdp: 'sdp-answer-string' });
    expect(mockIo.emit).toHaveBeenCalledWith('receive-answer', {
      senderSocketId: 'socket-999',
      sdp: 'sdp-answer-string',
    });
  });

  test('should accumulate audio chunks and trigger evaluation on stop', async () => {
    expect(registeredEvents['audio-chunk']).toBeDefined();
    expect(registeredEvents['stop-recording']).toBeDefined();

    mockSocket.data.roomId = 'room-abc';
    mockSocket.data.userId = 'user-xyz';

    vi.spyOn(audioStreamProcessor, 'accumulateAudioChunk').mockImplementation(() => {});
    vi.spyOn(audioStreamProcessor, 'processSessionAudio').mockResolvedValue({
      id: 'session-777',
      transcription: 'Mock transcript',
      metrics: { overallScore: 8 },
    });

    registeredEvents['audio-chunk'](Buffer.from([0, 1, 2]));
    expect(audioStreamProcessor.accumulateAudioChunk).toHaveBeenCalledWith('room-abc', expect.any(Buffer));

    const callback = vi.fn();
    await registeredEvents['stop-recording'](callback);

    expect(audioStreamProcessor.processSessionAudio).toHaveBeenCalledWith('room-abc', 'user-xyz');
    expect(mockIo.in).toHaveBeenCalledWith('room-abc');
    expect(mockIo.emit).toHaveBeenCalledWith('evaluation-completed', expect.objectContaining({
      sessionId: 'session-777',
    }));
    expect(callback).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ id: 'session-777' }),
    });
  });
});
