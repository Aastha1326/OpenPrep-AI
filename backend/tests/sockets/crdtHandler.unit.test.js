/**
 * Behaviour tests for the collaborative-note socket handler.
 *
 * The Note model is injected rather than mocked: this repo's backend Vitest
 * setup does not intercept CJS `require`, so `vi.mock` of a model module is
 * silently ignored. yjs itself is exercised for real, so the document state
 * these assertions rely on is genuine CRDT state.
 */

const Y = require('yjs');
const crdtHandler = require('../../sockets/crdtHandler');

const OWNER = '11111111-1111-1111-1111-111111111111';
const STRANGER = '22222222-2222-2222-2222-222222222222';
const NOTE_ID = 'note-1';

/** A base64 yjs update that inserts text, so applyUpdate has real work to do. */
const sampleUpdate = () => {
  const doc = new Y.Doc();
  doc.getText('content').insert(0, ' and more');
  return Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
};

let Note;

const note = (overrides = {}) => ({
  id: NOTE_ID,
  user: OWNER,
  isPublic: false,
  isCollaborative: false,
  content: 'hello',
  docState: null,
  ...overrides,
});

/**
 * Minimal socket double. Records emissions and exposes the handlers the
 * production code registered, so a test can fire an event directly.
 */
function makeSocket(userId, id = 'socket-1') {
  const handlers = {};

  return {
    id,
    user: userId ? { id: userId } : undefined,
    handlers,
    emitted: [],
    broadcast: [],
    rooms: new Set(),
    on(event, fn) {
      handlers[event] = fn;
    },
    emit(event, payload) {
      this.emitted.push({ event, payload });
    },
    join(room) {
      this.rooms.add(room);
    },
    leave(room) {
      this.rooms.delete(room);
    },
    to(room) {
      const self = this;
      return {
        emit(event, payload) {
          self.broadcast.push({ room, event, payload });
        },
      };
    },
    fire(event, payload) {
      return handlers[event](payload);
    },
    emittedEvents() {
      return this.emitted.map((e) => e.event);
    },
    lastPayload(event) {
      return [...this.emitted].reverse().find((e) => e.event === event)?.payload;
    },
  };
}

/** Registers the handler against a fake io and returns the connected socket. */
function connect(socket) {
  crdtHandler(
    {
      on: (event, fn) => {
        if (event === 'connection') fn(socket);
      },
    },
    { noteModel: Note }
  );
  return socket;
}

describe('crdtHandler authorization', () => {
  beforeEach(() => {
    Note = { findByPk: vi.fn(), update: vi.fn().mockResolvedValue([1]) };
    crdtHandler.activeDocs.clear();
  });

  it('refuses a stranger joining a private note and sends no document state', async () => {
    Note.findByPk.mockResolvedValue(note());
    const socket = connect(makeSocket(STRANGER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });

    expect(socket.emittedEvents()).toContain('collab-error');
    expect(socket.emittedEvents()).not.toContain('yjs-sync-step-1');
    expect(socket.rooms.size).toBe(0);
    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(false);
  });

  it('lets the owner join and receive document state', async () => {
    Note.findByPk.mockResolvedValue(note());
    const socket = connect(makeSocket(OWNER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });

    expect(socket.emittedEvents()).toContain('yjs-sync-step-1');
    expect(socket.lastPayload('collab-access')).toEqual({ noteId: NOTE_ID, level: 'write' });
    expect(socket.rooms.has('note-collab-note-1')).toBe(true);
  });

  it('lets any user join a note flagged collaborative', async () => {
    Note.findByPk.mockResolvedValue(note({ isCollaborative: true }));
    const socket = connect(makeSocket(STRANGER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });

    expect(socket.lastPayload('collab-access')).toEqual({ noteId: NOTE_ID, level: 'write' });
  });

  it('refuses an unauthenticated socket', async () => {
    const socket = connect(makeSocket(null));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });

    expect(socket.emittedEvents()).toContain('collab-error');
    expect(Note.findByPk).not.toHaveBeenCalled();
  });
});

