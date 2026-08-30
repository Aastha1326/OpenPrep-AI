import { describe, it, expect, beforeEach, vi } from 'vitest';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '..', '..', 'sockets', 'studyRoomSocket.js');
const MODULE_SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');

const redisService = require('../../services/redisService');

/**
 * Loaded on demand rather than at import time.
 *
 * When the module has a syntax error, a top-level `require` turns this whole
 * file into a collection error: vitest reports "1 failed suite, no tests" and
 * every source-level check below — the ones written specifically to name that
 * error — never runs. Deferring the require keeps the integrity assertions
 * alive to do their job, and the behavioural suites still fail loudly because
 * the first call throws.
 */
function loadModule() {
  return require('../../sockets/studyRoomSocket');
}

/**
 * Drives the module the way Socket.IO does and hands back the socket double
 * plus the handlers it registered.
 */
function connectSocket(overrides = {}) {
  const registered = {};
  const emitted = [];
  const broadcasts = [];

  const socket = {
    id: 'socket-1',
    data: {},
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn((event, payload) => emitted.push({ event, payload })),
    to: vi.fn((room) => ({
      emit: (event, payload) => broadcasts.push({ room, event, payload }),
    })),
    on: vi.fn((event, handler) => {
      registered[event] = handler;
    }),
    removeAllListeners: vi.fn((event) => {
      delete registered[event];
    }),
    ...overrides,
  };

  loadModule()({
    on: (event, handler) => {
      if (event === 'connection') handler(socket);
    },
  });

  return { socket, registered, emitted, broadcasts };
}

describe('studyRoomSocket module integrity', () => {
  it('parses and loads', () => {
    expect(() => loadModule()).not.toThrow();
  });

  it('compiles, and says where if it does not', () => {
    // `require` throwing a SyntaxError takes the whole suite down as a
    // collection error, which reads like an unrelated infrastructure problem.
    // Compiling the source on its own keeps the parser's message — file, line
    // and token — attached to a single named assertion.
    let syntaxError = null;
    try {
      new vm.Script(MODULE_SOURCE, { filename: MODULE_PATH });
    } catch (error) {
      syntaxError = `${error.name}: ${error.message}`;
    }

    expect(syntaxError).toBeNull();
  });

  it('closes every named connection handler as a statement', () => {
    // #1806: `const handleJoinRoom = async ({...}) => { ... });` — the trailing
    // `)` was left behind when an inline `socket.on(...)` listener was lifted
    // into a named handler, and a later merge chose that side. The file stops
    // parsing, so `server.js` dies on boot before it can listen.
    //
    // Walk each `const <name> = async (…) => {` and match brackets forward to
    // its closing brace. The character after it must not be `)`.
    const declaration = /const (handle[A-Za-z]+|cleanupSocket) = (?:async )?\(?[^)]*\)? *=> *\{/g;
    const offenders = [];

    let match;
    while ((match = declaration.exec(MODULE_SOURCE)) !== null) {
      let depth = 0;
      // The match ends on the body's opening brace. Starting the walk from
      // indexOf('{') instead would land on the destructured parameter list.
      let index = match.index + match[0].length - 1;

      for (; index < MODULE_SOURCE.length; index += 1) {
        const character = MODULE_SOURCE[index];
        if (character === '{') depth += 1;
        else if (character === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
      }

      if (MODULE_SOURCE[index + 1] === ')') {
        offenders.push(`${match[1]} is closed with '});' instead of '};'`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('exports the initializer as a function', () => {
    expect(typeof loadModule()).toBe('function');
  });

  it('exposes the in-memory room map as activeRooms', () => {
    // The map was renamed to localRooms; the export still has to resolve.
    expect(loadModule().activeRooms).toBeInstanceOf(Map);
  });

  it('declares handleJoinRoom before the lines that register it', () => {
    const declaration = MODULE_SOURCE.indexOf('const handleJoinRoom');
    const registration = MODULE_SOURCE.indexOf("socket.on('join_room', handleJoinRoom)");

    expect(declaration).toBeGreaterThan(-1);
    expect(registration).toBeGreaterThan(declaration);
  });

  it('does not register join_room with an inline listener as well', () => {
    // The broken form was `socket.on('join_room', async ({...}) => {`, which
    // would have left a duplicate listener once the named one was added.
    expect(MODULE_SOURCE).not.toMatch(/socket\.on\('join_room',\s*async/);
  });

  it('defines every identifier the connection scope calls', () => {
    for (const name of ['handleJoinRoom', 'handleLeaveRoom', 'cleanupSocket']) {
      expect(MODULE_SOURCE, `${name} is never declared`).toMatch(
        new RegExp(`const ${name}\\s*=`)
      );
    }
  });
});

describe('join handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    redisService.isReady = false;
    loadModule().activeRooms.clear();
  });

  it('registers both the legacy and namespaced join events', () => {
    const { registered } = connectSocket();

    expect(typeof registered['join_room']).toBe('function');
    expect(typeof registered['study:room:join']).toBe('function');
  });

  it('serves both join events with the same handler reference', () => {
    const { registered } = connectSocket();

    expect(registered['join_room']).toBe(registered['study:room:join']);
  });

  it('joins the room and records the participant', async () => {
    const { socket, registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });

    expect(socket.join).toHaveBeenCalledWith('room-1');
    expect(socket.data.roomId).toBe('room-1');
    expect(socket.data.username).toBe('Ada');

    const room = loadModule().activeRooms.get('room-1');
    expect(room.participants['socket-1']).toEqual({ id: 'socket-1', username: 'Ada' });
  });

  it('announces the joiner to the rest of the room', async () => {
    const { registered, broadcasts } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });

    const announcement = broadcasts.find((entry) => entry.event === 'user_joined');
    expect(announcement).toBeDefined();
    expect(announcement.room).toBe('room-1');
    expect(announcement.payload.username).toBe('Ada');
  });

  it('sends the joiner the current room state', async () => {
    const { registered, emitted } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });

    const sync = emitted.find((entry) => entry.event === 'room_state_sync');
    expect(sync).toBeDefined();
    expect(sync.payload).toHaveProperty('users');
    expect(sync.payload).toHaveProperty('whiteboard');
    expect(sync.payload.users).toEqual([{ id: 'socket-1', username: 'Ada' }]);
  });

  it('falls back to Anonymous when no username is supplied', async () => {
    const { registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1' });

    const room = loadModule().activeRooms.get('room-1');
    expect(room.participants['socket-1'].username).toBe('Anonymous');
  });

  it('behaves identically when entered through study:room:join', async () => {
    const { socket, registered } = connectSocket();

    await registered['study:room:join']({ roomId: 'room-2', username: 'Grace' });

    expect(socket.join).toHaveBeenCalledWith('room-2');
    expect(
      loadModule().activeRooms.get('room-2').participants['socket-1'].username
    ).toBe('Grace');
  });
});

