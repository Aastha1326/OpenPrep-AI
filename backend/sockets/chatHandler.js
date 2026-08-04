const rooms = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected for study chat: ${socket.id}`);

    // Join a study chat room
    socket.on('join_chat_room', ({ roomId, username }) => {
      if (!roomId) return;

      const user = username || 'Anonymous';
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          users: {},
        };
      }

      // Add user to the room's active users list
      rooms[roomId].users[socket.id] = user;

      // Broadcast the list of active users to everyone in the room
      io.to(roomId).emit('chat_room_update', {
        users: Object.values(rooms[roomId].users),
      });

      console.log(`User ${user} joined chat room ${roomId}`);
    });

    // Send chat message
    socket.on('send_chat_message', ({ roomId, messageText }) => {
      if (!roomId || !messageText) return;

      const sender = (rooms[roomId] && rooms[roomId].users[socket.id]) || 'Anonymous';

      const messagePayload = {
        id: Math.random().toString(36).substring(2, 9),
        sender,
        text: messageText,
        timestamp: new Date().toISOString(),
      };

      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit('new_chat_message', messagePayload);
    });

    // Live typing indicator
    socket.on('user:typing', ({ roomId, isTyping }) => {
      if (!roomId) return;

      const sender = (rooms[roomId] && rooms[roomId].users[socket.id]) || 'Anonymous';

      // socket.to excludes the sender
      socket.to(roomId).emit('user:typing', {
        username: sender,
        isTyping: !!isTyping,
      });
    });

    // Explicitly leave chat room
    socket.on('leave_chat_room', ({ roomId }) => {
      if (!roomId) return;

      socket.leave(roomId);

      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        const username = rooms[roomId].users[socket.id];
        delete rooms[roomId].users[socket.id];

        // Notify remaining users of updated list
        io.to(roomId).emit('chat_room_update', {
          users: Object.values(rooms[roomId].users),
        });

        // Clear any lingering typing indicator from this user
        socket.to(roomId).emit('user:typing', {
          username,
          isTyping: false,
        });

        // Clean up empty rooms
        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
        }

        console.log(`User ${username} left chat room ${roomId}`);
      }
    });

    // Handle sudden disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Search all rooms to remove this user
      for (const roomId in rooms) {
        if (rooms[roomId].users[socket.id]) {
          const username = rooms[roomId].users[socket.id];
          delete rooms[roomId].users[socket.id];

          // Notify remaining users of updated list
          io.to(roomId).emit('chat_room_update', {
            users: Object.values(rooms[roomId].users),
          });

          // Clear any lingering typing indicator from this user
          socket.to(roomId).emit('user:typing', {
            username,
            isTyping: false,
          });

          // Clean up empty rooms
          if (Object.keys(rooms[roomId].users).length === 0) {
            delete rooms[roomId];
          }

          console.log(`Disconnected user ${username} cleared from chat room ${roomId}`);
          break;
        }
      }
    });
  });
};
