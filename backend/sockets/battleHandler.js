const {
  createRoomState,
  roomRequiresPassword,
  isPasswordValid,
  generateRoomCode,
  validateRoomCode,
} = require('./battleRoomAccess');

const rooms = {};

const MAX_ROOM_CODE_ATTEMPTS = 5;

const isAllReady = (room) => {
  const playerKeys = Object.keys(room.players);
  return playerKeys.length > 1 && playerKeys.every((id) => room.players[id].isReady);
};

const tryStartBattle = (io, roomId) => {
  const room = rooms[roomId];
  if (!room || room.status !== 'waiting' || !isAllReady(room)) return;

  room.status = 'playing';
  io.to(roomId).emit('battle_start', {
    message: 'All players ready! Battle starts now!',
  });
  io.to(roomId).emit('room_update', {
    players: room.players,
    status: room.status,
  });
};

const normalizeRoomCode = (code) => (code || '').trim().toUpperCase();

const allocateRoomCode = () => {
  for (let i = 0; i < MAX_ROOM_CODE_ATTEMPTS; i += 1) {
    const code = generateRoomCode();
    if (!rooms[code]) return code;
  }
  return null;
};

const addPlayerToRoom = ({ io, socket, roomId, username }) => {
  const room = rooms[roomId];
  if (!room) return null;

  room.players[socket.id] = {
    username: username || 'Anonymous',
    score: 0,
    isReady: false,
    online: true,
  };

  io.to(roomId).emit('room_update', {
    players: room.players,
    status: room.status,
  });

  io.to(roomId).emit('presence_update', {
    socketId: socket.id,
    username: username || 'Anonymous',
    online: true,
  });

  return room;
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const handleCreateRoom = (payload, callback) => {
      const suppliedCode = normalizeRoomCode(payload?.roomId);
      const username = payload?.username || 'Anonymous';
      const roomName = (payload?.roomName || 'Battle Room').trim() || 'Battle Room';
      const password = payload?.password || '';

      if (suppliedCode && rooms[suppliedCode]) {
        if (callback) {
          callback({
            success: false,
            message: `Room code ${suppliedCode} is already in use. Try joining it instead.`,
          });
        }
        return;
      }

      if (suppliedCode && !validateRoomCode(suppliedCode)) {
        if (callback) {
          callback({
            success: false,
            message: 'Room code must be exactly 6 letters or numbers.',
          });
        }
        return;
      }

      const roomId = suppliedCode || allocateRoomCode();
      if (!roomId) {
        if (callback) {
          callback({
            success: false,
            message: 'Could not allocate a room code. Please try again.',
          });
        }
        return;
      }

      rooms[roomId] = createRoomState({ roomId, roomName, password });
      socket.join(roomId);
      const room = addPlayerToRoom({ io, socket, roomId, username });

      if (callback) {
        callback({
          success: true,
          roomId,
          room: {
            id: room.id,
            name: room.name,
            password: room.password,
          },
          isPrivate: roomRequiresPassword(room),
        });
      }

      console.log(`User ${username} created room ${roomId}`);
    };

    const handleJoinRoom = (payload, callback) => {
      const roomId = normalizeRoomCode(payload?.roomId);
      const username = payload?.username || 'Anonymous';
      const enteredPassword = payload?.password || '';

      if (!roomId) {
        if (callback) {
          callback({ success: false, message: 'A room code is required.' });
        }
        return;
      }

      const room = rooms[roomId];
      if (!room) {
        if (callback) {
          callback({
            success: false,
            message: `Room ${roomId} not found. Check the code and try again.`,
          });
        }
        return;
      }

      if (roomRequiresPassword(room) && !isPasswordValid(room, enteredPassword)) {
        if (callback) {
          callback({
            success: false,
            requiresPassword: true,
            message: 'Incorrect password',
          });
        }
        return;
      }

      socket.join(roomId);
      const joinedRoom = addPlayerToRoom({ io, socket, roomId, username });

      if (callback) {
        callback({
          success: true,
          roomId,
          room: {
            id: joinedRoom.id,
            name: joinedRoom.name,
            password: joinedRoom.password,
          },
          isPrivate: roomRequiresPassword(joinedRoom),
        });
      }

      console.log(`User ${username} joined room ${roomId}`);
    };

    socket.on('create-room', (payload, callback) => {
      handleCreateRoom(payload, callback);
    });

    socket.on('join-room', (payload, callback) => {
      handleJoinRoom(payload, callback);
    });

    socket.on('join_room', (payload, callback) => {
      const normalizedPayload =
        typeof payload === 'string' ? { roomId: payload, username: 'Anonymous' } : payload;
      handleJoinRoom(normalizedPayload, callback);
    });

    // Re-sync a client's view of the room (e.g. after the tab regains focus)
    socket.on('request_sync', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      socket.emit('room_update', {
        players: room.players,
        status: room.status,
      });
    });
    socket.on('toggle_ready', ({ roomId }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (!player) return;

      player.isReady = !player.isReady;

      io.to(roomId).emit('user:ready', {
        socketId: socket.id,
        username: player.username,
        isReady: player.isReady,
      });

      io.to(roomId).emit('room_update', {
        players: rooms[roomId].players,
        status: rooms[roomId].status,
      });

      tryStartBattle(io, roomId);
    });

    socket.on('user:ready', ({ roomId, isReady }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (!player) return;

      player.isReady = !!isReady;

      io.to(roomId).emit('user:ready', {
        socketId: socket.id,
        username: player.username,
        isReady: player.isReady,
      });

      io.to(roomId).emit('room_update', {
        players: rooms[roomId].players,
        status: rooms[roomId].status,
      });

      tryStartBattle(io, roomId);
    });

    socket.on('user:typing', ({ roomId, isTyping }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (!player) return;

      socket.to(roomId).emit('user:typing', {
        socketId: socket.id,
        username: player.username,
        isTyping: !!isTyping,
      });
    });

    socket.on('submit_answer', ({ roomId, isCorrect, points = 10 }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (player && rooms[roomId].status === 'playing') {
        if (isCorrect) {
          player.score += points;
        }

        io.to(roomId).emit('score_update', {
          players: rooms[roomId].players,
        });
      }
    });

    socket.on('leave-room', ({ roomId }) => {
      const room = rooms[roomId];
      const player = room && room.players[socket.id];
      if (!room || !player) return;

      delete room.players[socket.id];
      socket.leave(roomId);

      if (Object.keys(room.players).length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('presence_update', {
          socketId: socket.id,
          username: player.username,
          online: false,
        });
        io.to(roomId).emit('player_left', { username: player.username });
        io.to(roomId).emit('room_update', {
          players: room.players,
          status: room.status,
        });
      }

      console.log(`User ${player.username} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          const username = rooms[roomId].players[socket.id].username;
          delete rooms[roomId].players[socket.id];

          io.to(roomId).emit('presence_update', {
            socketId: socket.id,
            username,
            online: false,
          });

          if (Object.keys(rooms[roomId].players).length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit('player_left', { username });
            io.to(roomId).emit('room_update', {
              players: rooms[roomId].players,
              status: rooms[roomId].status,
            });
          }
          break;
        }
      }
    });
  });
};
