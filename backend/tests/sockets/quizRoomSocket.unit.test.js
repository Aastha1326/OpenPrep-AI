const jwt = require('jsonwebtoken');
const { liveRooms } = require('../../src/socket/quizRoomSocket');
const quizRoomSocket = require('../../src/socket/quizRoomSocket');

vi.mock('../../models', () => ({
  User: {
    findByPk: vi.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        name: `User ${id}`,
        email: `${id}@example.com`,
      })
    ),
  },
  Quiz: {
    findByPk: vi.fn().mockResolvedValue(null),
  },
  QuizRoom: {
    findOne: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue([{}, true]),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const createFakeIo = () => {
  const broadcasts = [];
  const io = {
    broadcasts,
    handlers: {},
    middlewares: [],
    use: vi.fn((fn) => {
      io.middlewares.push(fn);
    }),
    on: vi.fn((event, cb) => {
      io.handlers[event] = cb;
    }),
    to: vi.fn((roomKey) => ({
      emit: vi.fn((event, data) => {
        broadcasts.push({ roomKey, event, data });
      }),
    })),
  };
  return io;
};

const createFakeSocket = (id, userPayload) => {
  const emitted = [];
  const handlers = {};
  const token = jwt.sign(userPayload, JWT_SECRET);

  const socket = {
    id,
    emitted,
    handlers,
    joinedRooms: [],
    handshake: {
      auth: { token },
    },
    join: vi.fn((roomKey) => {
      socket.joinedRooms.push(roomKey);
    }),
    leave: vi.fn((roomKey) => {
      socket.joinedRooms = socket.joinedRooms.filter((r) => r !== roomKey);
    }),
    on: vi.fn((event, cb) => {
      handlers[event] = cb;
    }),
    emit: vi.fn((event, data) => {
      emitted.push({ event, data });
    }),
  };
  return socket;
};

const setupSocketTest = () => {
  const io = createFakeIo();
  quizRoomSocket(io);

  const connectUser = async (id, name) => {
    const socket = createFakeSocket(id, { id: `u-${id}`, name, type: 'access' });
    for (const mw of io.middlewares) {
      await new Promise((resolve) => mw(socket, resolve));
    }
    io.handlers.connection(socket);
    return socket;
  };

  const invoke = (socket, event, payload) =>
    new Promise((resolve) => {
      if (socket.handlers[event]) {
        socket.handlers[event](payload, resolve);
      } else {
        resolve({ success: false, message: `Handler not found: ${event}` });
      }
    });

  return { io, connectUser, invoke };
};

describe('Collaborative Quiz Rooms Socket Handler', () => {
  beforeEach(() => {
    liveRooms.clear();
    vi.clearAllMocks();
  });

  it('authenticates socket connection via JWT middleware', async () => {
    const { connectUser } = setupSocketTest();
    const socket = await connectUser('101', 'Alice');
    expect(socket.user).toBeDefined();
    expect(socket.user.name).toBe('Alice');
  });

  it('rejects unauthenticated socket connections with missing/invalid JWT', async () => {
    const io = createFakeIo();
    quizRoomSocket(io);

    const badSocket = {
      handshake: { auth: {} },
    };

    let authError = null;
    await io.middlewares[0](badSocket, (err) => {
      authError = err;
    });

    expect(authError).toBeDefined();
    expect(authError.message).toMatch(/Authentication error/);
  });

  it('allows creating and joining a quiz room, broadcasting room_update and score', async () => {
    const { io, connectUser, invoke } = setupSocketTest();
    const hostSocket = await connectUser('1', 'Host Alice');

    const res = await invoke(hostSocket, 'create_room', { roomId: 'QUIZ12' });
    expect(res.success).toBe(true);
    expect(res.roomId).toBe('QUIZ12');
    expect(hostSocket.joinedRooms).toContain('quiz_room:QUIZ12');

    const peerSocket = await connectUser('2', 'Learner Bob');
    const joinRes = await invoke(peerSocket, 'join_room', { roomId: 'QUIZ12' });
    expect(joinRes.success).toBe(true);
    expect(peerSocket.joinedRooms).toContain('quiz_room:QUIZ12');

    const updates = io.broadcasts.filter((b) => b.event === 'room_update');
    expect(updates.length).toBeGreaterThan(0);
    const lastUpdate = updates[updates.length - 1].data;
    expect(lastUpdate.participants.length).toBe(2);
  });

  it('allows host to start quiz and broadcasts question payload without correct answer index', async () => {
    const { io, connectUser, invoke } = setupSocketTest();
    const hostSocket = await connectUser('1', 'Host Alice');
    await invoke(hostSocket, 'create_room', { roomId: 'QUIZ99' });

    hostSocket.handlers['start_quiz']({ roomId: 'QUIZ99' });

    const qEvent = io.broadcasts.find((b) => b.event === 'question');
    expect(qEvent).toBeDefined();
    expect(qEvent.data.questionIndex).toBe(0);
    expect(qEvent.data.correctAnswerIndex).toBeUndefined(); // ensure correct answer is withheld
    expect(qEvent.data.options.length).toBeGreaterThan(0);
  });

  it('processes answer submissions and broadcasts answer & score updates', async () => {
    const { io, connectUser, invoke } = setupSocketTest();
    const hostSocket = await connectUser('1', 'Host Alice');
    await invoke(hostSocket, 'create_room', { roomId: 'QUIZ88' });

    const peerSocket = await connectUser('2', 'Bob');
    await invoke(peerSocket, 'join_room', { roomId: 'QUIZ88' });

    hostSocket.handlers['start_quiz']({ roomId: 'QUIZ88' });

    // Submit answer for current question (option 1 is correct in default mock quiz)
    peerSocket.handlers['answer']({
      roomId: 'QUIZ88',
      questionIndex: 0,
      optionIndex: 1,
      timeSpentMs: 2000,
    });

    const answerEvents = io.broadcasts.filter((b) => b.event === 'answer');
    expect(answerEvents.length).toBe(1);
    expect(answerEvents[0].data.isCorrect).toBe(true);
    expect(answerEvents[0].data.score).toBeGreaterThan(100);

    const scoreEvents = io.broadcasts.filter((b) => b.event === 'score');
    expect(scoreEvents.length).toBeGreaterThan(0);
  });
});
