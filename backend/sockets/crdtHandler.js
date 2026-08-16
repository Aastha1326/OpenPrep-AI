const Y = require('yjs');
const { Note } = require('../models');
const logger = require('../utils/logger');
const { roomName, authorizeNote, canRead, canWrite, ACCESS_NONE } = require('./noteAccess');

/**
 * Realtime collaborative editing for notes.
 *
 * Every event here is authorized against the note's owner before it is acted
 * on (issue #1107). Connection-level authentication is not enough: a valid
 * token proves identity, not entitlement to a particular noteId.
 */

const PERSIST_DEBOUNCE_MS = 2000;

/** noteId -> { doc, debouncer, participants: Set<socketId> } */
const activeDocs = new Map();

/**
 * Loads a note's document into memory, or returns the copy already there.
 * Callers must have been authorized first — this does no checking of its own.
 */
function openDoc(noteId, note) {
  const existing = activeDocs.get(noteId);
  if (existing) return existing;

  const doc = new Y.Doc();

  if (note.docState) {
    Y.applyUpdate(doc, new Uint8Array(note.docState));
  } else if (note.content) {
    doc.getText('content').insert(0, note.content);
  }

  const entry = { doc, debouncer: null, participants: new Set() };
  activeDocs.set(noteId, entry);

  return entry;
}

function persist(noteId, doc, noteModel) {
  return noteModel.update(
    {
      docState: Buffer.from(Y.encodeStateAsUpdate(doc)),
      content: doc.getText('content').toString(),
    },
    { where: { id: noteId } }
  );
}

/**
 * Drops a socket from a document and, once the last participant leaves,
 * flushes any pending write and releases the doc.
 *
 * Without this, every note ever opened kept a Y.Doc and a live timer for the
 * lifetime of the process. The old disconnect listener claimed "cleanups occur
 * dynamically as rooms empty out" and did nothing at all.
 */
async function releaseDoc(noteId, socketId, noteModel) {
  const entry = activeDocs.get(noteId);
  if (!entry) return;

  entry.participants.delete(socketId);
  if (entry.participants.size > 0) return;

  if (entry.debouncer) {
    clearTimeout(entry.debouncer);
    entry.debouncer = null;

    // A pending debounce means edits are in the doc but not yet in the
    // database. Dropping the doc now would lose them.
    try {
      await persist(noteId, entry.doc, noteModel);
    } catch (err) {
      logger.error('failed to flush collaborative note on release', {
        noteId,
        error: err.message,
      });
    }
  }

  entry.doc.destroy();
  activeDocs.delete(noteId);
}

/**
 * @param {object} io Socket.io server.
 * @param {{ noteModel?: object }} [deps] Injection seam — the backend's Vitest
 *   setup does not intercept CJS `require`, so module-level mocking of the
 *   Sequelize models is not available to these tests.
 */
module.exports = (io, deps = {}) => {
  const noteModel = deps.noteModel || Note;

  io.on('connection', (socket) => {
    /** noteId -> access level granted to *this* socket at join time. */
    const grants = new Map();

    const denyJoin = (noteId, reason) => {
      logger.warn('collaborative note join denied', {
        noteId,
        userId: socket.user?.id,
        socketId: socket.id,
        reason,
      });
      socket.emit('collab-error', { noteId, message: 'You do not have access to this note.' });
    };

    socket.on('yjs-join-room', async ({ noteId } = {}) => {
      if (!noteId) return;

      const userId = socket.user?.id;
      if (!userId) return denyJoin(noteId, 'unauthenticated socket');

      try {
        const { level, note } = await authorizeNote(noteId, userId, noteModel);

        if (!canRead(level)) return denyJoin(noteId, level === ACCESS_NONE ? 'no access' : level);

        grants.set(noteId, level);
        socket.join(roomName(noteId));

        const entry = openDoc(noteId, note);
        entry.participants.add(socket.id);

        socket.emit(
          'yjs-sync-step-1',
          Buffer.from(Y.encodeStateAsUpdate(entry.doc)).toString('base64')
        );

        // The client needs to know it may not write, so it can present the
        // note read-only rather than silently dropping the user's keystrokes.
        socket.emit('collab-access', { noteId, level });
      } catch (err) {
        logger.error('failed to load collaborative note state', { noteId, error: err.message });
        socket.emit('collab-error', { noteId, message: 'Could not open this note.' });
      }
    });

    socket.on('yjs-update', ({ noteId, payload } = {}) => {
      if (!noteId || !payload) return;

      // The grant is read from this socket's own join, never from the payload.
      if (!canWrite(grants.get(noteId))) {
        logger.warn('collaborative note update rejected', {
          noteId,
          userId: socket.user?.id,
          socketId: socket.id,
        });
        return;
      }

      const entry = activeDocs.get(noteId);
      if (!entry) return;

      try {
        Y.applyUpdate(entry.doc, new Uint8Array(Buffer.from(payload, 'base64')));

        socket.to(roomName(noteId)).emit('yjs-update', payload);

        if (entry.debouncer) clearTimeout(entry.debouncer);
        entry.debouncer = setTimeout(() => {
          entry.debouncer = null;
          persist(noteId, entry.doc, noteModel).catch((dbErr) => {
            logger.error('failed to persist collaborative note update', {
              noteId,
              error: dbErr.message,
            });
          });
        }, PERSIST_DEBOUNCE_MS);
      } catch (err) {
        logger.error('failed to apply collaborative note update', { noteId, error: err.message });
      }
    });

    socket.on('yjs-awareness', ({ noteId, payload } = {}) => {
      if (!noteId || !payload) return;

      // Presence is a read-level concern, but it still requires membership —
      // otherwise this is an open relay into any room.
      if (!canRead(grants.get(noteId))) return;

      socket.to(roomName(noteId)).emit('yjs-awareness', payload);
    });

    socket.on('yjs-leave-room', async ({ noteId } = {}) => {
      if (!noteId || !grants.has(noteId)) return;

      grants.delete(noteId);
      socket.leave(roomName(noteId));
      await releaseDoc(noteId, socket.id, noteModel);
    });

    socket.on('disconnect', async () => {
      const joined = [...grants.keys()];
      grants.clear();

      for (const noteId of joined) {
        await releaseDoc(noteId, socket.id, noteModel);
      }
    });
  });
};

// Exported for tests: lets a suite assert that documents are actually released.
module.exports.activeDocs = activeDocs;
