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

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a battle room
    socket.on('join_room', ({ roomId, username }) => {
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          players: {},
          status: 'waiting',
          questions: [],
        };
      }

      rooms[roomId].players[socket.id] = {
        username: username || 'Anonymous',
        score: 0,
        isReady: false,
        online: true,
      };

      // Notify everyone in the room about the updated players list
      io.to(roomId).emit('room_update', {
        players: rooms[roomId].players,
        status: rooms[roomId].status,
      });

      // Broadcast presence so clients can track who is online
      io.to(roomId).emit('presence_update', {
        socketId: socket.id,
        username: username || 'Anonymous',
        online: true,
      });

      console.log(`User ${username} joined room ${roomId}`);
    });

    // Player toggles ready status
    socket.on('toggle_ready', ({ roomId }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (!player) return;

      player.isReady = !player.isReady;

      // Live readiness broadcast
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

    // Explicit ready-state update (live presence in lobby)
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

    // Live typing / answering indicator
    socket.on('user:typing', ({ roomId, isTyping }) => {
      const player = rooms[roomId] && rooms[roomId].players[socket.id];
      if (!player) return;

      // socket.to excludes the sender
      socket.to(roomId).emit('user:typing', {
        socketId: socket.id,
        username: player.username,
        isTyping: !!isTyping,
      });
    });

    // Submit answer and update score
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

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Find and remove user from any rooms
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          const username = rooms[roomId].players[socket.id].username;
          delete rooms[roomId].players[socket.id];

          // Broadcast presence so clients can clear offline users
          io.to(roomId).emit('presence_update', {
            socketId: socket.id,
            username,
            online: false,
          });

          // If room is empty, delete it
          if (Object.keys(rooms[roomId].players).length === 0) {
            delete rooms[roomId];
          } else {
            // Notify remaining players
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