describe('crdtHandler updates', () => {
  beforeEach(() => {
    Note = { findByPk: vi.fn(), update: vi.fn().mockResolvedValue([1]) };
    crdtHandler.activeDocs.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores an update from a socket that never joined', () => {
    const socket = connect(makeSocket(STRANGER));

    socket.fire('yjs-update', { noteId: NOTE_ID, payload: sampleUpdate() });

    vi.runAllTimers();
    expect(Note.update).not.toHaveBeenCalled();
    expect(socket.broadcast).toHaveLength(0);
  });

  it('ignores an update from a read-only participant', async () => {
    Note.findByPk.mockResolvedValue(note({ isPublic: true }));
    const socket = connect(makeSocket(STRANGER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });
    expect(socket.lastPayload('collab-access')).toEqual({ noteId: NOTE_ID, level: 'read' });

    socket.fire('yjs-update', { noteId: NOTE_ID, payload: sampleUpdate() });

    vi.runAllTimers();
    expect(Note.update).not.toHaveBeenCalled();
    expect(socket.broadcast).toHaveLength(0);
  });

  it('accepts an update from the owner and persists it after the debounce', async () => {
    Note.findByPk.mockResolvedValue(note());
    const socket = connect(makeSocket(OWNER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });
    socket.fire('yjs-update', { noteId: NOTE_ID, payload: sampleUpdate() });

    expect(socket.broadcast).toHaveLength(1);
    expect(socket.broadcast[0].room).toBe('note-collab-note-1');

    expect(Note.update).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(Note.update).toHaveBeenCalledWith(expect.any(Object), { where: { id: NOTE_ID } });
  });

  it('does not relay awareness for a room the socket never joined', () => {
    const socket = connect(makeSocket(STRANGER));

    socket.fire('yjs-awareness', { noteId: NOTE_ID, payload: 'presence' });

    expect(socket.broadcast).toHaveLength(0);
  });

  it('relays awareness for a room the socket did join', async () => {
    Note.findByPk.mockResolvedValue(note({ isPublic: true }));
    const socket = connect(makeSocket(STRANGER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });
    socket.fire('yjs-awareness', { noteId: NOTE_ID, payload: 'presence' });

    expect(socket.broadcast).toHaveLength(1);
    expect(socket.broadcast[0].event).toBe('yjs-awareness');
  });
});

describe('crdtHandler document lifecycle', () => {
  beforeEach(() => {
    Note = { findByPk: vi.fn(), update: vi.fn().mockResolvedValue([1]) };
    crdtHandler.activeDocs.clear();
  });

  it('releases the document once the last participant disconnects', async () => {
    Note.findByPk.mockResolvedValue(note());
    const socket = connect(makeSocket(OWNER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });
    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(true);

    await socket.fire('disconnect');

    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(false);
  });

  it('keeps the document while another participant is still connected', async () => {
    Note.findByPk.mockResolvedValue(note({ isCollaborative: true }));
    const first = connect(makeSocket(OWNER, 'socket-1'));
    const second = connect(makeSocket(STRANGER, 'socket-2'));

    await first.fire('yjs-join-room', { noteId: NOTE_ID });
    await second.fire('yjs-join-room', { noteId: NOTE_ID });

    await first.fire('disconnect');

    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(true);

    await second.fire('disconnect');

    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(false);
  });

  it('flushes a pending write when the last participant leaves', async () => {
    vi.useFakeTimers();
    Note.findByPk.mockResolvedValue(note());
    const socket = connect(makeSocket(OWNER));

    await socket.fire('yjs-join-room', { noteId: NOTE_ID });
    socket.fire('yjs-update', { noteId: NOTE_ID, payload: sampleUpdate() });

    // Leaving before the debounce fires must not lose the edit.
    expect(Note.update).not.toHaveBeenCalled();
    await socket.fire('yjs-leave-room', { noteId: NOTE_ID });

    expect(Note.update).toHaveBeenCalledTimes(1);
    expect(crdtHandler.activeDocs.has(NOTE_ID)).toBe(false);
    vi.useRealTimers();
  });
});
