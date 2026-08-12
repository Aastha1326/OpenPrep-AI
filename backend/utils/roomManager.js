const rooms = {};

const createRoom = (roomCode, hostUserId, { roomName = 'Battle Room', password = '', questionCount = 5, timePerQuestion = 15, quiz = null } = {}) => {
  rooms[roomCode] = {
    roomCode,
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
  return rooms[roomCode];
};

const getRoom = (roomCode) => {
  if (!roomCode) return null;
  return rooms[roomCode.toUpperCase()];
};

const removeRoom = (roomCode) => {
  if (!roomCode) return;
  const room = rooms[roomCode.toUpperCase()];
  if (room && room.timerInterval) {
    clearInterval(room.timerInterval);
  }
  delete rooms[roomCode.toUpperCase()];
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
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    
    // Transfer player state to the new socket id
    room.players[socketId] = {
      ...player,
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

  // Grace period: Wait 30 seconds for reconnection
  player.disconnectTimer = setTimeout(() => {
    // Clean up player state
    delete room.players[socketId];

    // If host left, assign new host from remaining active players
    if (room.hostSocketId === socketId || room.hostUserId === player.userId) {
      const activeSocketIds = Object.keys(room.players).filter(
        (sid) => room.players[sid].online
      );
      if (activeSocketIds.length > 0) {
        const nextSocketId = activeSocketIds[0];
        room.hostSocketId = nextSocketId;
        room.hostUserId = room.players[nextSocketId].userId;
        if (onHandoff) onHandoff(nextSocketId, room.players[nextSocketId].username);
      }
    }

    // If no players are left in the room, destroy it
    if (Object.keys(room.players).length === 0) {
      removeRoom(roomCode);
      if (onDestroy) onDestroy();
    }
  }, 30000); // 30 seconds window

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
  createRoom,
  getRoom,
  removeRoom,
  addPlayer,
  removePlayer,
  setPlayerReady,
  checkAllReady,
  getRoomScores,
};
