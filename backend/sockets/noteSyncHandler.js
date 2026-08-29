const otSyncService = require('../services/otSyncService');
let redisService = null;
try {
  redisService = require('../services/redisService');
} catch (e) {}

const redisConfig = require('../config/redis');
const logger = require('../utils/logger');

// Local participant tracker for note rooms
const activeParticipants = new Map(); // noteId -> Set of socket.ids

async function getCachedNoteContent(noteId) {
  let content = null;
  const key = `note:${noteId}:content`;

  if (redisService && redisService.isReady && redisService.client) {
    try {
      content = await redisService.client.get(key);
    } catch (e) {}
  }

  if (content === null && typeof redisConfig.getCache === 'function') {
    try {
      content = await redisConfig.getCache(key);
    } catch (e) {}
  }

  return content !== null && content !== undefined ? content : '';
}

async function setCachedNoteContent(noteId, text) {
  const key = `note:${noteId}:content`;

  if (redisService && redisService.isReady && redisService.client) {
    try {
      await redisService.client.set(key, text);
    } catch (e) {}
  }

  if (typeof redisConfig.setCache === 'function') {
    try {
      await redisConfig.setCache(key, text);
    } catch (e) {}
  }
}

function registerSocketEvents(socket, io) {
  // 1. Join note collaboration room (join_note & ot:join_room)
  socket.on('join_note', async ({ noteId, userId, username } = {}) => {
    if (!noteId) return;

    const roomName = `note:${noteId}`;
    socket.join(roomName);
    socket.noteId = noteId;
    socket.userId = userId;
    socket.username = username || 'Anonymous Student';

    socket.data = socket.data || {};
    socket.data.noteId = noteId;
    socket.data.userId = userId;
    socket.data.user = { id: userId, name: socket.username };

    if (!activeParticipants.has(noteId)) {
      activeParticipants.set(noteId, new Set());
    }
    activeParticipants.get(noteId).add(socket.id);

    const currentText = await getCachedNoteContent(noteId);
    const history = typeof otSyncService.getHistory === 'function' ? otSyncService.getHistory(noteId) : [];
    const currentVersion = history ? history.length : 0;

    socket.emit('note_snapshot', { text: currentText, version: currentVersion });
    socket.to(roomName).emit('ot:peer_joined', { socketId: socket.id, user: socket.data.user });
  });

  socket.on('ot:join_room', async ({ noteId, user } = {}) => {
    if (!noteId) {
      return socket.emit('ot:error', { message: 'noteId is required.' });
    }

    const roomName = `note:${noteId}`;
    socket.join(noteId);
    socket.join(roomName);
    socket.data = socket.data || {};
    socket.data.noteId = noteId;
    socket.data.user = user || { name: 'Anonymous Student' };
    socket.noteId = noteId;

    if (!activeParticipants.has(noteId)) {
      activeParticipants.set(noteId, new Set());
    }
    activeParticipants.get(noteId).add(socket.id);

    socket.to(noteId).emit('ot:peer_joined', {
      socketId: socket.id,
      user: socket.data.user,
    });
  });

  // 2. Handle incoming OT document modifications (edit_op & ot:edit)
  socket.on('edit_op', async ({ op, version } = {}) => {
    const noteId = socket.noteId || (socket.data && socket.data.noteId);
    const userId = socket.userId || (socket.data && socket.data.userId);

    if (!noteId || !op) return;

    let transformedOp = op;
    let newVersion = (version || 0) + 1;

    if (typeof otSyncService.applyOperation === 'function') {
      const res = otSyncService.applyOperation(noteId, { ...op, userId }, version || 0);
      transformedOp = res.transformedOp;
      newVersion = res.newVersion;
    }

    const currentText = await getCachedNoteContent(noteId);
    let updatedText = currentText;

    if (transformedOp.type === 'insert') {
      const pos = transformedOp.position !== undefined ? transformedOp.position : 0;
      const insText = transformedOp.text || '';
      updatedText = currentText.slice(0, pos) + insText + currentText.slice(pos);
    } else if (transformedOp.type === 'delete') {
      const pos = transformedOp.position !== undefined ? transformedOp.position : 0;
      const delLen = transformedOp.length !== undefined ? transformedOp.length : 1;
      updatedText = currentText.slice(0, pos) + currentText.slice(pos + delLen);
    } else if (Array.isArray(transformedOp) && typeof otSyncService.applyOpToString === 'function') {
      updatedText = otSyncService.applyOpToString(currentText, transformedOp);
    }

    await setCachedNoteContent(noteId, updatedText);

    socket.to(`note:${noteId}`).emit('edit_op_broadcast', { op: transformedOp, version: newVersion });
    socket.to(noteId).emit('edit_op_broadcast', { op: transformedOp, version: newVersion });
  });

  socket.on('ot:edit', async ({ noteId, revision, op } = {}, callback) => {
    const targetNote = noteId || (socket.data && socket.data.noteId);
    if (!targetNote || !op) {
      return callback && callback({ success: false, error: 'Invalid parameters.' });
    }

    try {
      const result = await otSyncService.processEdit(targetNote, revision, op, socket.id);

      if (callback) callback({ success: true, revision: result.revision });

      socket.to(targetNote).emit('ot:edited', {
        noteId: targetNote,
        revision: result.revision,
        op: result.op,
        content: result.content,
        senderSocketId: socket.id,
      });
    } catch (err) {
      if (logger && logger.error) logger.error('[OTSocket] Edit transformation failed', { targetNote, error: err.message });
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // 3. Track collaborative real-time cursor presence (cursor_presence & ot:cursor)
  socket.on('cursor_presence', ({ cursorPosition } = {}) => {
    const noteId = socket.noteId || (socket.data && socket.data.noteId);
    const userId = socket.userId || (socket.data && socket.data.userId);

    if (!noteId) return;

    socket.to(`note:${noteId}`).emit('cursor_presence_broadcast', {
      userId,
      cursorPosition,
    });
  });

  socket.on('ot:cursor', ({ noteId, selection } = {}) => {
    const targetNote = noteId || (socket.data && socket.data.noteId);
    if (!targetNote) return;

    socket.to(targetNote).emit('ot:cursor_moved', {
      senderSocketId: socket.id,
      user: socket.data && socket.data.user,
      selection,
    });
  });

  // 4. Handle disconnect cleanup
  socket.on('disconnect', () => {
    const noteId = socket.noteId || (socket.data && socket.data.noteId);
    const userId = socket.userId || (socket.data && socket.data.userId);

    if (noteId) {
      socket.to(`note:${noteId}`).emit('user_left_note', { userId });
      socket.to(noteId).emit('user_left_note', { userId });
      socket.to(noteId).emit('ot:peer_left', { socketId: socket.id });

      if (activeParticipants.has(noteId)) {
        activeParticipants.get(noteId).delete(socket.id);
        if (activeParticipants.get(noteId).size === 0) {
          activeParticipants.delete(noteId);
        }
      }
    }
  });
}

module.exports = function noteSyncHandler(io, socket) {
  if (socket) {
    registerSocketEvents(socket, io);
    return;
  }

  const nsp = io && io.of ? io.of('/note-sync') : io;
  if (nsp && typeof nsp.on === 'function') {
    nsp.on('connection', (sock) => {
      registerSocketEvents(sock, io);
    });
  }

  return nsp;
};

module.exports.activeParticipants = activeParticipants;
