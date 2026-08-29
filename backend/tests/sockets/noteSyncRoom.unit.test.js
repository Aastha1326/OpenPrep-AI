const assert = require('assert');
const noteSyncHandler = require('../../sockets/noteSyncHandler');

async function testNoteSyncRoom() {
  console.log('Testing Note Sync Room WebSocket handlers...');

  const registeredEvents = {};
  const emittedEvents = [];
  const roomBroadcasts = [];

  const mockSocket = {
    id: 'socket-999',
    noteId: null,
    userId: null,
    join: (room) => {
      mockSocket.joinedRoom = room;
    },
    to: (room) => ({
      emit: (event, payload) => {
        roomBroadcasts.push({ room, event, payload });
      },
    }),
    emit: (event, payload) => {
      emittedEvents.push({ event, payload });
    },
    on: (event, handler) => {
      registeredEvents[event] = handler;
    },
  };

  noteSyncHandler(null, mockSocket);

  // Test 1: join_note event
  assert.ok(typeof registeredEvents['join_note'] === 'function', 'join_note handler should be registered');
  await registeredEvents['join_note']({ noteId: 'note-100', userId: 'user-777', username: 'Alice' });

  assert.strictEqual(mockSocket.noteId, 'note-100');
  assert.strictEqual(mockSocket.userId, 'user-777');
  assert.strictEqual(mockSocket.joinedRoom, 'note:note-100');

  const snapshotEvent = emittedEvents.find((e) => e.event === 'note_snapshot');
  assert.ok(snapshotEvent, 'note_snapshot should be emitted to joining client');
  assert.strictEqual(typeof snapshotEvent.payload.text, 'string');
  assert.strictEqual(typeof snapshotEvent.payload.version, 'number');

  // Test 2: edit_op event
  assert.ok(typeof registeredEvents['edit_op'] === 'function', 'edit_op handler should be registered');
  await registeredEvents['edit_op']({
    op: { type: 'insert', position: 0, text: 'Hello' },
    version: 0,
  });

  const broadcastEvent = roomBroadcasts.find((b) => b.event === 'edit_op_broadcast');
  assert.ok(broadcastEvent, 'edit_op_broadcast should be emitted to room collaborators');
  assert.strictEqual(broadcastEvent.room, 'note:note-100');
  assert.strictEqual(broadcastEvent.payload.op.text, 'Hello');

  // Test 3: cursor_presence event
  assert.ok(typeof registeredEvents['cursor_presence'] === 'function', 'cursor_presence handler should be registered');
  registeredEvents['cursor_presence']({ cursorPosition: { line: 1, ch: 5 } });

  const cursorEvent = roomBroadcasts.find((b) => b.event === 'cursor_presence_broadcast');
  assert.ok(cursorEvent, 'cursor_presence_broadcast should be emitted');
  assert.strictEqual(cursorEvent.payload.userId, 'user-777');

  // Test 4: disconnect event
  assert.ok(typeof registeredEvents['disconnect'] === 'function', 'disconnect handler should be registered');
  registeredEvents['disconnect']();

  const leaveEvent = roomBroadcasts.find((b) => b.event === 'user_left_note');
  assert.ok(leaveEvent, 'user_left_note event should be emitted on disconnect');
  assert.strictEqual(leaveEvent.payload.userId, 'user-777');

  console.log('✅ Note Sync Room WebSocket tests passed successfully!');
}

if (require.main === module) {
  testNoteSyncRoom().catch((err) => {
    console.error('❌ Note Sync Room WebSocket tests failed:', err);
    process.exit(1);
  });
}

module.exports = testNoteSyncRoom;
