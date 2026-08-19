const logger = require('../utils/logger');

const rooms = {};

/**
 * Longest message accepted. Chat is broadcast to every peer in the room, so an
 * unbounded payload is an amplification primitive, not just a large message.
 */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * The display name for a socket, taken from the token the io.use() middleware
 * verified — never from the event payload.
 *
 * The payload used to win, so any client could join as any name and every
 * message it sent was attributed to that name for the rest of the session
 * (issue #1107).
 */
const displayName = (socket) => socket.user?.name || socket.user?.email || 'Anonymous';

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.debug('study chat socket connected', { socketId: socket.id, userId: socket.user?.id });

    // Join a study chat room
    socket.on('join_chat_room', ({ roomId }) => {
      if (!roomId) return;
      if (!socket.user?.id) return;

      const user = displayName(socket);
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

      logger.debug('user joined study chat room', { roomId, userId: socket.user.id });
    });

    // Send chat message
    socket.on('send_chat_message', ({ roomId, messageText }) => {
      if (!roomId || typeof messageText !== 'string') return;

      const text = messageText.trim();
      if (!text || text.length > MAX_MESSAGE_LENGTH) return;

      // Only a socket that actually joined the room may post to it.
      if (!rooms[roomId] || !rooms[roomId].users[socket.id]) return;

      const messagePayload = {
        id: Math.random().toString(36).substring(2, 9),
        sender: rooms[roomId].users[socket.id],
        text,
        timestamp: new Date().toISOString(),
      };

      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit('new_chat_message', messagePayload);
    });

    // Live typing indicator
    socket.on('user:typing', ({ roomId, isTyping }) => {
      if (!roomId) return;
      if (!rooms[roomId] || !rooms[roomId].users[socket.id]) return;

      const sender = rooms[roomId].users[socket.id];

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

        logger.debug('user left study chat room', { roomId, userId: socket.user?.id });
      }
    });

    // Handle sudden disconnect
    socket.on('disconnect', () => {
      logger.debug('study chat socket disconnected', { socketId: socket.id });

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

          logger.debug('cleared disconnected user from study chat room', {
            roomId,
            userId: socket.user?.id,
          });
          break;
        }
      }
    });
  });
};
