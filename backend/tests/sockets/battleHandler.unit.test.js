const createFakeIo = () => {
  const broadcasts = [];
  const io = {
    broadcasts,
    handlers: {},
    on: vi.fn((event, cb) => {
      io.handlers[event] = cb;
    }),
    to: vi.fn(() => ({
      emit: vi.fn((event, data) => {
        broadcasts.push({ event, data });
      }),
    })),
  };
  return io;
};

const createFakeSocket = (id) => {
  const emitted = [];
  const handlers = {};
  const socket = {
    id,
    emitted,
    handlers,
    joinedRooms: [],
    join: vi.fn((roomId) => {
      socket.joinedRooms.push(roomId);
    }),
    leave: vi.fn(),
    on: vi.fn((event, cb) => {
      handlers[event] = cb;
    }),
    emit: vi.fn((event, data) => {
      emitted.push({ event, data });
    }),
    to: vi.fn(() => ({
      emit: vi.fn((event, data) => {
        emitted.push({ event, data });
      }),
    })),
  };
  return socket;
};

const setup = () => {
  const io = createFakeIo();
  require('../../sockets/battleHandler')(io);
  const connect = (id) => {
    const socket = createFakeSocket(id);
    io.handlers.connection(socket);
    return socket;
  };
  const invoke = (socket, event, payload) =>
    new Promise((resolve) => {
      socket.handlers[event](payload, resolve);
    });
  return { io, connect, invoke };
};

const success = (result) => expect(result.success).toBe(true);

// Room codes AND socket ids are globally unique per test: the in-memory rooms
// map is shared across the whole file, so nothing may alias between tests.
describe('battleHandler - room creation', () => {
  it('generates a unique 6-character code when none is supplied', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a1');
    const res = await invoke(socket, 'create-room', { roomName: 'My Room' });

    success(res);
    expect(res.roomId).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(res.room.id).toBe(res.roomId);
    expect(res.room.name).toBe('My Room');
    expect(res.isPrivate).toBe(false);
    expect(socket.joinedRooms).toContain(res.roomId);
  });

  it('allows creating with an explicit valid code', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a2');
    const res = await invoke(socket, 'create-room', { roomId: 'AB2DEF' });
    success(res);
    expect(res.roomId).toBe('AB2DEF');
  });

  it('rejects reusing a code that is already in use', async () => {
    const { connect, invoke } = setup();
    const first = connect('s-a3');
    await invoke(first, 'create-room', { roomId: 'AB3DEF' });

    const second = connect('s-a4');
    const res = await invoke(second, 'create-room', { roomId: 'AB3DEF' });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/already in use/);
  });

  it('rejects invalid code formats', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a5');

    const tooShort = await invoke(socket, 'create-room', { roomId: 'ABC' });
    expect(tooShort.success).toBe(false);
    expect(tooShort.message).toMatch(/exactly 6/);

    const ambiguous = await invoke(socket, 'create-room', { roomId: 'AB3DE0' });
    expect(ambiguous.success).toBe(false);
  });

  it('creates a private room with a password', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a6');
    const res = await invoke(socket, 'create-room', { roomId: 'AB4DEF', password: 'secret' });
    success(res);
    expect(res.isPrivate).toBe(true);
    expect(res.room.password).toBe('secret');
  });
});

