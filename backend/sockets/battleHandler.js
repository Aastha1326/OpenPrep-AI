const rooms = {};

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
      };

      // Notify everyone in the room about the updated players list
      io.to(roomId).emit('room_update', {
        players: rooms[roomId].players,
        status: rooms[roomId].status,
      });
      
      console.log(`User ${username} joined room ${roomId}`);
    });

    // Player toggles ready status
    socket.on('toggle_ready', ({ roomId }) => {
      if (rooms[roomId] && rooms[roomId].players[socket.id]) {
        rooms[roomId].players[socket.id].isReady = !rooms[roomId].players[socket.id].isReady;
        
        io.to(roomId).emit('room_update', {
          players: rooms[roomId].players,
          status: rooms[roomId].status,
        });

        // Check if all players are ready to start
        const playerKeys = Object.keys(rooms[roomId].players);
        const allReady = playerKeys.length > 1 && playerKeys.every(id => rooms[roomId].players[id].isReady);
        
        if (allReady && rooms[roomId].status === 'waiting') {
          rooms[roomId].status = 'playing';
          io.to(roomId).emit('battle_start', {
            message: 'All players ready! Battle starts now!',
          });
          io.to(roomId).emit('room_update', {
            players: rooms[roomId].players,
            status: rooms[roomId].status,
          });
        }
      }
    });

    // Submit answer and update score
    socket.on('submit_answer', ({ roomId, isCorrect, points = 10 }) => {
      if (rooms[roomId] && rooms[roomId].players[socket.id] && rooms[roomId].status === 'playing') {
        if (isCorrect) {
          rooms[roomId].players[socket.id].score += points;
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