describe('leave and cleanup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    redisService.isReady = false;
    loadModule().activeRooms.clear();
  });

  it('releases the participant on an explicit leave', async () => {
    const { registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    expect(loadModule().activeRooms.has('room-1')).toBe(true);

    await registered['study:room:leave']();

    // The room is dropped once its last participant is removed, so a ghost
    // participant would keep the entry alive here.
    expect(loadModule().activeRooms.has('room-1')).toBe(false);
  });

  it('announces the departure to the room', async () => {
    const { registered, broadcasts } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    await registered['study:room:leave']();

    const departure = broadcasts.find((entry) => entry.event === 'user_left');
    expect(departure).toBeDefined();
    expect(departure.payload.username).toBe('Ada');
  });

  it('tears down the room listeners so they cannot leak', async () => {
    const { socket, registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    await registered['study:room:leave']();

    const removed = socket.removeAllListeners.mock.calls.map((call) => call[0]);
    expect(removed).toEqual(
      expect.arrayContaining(['join_room', 'study:room:join', 'draw_stroke', 'disconnect'])
    );
  });

  it('clears the socket room state so a stale room is not reused', async () => {
    const { socket, registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    await registered['study:room:leave']();

    expect(socket.data.roomId).toBeNull();
    expect(socket.data.username).toBeNull();
  });

  it('clears a heartbeat interval left on the socket', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { socket, registered } = connectSocket();
    socket.heartbeatInterval = setInterval(() => {}, 60_000);

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    await registered['study:room:leave']();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(socket.heartbeatInterval).toBeNull();
  });

  it('is a no-op when the socket was never in a room', async () => {
    const { socket, registered } = connectSocket();

    await expect(registered['study:room:leave']()).resolves.toBeUndefined();
    expect(socket.leave).not.toHaveBeenCalled();
  });

  it('removes the participant on disconnect', async () => {
    const { registered } = connectSocket();

    await registered['join_room']({ roomId: 'room-1', username: 'Ada' });
    await registered['disconnect']();

    expect(loadModule().activeRooms.has('room-1')).toBe(false);
  });
});
