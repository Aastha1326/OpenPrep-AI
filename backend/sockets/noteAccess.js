const { Note } = require('../models');

/**
 * Admission rules for the collaborative-note rooms.
 *
 * The io.use() middleware in server.js proves *who* a socket is. It says
 * nothing about *what* that identity may open, and until issue #1107 no handler
 * asked: `yjs-join-room` joined whatever noteId arrived in the payload, fetched
 * the note and streamed its full text back. Any signed-in user could read, and
 * then overwrite, any other user's private notes by id alone.
 *
 * The rules live here rather than inline in the handler for the same reason
 * battleRoomAccess.js exists: admission logic is worth testing on its own,
 * without a socket server or a Yjs document in the way.
 */

const ROOM_PREFIX = 'note-collab-';

/** No relationship to the note — the join must be refused outright. */
const ACCESS_NONE = 'none';
/** May receive document state, but updates from this socket are discarded. */
const ACCESS_READ = 'read';
/** May receive state and persist updates. */
const ACCESS_WRITE = 'write';

const roomName = (noteId) => `${ROOM_PREFIX}${noteId}`;

/**
 * Decides what a user may do with a note.
 *
 * The Note model carries a single owner (`user`) plus `isCollaborative` and
 * `isPublic` flags, and there is no collaborator join table — so "may edit"
 * can only mean the owner, or a note explicitly opened up for collaboration.
 * `isPublic` is a sharing flag, not an editing one, so it grants read only.
 *
 * @param {{ user?: string, isCollaborative?: boolean, isPublic?: boolean }|null} note
 * @param {string|null|undefined} userId Authenticated user id, from socket.user.
 * @returns {'none'|'read'|'write'}
 */
function resolveAccess(note, userId) {
  if (!note || !userId) return ACCESS_NONE;

  // String comparison: ids are UUIDs and may arrive as either a string or a
  // Sequelize value, and `==` here would let a nullish pair match.
  if (note.user && String(note.user) === String(userId)) return ACCESS_WRITE;

  if (note.isCollaborative === true) return ACCESS_WRITE;
  if (note.isPublic === true) return ACCESS_READ;

  return ACCESS_NONE;
}

const canRead = (level) => level === ACCESS_READ || level === ACCESS_WRITE;
const canWrite = (level) => level === ACCESS_WRITE;

/**
 * Loads the note and resolves the caller's access to it in one step.
 *
 * A missing note is reported as `none` rather than "not found", so a probing
 * client cannot tell an id that does not exist from one it may not touch.
 *
 * @param {string} noteId
 * @param {string} userId
 * @param {{ findByPk: Function }} [model] Injectable for tests.
 * @returns {Promise<{ level: 'none'|'read'|'write', note: object|null }>}
 */
async function authorizeNote(noteId, userId, model = Note) {
  if (!noteId || !userId) return { level: ACCESS_NONE, note: null };

  const note = await model.findByPk(noteId);

  return { level: resolveAccess(note, userId), note: note || null };
}

module.exports = {
  ROOM_PREFIX,
  ACCESS_NONE,
  ACCESS_READ,
  ACCESS_WRITE,
  roomName,
  resolveAccess,
  canRead,
  canWrite,
  authorizeNote,
};
