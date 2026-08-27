const quizRoomSocket = require('./quizRoomSocket');

/**
 * Initializes all WebSocket modules under backend/src/socket
 * @param {import('socket.io').Server} io
 */
module.exports = function initSockets(io) {
  quizRoomSocket(io);
};

module.exports.quizRoomSocket = quizRoomSocket;
