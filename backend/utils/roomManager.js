/**
 * In-memory registry of live battle rooms, keyed by room code.
 *
 * Every entry here holds timers and a full quiz payload, so anything that
 * leaks stays resident for the lifetime of the process. Two rules keep that
 * from happening:
 *
 *  1. Room codes are normalised in exactly one place. `createRoom` used to
 *     store `rooms[roomCode]` verbatim while `getRoom`/`removeRoom` looked up
 *     `rooms[roomCode.toUpperCase()]`, so a room created with a lowercase code
 *     was written to a key nobody ever read — unreachable *and* undeletable.
 *  2. `removeRoom` clears every timer the room owns. It previously cleared
 *     only the question interval, leaving each disconnected player's pending
 *     30-second timer alive with a closure over the whole room object.
 */

const rooms = {};

/** Grace period before a disconnected player is dropped from a room. */
const DISCONNECT_GRACE_MS = 30000;

/**
 * Canonical form of a room code.
 *
 * Callers pass codes from sockets, URLs and hand-typed input, so trim as well
 * as upper-case. Returns null for anything unusable so callers get a miss
 * rather than a lookup against the string "undefined".
 *
 * @param {string} roomCode
 * @returns {string|null}
 */
const normalizeRoomCode = (roomCode) => {
  if (typeof roomCode !== 'string') return null;
  const normalized = roomCode.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
};

/** Clear a player's pending disconnect timer, if it has one. */
const clearDisconnectTimer = (player) => {
  if (player && player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
  }
};

const createRoom = (
  roomCode,
  hostUserId,
  {
    roomName = 'Battle Room',
    password = '',
    questionCount = 5,
    timePerQuestion = 15,
    quiz = null,
  } = {}
) => {
  const code = normalizeRoomCode(roomCode);
  if (!code) return null;

  rooms[code] = {
    roomCode: code,
    roomName,
    password: password || '',
    hostUserId,
    hostSocketId: null, // set when socket connects/joins
    questionCount,
    timePerQuestion,
    status: 'waiting',
    players: {}, // key: socketId
    quiz,
    currentQuestionIndex: 0,
    questionActive: false,
    timeRemaining: timePerQuestion,
    timerInterval: null,
    answersReceived: 0,
  };
  return rooms[code];
};

const getRoom = (roomCode) => {
  const code = normalizeRoomCode(roomCode);
  if (!code) return null;
  return rooms[code];
};

const removeRoom = (roomCode) => {
  const code = normalizeRoomCode(roomCode);
  if (!code) return;

  const room = rooms[code];
  if (!room) return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  // Without this, a room torn down while players are in their grace period
  // leaves one live timer per player, each holding the room object alive.
  for (const socketId of Object.keys(room.players)) {
    clearDisconnectTimer(room.players[socketId]);
  }

  delete rooms[code];
};

const addPlayer = (roomCode, socketId, userId, username) => {
  const room = getRoom(roomCode);
  if (!room) return null;

  // Check if user is already in the room (e.g. reconnecting)
  const existingSocketId = Object.keys(room.players).find(
    (sid) => room.players[sid].userId === userId
  );

  if (existingSocketId) {
    // Cancel disconnect timeout if any
    const player = room.players[existingSocketId];
    clearDisconnectTimer(player);

    // Transfer player state to the new socket id
    room.players[socketId] = {
      ...player,
      disconnectTimer: null,
      online: true,
    };
    if (existingSocketId !== socketId) {
      delete room.players[existingSocketId];
    }
    if (room.hostUserId === userId) {
      room.hostSocketId = socketId;
    }
  } else {
    // New player join
    room.players[socketId] = {
      userId,
      username: username || 'Anonymous',
      score: 0,
      correctCount: 0,
      timeSpentSumMs: 0,
      isReady: false,
      online: true,
      disconnectTimer: null,
      answeredThisQuestion: false,
    };

    if (room.hostUserId === userId) {
      room.hostSocketId = socketId;
    }
  }

  return room.players[socketId];
};

const removePlayer = (roomCode, socketId, onHandoff, onDestroy) => {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players[socketId];
  if (!player) return null;

  player.online = false;

  // A flapping connection (mobile network, tab suspend) can call this repeatedly
  // for the same socket. Clear before scheduling so timers can't stack up, each
  // one later running the handoff/destroy block against stale state.
  clearDisconnectTimer(player);

  // Grace period: wait for reconnection before dropping the player
  player.disconnectTimer = setTimeout(() => {
    // The room may have been removed while this timer was pending — bail
    // rather than mutating an orphaned object.
    const currentRoom = getRoom(roomCode);
    if (!currentRoom || currentRoom.players[socketId] !== player) return;

    player.disconnectTimer = null;
    delete currentRoom.players[socketId];

    // If host left, assign new host from remaining active players
    if (currentRoom.hostSocketId === socketId || currentRoom.hostUserId === player.userId) {
      const activeSocketIds = Object.keys(currentRoom.players).filter(
        (sid) => currentRoom.players[sid].online
      );
      if (activeSocketIds.length > 0) {
        const nextSocketId = activeSocketIds[0];
        currentRoom.hostSocketId = nextSocketId;
        currentRoom.hostUserId = currentRoom.players[nextSocketId].userId;
        if (onHandoff) onHandoff(nextSocketId, currentRoom.players[nextSocketId].username);
      }
    }

    // If no players are left in the room, destroy it
    if (Object.keys(currentRoom.players).length === 0) {
      removeRoom(roomCode);
      if (onDestroy) onDestroy();
    }
  }, DISCONNECT_GRACE_MS);

  return player;
};

const setPlayerReady = (roomCode, socketId, isReady) => {
  const room = getRoom(roomCode);
  if (!room || !room.players[socketId]) return null;

  room.players[socketId].isReady = !!isReady;
  return room.players[socketId];
};

const checkAllReady = (roomCode) => {
  const room = getRoom(roomCode);
  if (!room) return false;

  const players = Object.values(room.players);
  if (players.length === 0) return false;

  return players.every((p) => p.isReady);
};

const getRoomScores = (roomCode) => {
  const room = getRoom(roomCode);
  if (!room) return {};

  const scores = {};
  for (const socketId in room.players) {
    const player = room.players[socketId];
    scores[player.userId] = {
      username: player.username,
      score: player.score,
      correctCount: player.correctCount,
      online: player.online,
    };
  }
  return scores;
};

module.exports = {
  rooms,
  DISCONNECT_GRACE_MS,
  normalizeRoomCode,
  createRoom,
  getRoom,
  removeRoom,
  addPlayer,
  removePlayer,
  setPlayerReady,
  checkAllReady,
  getRoomScores,
};