describe('battleHandler - joining rooms', () => {
  it('fails to join a room that does not exist', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a7');
    const res = await invoke(socket, 'join-room', { roomId: 'ZZZZZZ' });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/not found/);
  });

  it('requires a room code', async () => {
    const { connect, invoke } = setup();
    const socket = connect('s-a8');
    const res = await invoke(socket, 'join-room', {});
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/required/);
  });

  it('joins an existing public room and notifies everyone', async () => {
    const { io, connect, invoke } = setup();
    const host = connect('s-a9');
    await invoke(host, 'create-room', { roomId: 'AB5DEF', roomName: 'Host Room' });

    const guest = connect('s-b1');
    const res = await invoke(guest, 'join-room', { roomId: 'ab5def' });
    success(res);
    expect(res.roomId).toBe('AB5DEF');
    expect(guest.joinedRooms).toContain('AB5DEF');

    const roomUpdates = io.broadcasts.filter((b) => b.event === 'room_update');
    expect(roomUpdates.length).toBeGreaterThanOrEqual(2);
    const latest = roomUpdates[roomUpdates.length - 1].data.players;
    expect(Object.keys(latest)).toEqual(['s-a9', 's-b1']);
  });

  it('rejects the wrong password for a private room', async () => {
    const { connect, invoke } = setup();
    const host = connect('s-b2');
    await invoke(host, 'create-room', { roomId: 'AB6DEF', password: 'secret' });

    const guest = connect('s-b3');
    const res = await invoke(guest, 'join-room', { roomId: 'AB6DEF', password: 'nope' });
    expect(res.success).toBe(false);
    expect(res.requiresPassword).toBe(true);
  });

  it('accepts the correct password for a private room', async () => {
    const { connect, invoke } = setup();
    const host = connect('s-b4');
    await invoke(host, 'create-room', { roomId: 'AB7DEF', password: 'secret' });

    const guest = connect('s-b5');
    const res = await invoke(guest, 'join-room', { roomId: 'AB7DEF', password: 'secret' });
    success(res);
  });

  it('supports join_room with a bare string payload', async () => {
    const { io, connect, invoke } = setup();
    const host = connect('s-b6');
    await invoke(host, 'create-room', { roomId: 'AB8DEF' });

    const guest = connect('s-b7');
    const res = await invoke(guest, 'join_room', 'ab8def');
    success(res);
    expect(res.roomId).toBe('AB8DEF');
    expect(io.broadcasts.some((b) => b.event === 'room_update')).toBe(true);
  });
});

describe('battleHandler - live scoring', () => {
  it('starts the battle when all players are ready', async () => {
    const { io, connect, invoke } = setup();
    const a = connect('s-b8');
    await invoke(a, 'create-room', { roomId: 'AB9DEF' });
    const b = connect('s-b9');
    await invoke(b, 'join-room', { roomId: 'AB9DEF' });

    a.handlers['toggle_ready']({ roomId: 'AB9DEF' });
    b.handlers['user:ready']({ roomId: 'AB9DEF', isReady: true });

    const starts = io.broadcasts.filter((x) => x.event === 'battle_start');
    expect(starts).toHaveLength(1);
  });

  it('adds points only for correct answers during play', async () => {
    const { io, connect, invoke } = setup();
    const a = connect('s-c1');
    await invoke(a, 'create-room', { roomId: 'AC2DEF' });
    const b = connect('s-c2');
    await invoke(b, 'join-room', { roomId: 'AC2DEF' });

    a.handlers['user:ready']({ roomId: 'AC2DEF', isReady: true });
    b.handlers['user:ready']({ roomId: 'AC2DEF', isReady: true });

    a.handlers['submit_answer']({ roomId: 'AC2DEF', isCorrect: true, points: 10 });
    b.handlers['submit_answer']({ roomId: 'AC2DEF', isCorrect: false, points: 10 });

    const scoreUpdates = io.broadcasts.filter((x) => x.event === 'score_update');
    const players = scoreUpdates[scoreUpdates.length - 1].data.players;
    expect(players['s-c1'].score).toBe(10);
    expect(players['s-c2'].score).toBe(0);
  });

  it('ignores submit_answer while the room is waiting', async () => {
    const { io, connect, invoke } = setup();
    const a = connect('s-c3');
    await invoke(a, 'create-room', { roomId: 'AC3DEF' });

    a.handlers['submit_answer']({ roomId: 'AC3DEF', isCorrect: true, points: 10 });

    expect(io.broadcasts.filter((x) => x.event === 'score_update')).toHaveLength(0);
  });
});

describe('battleHandler - leaving rooms', () => {
  it('removes a player via leave-room and keeps the room for others', async () => {
    const { io, connect, invoke } = setup();
    const a = connect('s-c4');
    await invoke(a, 'create-room', { roomId: 'AC4DEF' });
    const b = connect('s-c5');
    await invoke(b, 'join-room', { roomId: 'AC4DEF' });

    a.handlers['leave-room']({ roomId: 'AC4DEF' });

    const presence = io.broadcasts.filter((x) => x.event === 'presence_update');
    expect(presence[presence.length - 1].data.online).toBe(false);

    const guest = connect('s-c6');
    const res = await invoke(guest, 'join-room', { roomId: 'AC4DEF' });
    success(res);
  });

  it('deletes the room when the last player disconnects', async () => {
    const { connect, invoke } = setup();
    const a = connect('s-c7');
    await invoke(a, 'create-room', { roomId: 'AC5DEF' });

    a.handlers.disconnect();

    const b = connect('s-c8');
    const res = await invoke(b, 'join-room', { roomId: 'AC5DEF' });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/not found/);
  });
});
