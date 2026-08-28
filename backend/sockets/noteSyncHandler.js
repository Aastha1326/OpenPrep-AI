const { processEdit } = require('../services/otSyncService');
const logger = require('../utils/logger');

// Local participant tracker for note rooms
const activeParticipants = new Map(); // noteId -> Set of socket.ids

module.exports = (io) => {
  const nsp = io.of ? io.of('/note-sync') : io;

  nsp.on('connection', (socket) => {
    logger.info('OT Note Sync Socket connected', { socketId: socket.id });

    // Join OT collaboration room
    socket.on('ot:join_room', async ({ noteId, user } = {}) => {
      if (!noteId) {
        return socket.emit('ot:error', { message: 'noteId is required.' });
      }

      socket.join(noteId);
      socket.data.noteId = noteId;
      socket.data.user = user || { name: 'Anonymous Student' };

      if (!activeParticipants.has(noteId)) {
        activeParticipants.set(noteId, new Set());
      }
      activeParticipants.get(noteId).add(socket.id);

      // Notify other peers in note
      socket.to(noteId).emit('ot:peer_joined', {
        socketId: socket.id,
        user: socket.data.user,
      });

      logger.info('Collaborator joined OT note room', { noteId, socketId: socket.id });
    });

    // Handle character operation transformations
    socket.on('ot:edit', async ({ noteId, revision, op } = {}, callback) => {
      const targetNote = noteId || socket.data.noteId;
      if (!targetNote || !op) {
        return callback && callback({ success: false, error: 'Invalid parameters.' });
      }

      try {
        const result = await processEdit(targetNote, revision, op, socket.id);

        // Acknowledge the client operation
        if (callback) callback({ success: true, revision: result.revision });

        // Broadcast the transformed operation to all other collaborators in the room
        socket.to(targetNote).emit('ot:edited', {
          noteId: targetNote,
          revision: result.revision,
          op: result.op,
          content: result.content,
          senderSocketId: socket.id,
        });
      } catch (err) {
        logger.error('[OTSocket] Edit transformation failed', { targetNote, error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Share real-time cursor selection
    socket.on('ot:cursor', ({ noteId, selection } = {}) => {
      const targetNote = noteId || socket.data.noteId;
      if (!targetNote) return;

      socket.to(targetNote).emit('ot:cursor_moved', {
        senderSocketId: socket.id,
        user: socket.data.user,
        selection,
      });
    });

    // Handle collaborator exit
    socket.on('disconnect', () => {
      const noteId = socket.data.noteId;
      if (noteId && activeParticipants.has(noteId)) {
        activeParticipants.get(noteId).delete(socket.id);
        if (activeParticipants.get(noteId).size === 0) {
          activeParticipants.delete(noteId);
        }

        socket.to(noteId).emit('ot:peer_left', {
          socketId: socket.id,
        });

        logger.info('Collaborator disconnected from OT note room', { noteId, socketId: socket.id });
      }
    });
  });

  return nsp;
};

module.exports.activeParticipants = activeParticipants;
