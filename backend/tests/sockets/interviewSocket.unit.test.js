const initializeInterviewSocket = require('../../sockets/interviewSocket');
const { activeInterviewRooms } = require('../../sockets/interviewSocket');
const redisService = require('../../services/redisService');

describe('Live Collaborative Coding Interview Socket Server', () => {
  let ioMock;
  let socketMock;
  let onConnectionCallback;
  let registeredEvents;
  let mockRunner;

  beforeEach(() => {
    vi.restoreAllMocks();
    activeInterviewRooms.clear();
    redisService.isReady = false;
    registeredEvents = {};

    socketMock = {
      id: 'socket-interview-1',
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn().mockImplementation(() => ({
        emit: (event, data) => {
          if (registeredEvents[event]) {
            registeredEvents[event](data);
          }
        },
      })),
      emit: vi.fn(),
      data: {},
      on: vi.fn().mockImplementation((event, callback) => {
        registeredEvents[event] = callback;
      }),
    };

    ioMock = {
      of: vi.fn().mockImplementation(() => ({
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'connection') {
            onConnectionCallback = callback;
          }
        }),
        in: vi.fn().mockImplementation(() => ({
          emit: vi.fn(),
        })),
        to: vi.fn().mockImplementation(() => ({
          emit: vi.fn(),
        })),
      })),
    };

    mockRunner = {
      runCode: vi.fn().mockResolvedValue({
        success: true,
        stdout: 'Test output',
        stderr: '',
        executionTimeMs: 15,
        language: 'javascript',
      }),
    };

    initializeInterviewSocket(ioMock, { codeRunnerService: mockRunner });
    if (onConnectionCallback) {
      onConnectionCallback(socketMock);
    }
  });

  it('should register connection handler and join interview room with room state sync', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    expect(joinHandler).toBeDefined();

    await joinHandler({
      roomId: 'interview-room-1',
      role: 'interviewer',
      user: { name: 'Alice Interviewer', id: 'user-1' },
    });

    expect(socketMock.join).toHaveBeenCalledWith('interview-room-1');
    expect(socketMock.data.roomId).toBe('interview-room-1');
    expect(socketMock.data.role).toBe('interviewer');

    expect(socketMock.emit).toHaveBeenCalledWith(
      'interview:room_state_sync',
      expect.objectContaining({
        roomId: 'interview-room-1',
        myRole: 'interviewer',
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Alice Interviewer', role: 'interviewer' }),
        ]),
      })
    );
  });

  it('should broadcast code changes and update room state', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    const codeChangeHandler = registeredEvents['interview:code_change'];

    await joinHandler({ roomId: 'interview-room-1', role: 'candidate' });

    const newCode = 'console.log("Hello Interviewer!");';
    const toSpy = vi.spyOn(socketMock, 'to');

    await codeChangeHandler({ roomId: 'interview-room-1', code: newCode });

    expect(toSpy).toHaveBeenCalledWith('interview-room-1');
    const roomState = activeInterviewRooms.get('interview-room-1');
    expect(roomState.code).toBe(newCode);
  });

  it('should broadcast cursor movement to room peers', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    const cursorMoveHandler = registeredEvents['interview:cursor_move'];

    await joinHandler({ roomId: 'interview-room-1', role: 'candidate' });

    const toSpy = vi.spyOn(socketMock, 'to');
    await cursorMoveHandler({
      roomId: 'interview-room-1',
      position: { lineNumber: 5, column: 12 },
    });

    expect(toSpy).toHaveBeenCalledWith('interview-room-1');
  });

  it('should execute code via codeRunnerService and broadcast code output', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    const runCodeHandler = registeredEvents['interview:run_code'];

    await joinHandler({ roomId: 'interview-room-1', role: 'candidate' });

    await runCodeHandler({
      roomId: 'interview-room-1',
      code: 'console.log(42);',
      language: 'javascript',
    });

    expect(mockRunner.runCode).toHaveBeenCalledWith({
      code: 'console.log(42);',
      language: 'javascript',
      stdin: '',
    });
  });

  it('should receive and store chat messages', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    const chatHandler = registeredEvents['interview:chat_message'];

    await joinHandler({ roomId: 'interview-room-1', role: 'interviewer' });
    await chatHandler({ roomId: 'interview-room-1', text: 'Shall we discuss question 1?' });

    const roomState = activeInterviewRooms.get('interview-room-1');
    expect(roomState.chatMessages.some((m) => m.text === 'Shall we discuss question 1?')).toBe(true);
  });

  it('should handle disconnect and remove participant', async () => {
    const joinHandler = registeredEvents['interview:join_room'];
    const disconnectHandler = registeredEvents['disconnect'];

    await joinHandler({ roomId: 'interview-room-1', role: 'candidate' });
    await disconnectHandler();

    const roomState = activeInterviewRooms.get('interview-room-1');
    expect(Object.keys(roomState.participants).length).toBe(0);
  });
});
