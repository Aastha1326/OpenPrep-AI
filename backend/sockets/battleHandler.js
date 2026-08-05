const { createRoomState, roomRequiresPassword, isPasswordValid } = require('./battleRoomAccess');

const rooms = {};

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

const addPlayerToRoom = ({ io, socket, roomId, username, roomName, password }) => {
  if (!rooms[roomId]) {
    rooms[roomId] = createRoomState({ roomId, roomName, password });
  }

  if (password) {
    rooms[roomId].password = password;
  }

  if (roomName) {
    rooms[roomId].name = roomName;
  }

  rooms[roomId].players[socket.id] = {
    username: username || 'Anonymous',
    score: 0,
    isReady: false,
    online: true,
  };

  io.to(roomId).emit('room_update', {
    players: rooms[roomId].players,
    status: rooms[roomId].status,
  });

  io.to(roomId).emit('presence_update', {
    socketId: socket.id,
    username: username || 'Anonymous',
    online: true,
  });

  return rooms[roomId];
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const handleJoinAttempt = (payload, callback) => {
      const roomId = (payload?.roomId || '').toUpperCase();
      const username = payload?.username || 'Anonymous';
      const roomName = payload?.roomName || 'Battle Room';
      const enteredPassword = payload?.password || '';

      if (!roomId) {
        if (callback) {
          callback({ success: false, message: 'A room code is required.' });
        }
        return;
      }

      const existingRoom = rooms[roomId];
      if (existingRoom && roomRequiresPassword(existingRoom) && !isPasswordValid(existingRoom, enteredPassword)) {
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
      const room = addPlayerToRoom({
        io,
        socket,
        roomId,
        username,
        roomName,
        password: enteredPassword,
      });

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

      console.log(`User ${username} joined room ${roomId}`);
    };

    socket.on('create-room', (payload, callback) => {
      handleJoinAttempt({ ...payload, password: payload?.password || '' }, callback);
    });

    socket.on('join-room', (payload, callback) => {
      handleJoinAttempt(payload, callback);
    });

    socket.on('join_room', (payload, callback) => {
      const normalizedPayload = typeof payload === 'string'
        ? { roomId: payload, username: 'Anonymous' }
        : payload;
      handleJoinAttempt(normalizedPayload, callback);
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
