const crypto = require('crypto');

// In-memory room storage (can be scaled with Redis adapter if needed)
const activeRooms = new Map();

function setupQuizBattleSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Create Room with 6-character room code
    socket.on('create-room', ({ hostName, quizId }) => {
      const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      
      const room = {
        roomCode,
        hostId: socket.id,
        quizId,
        status: 'lobby', // 'lobby' | 'countdown' | 'active' | 'finished'
        players: [{ id: socket.id, name: hostName, score: 0, connected: true }],
        currentQuestionIndex: 0,
        timer: 30,
      };

      activeRooms.set(roomCode, room);
      socket.join(roomCode);
      socket.emit('room-created', { roomCode, room });
    });

    // 2. Join Room with 6-character code
    socket.on('join-room', ({ roomCode, playerName }) => {
      const room = activeRooms.get(roomCode);
      if (!room) {
        return socket.emit('error-message', { message: 'Room not found with this code.' });
      }
      if (room.status !== 'lobby') {
        return socket.emit('error-message', { message: 'Battle already in progress.' });
      }

      socket.join(roomCode);
      room.players.push({ id: socket.id, name: playerName, score: 0, connected: true });
      
      io.to(roomCode).emit('update-lobby', room);
    });

    // 3. Start Synchronized Quiz Countdown & Battle
    socket.on('start-battle', ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.status = 'countdown';
      let countdown = 5;

      const countdownInterval = setInterval(() => {
        io.to(roomCode).emit('countdown-tick', { countdown });
        countdown--;
        if (countdown < 0) {
          clearInterval(countdownInterval);
          room.status = 'active';
          io.to(roomCode).emit('start-questions', { questionIndex: room.currentQuestionIndex });
        }
      }, 1000);
    });

    // 4. Handle Option Submission & Live Leaderboard Update
    socket.on('submit-answer', ({ roomCode, isCorrect, timeRemaining }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player && isCorrect) {
        // Award points based on speed (time remaining) + base score
        player.score += 100 + (timeRemaining * 5);
      }

      // Sort leaderboard descending by score
      const sortedLeaderboard = [...room.players].sort((a, b) => b.score - a.score);
      io.to(roomCode).emit('live-leaderboard', { leaderboard: sortedLeaderboard });
    });

    // 5. Reconnection Handling for Transient Drops
    socket.on('disconnect', () => {
      for (let [roomCode, room] of activeRooms.entries()) {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.connected = false;
          io.to(roomCode).emit('update-lobby', room);
          
          // Clean up room after 2 minutes if player doesn't reconnect
          setTimeout(() => {
            if (!player.connected) {
              room.players = room.players.filter((p) => p.id !== socket.id);
              if (room.players.length === 0) activeRooms.delete(roomCode);
              else io.to(roomCode).emit('update-lobby', room);
            }
          }, 120000);
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupQuizBattleSocket;
