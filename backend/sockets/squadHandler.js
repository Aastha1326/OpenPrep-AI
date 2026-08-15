const { SquadMember } = require('../models');

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_squad_room', async ({ squadId }) => {
      try {
        if (!squadId || !socket.user?.id) return;
        const member = await SquadMember.findOne({ where: { squadId, userId: socket.user.id } });
        if (!member) return;
        socket.join(`squad:${squadId}`);
      } catch (err) {
        console.error('Error joining squad room:', err);
      }
    });

    socket.on('leave_squad_room', ({ squadId }) => {
      if (!squadId) return;
      socket.leave(`squad:${squadId}`);
    });
  });
};