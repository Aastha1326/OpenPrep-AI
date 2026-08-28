module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_activity_room', async ({ userId }) => {
      try {
        if (!userId || !socket.user?.id) return;
        if (String(socket.user.id) !== String(userId)) return;
        socket.join(`activity:${userId}`);
      } catch (err) {
        console.error('Error joining activity room:', err);
      }
    });

    socket.on('leave_activity_room', ({ userId }) => {
      if (!userId) return;
      socket.leave(`activity:${userId}`);
    });
  });
};