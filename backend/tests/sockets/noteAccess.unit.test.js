const {
  roomName,
  resolveAccess,
  canRead,
  canWrite,
  authorizeNote,
  ACCESS_NONE,
  ACCESS_READ,
  ACCESS_WRITE,
} = require('../../sockets/noteAccess');

const OWNER = '11111111-1111-1111-1111-111111111111';
const STRANGER = '22222222-2222-2222-2222-222222222222';

const note = (overrides = {}) => ({
  id: 'note-1',
  user: OWNER,
  isPublic: false,
  isCollaborative: false,
  ...overrides,
});

describe('noteAccess', () => {
  describe('roomName', () => {
    it('namespaces the room by note id', () => {
      expect(roomName('abc')).toBe('note-collab-abc');
    });
  });

  describe('resolveAccess', () => {
    it('grants write to the owner', () => {
      expect(resolveAccess(note(), OWNER)).toBe(ACCESS_WRITE);
    });

    it('grants write on a note explicitly opened for collaboration', () => {
      expect(resolveAccess(note({ isCollaborative: true }), STRANGER)).toBe(ACCESS_WRITE);
    });

    it('grants read only on a public note', () => {
      expect(resolveAccess(note({ isPublic: true }), STRANGER)).toBe(ACCESS_READ);
    });

    it('denies a stranger on a private note', () => {
      // The reported vulnerability: this used to be an unchecked join.
      expect(resolveAccess(note(), STRANGER)).toBe(ACCESS_NONE);
    });

    it('denies when the note does not exist', () => {
      expect(resolveAccess(null, OWNER)).toBe(ACCESS_NONE);
    });

    it('denies when there is no authenticated user', () => {
      expect(resolveAccess(note(), null)).toBe(ACCESS_NONE);
      expect(resolveAccess(note(), undefined)).toBe(ACCESS_NONE);
      expect(resolveAccess(note(), '')).toBe(ACCESS_NONE);
    });

    it('does not treat a note with no owner as owned by anyone', () => {
      expect(resolveAccess(note({ user: null }), STRANGER)).toBe(ACCESS_NONE);
      expect(resolveAccess(note({ user: undefined }), STRANGER)).toBe(ACCESS_NONE);
    });

    it('compares ids as strings so a non-string id still matches', () => {
      expect(resolveAccess({ user: 42 }, '42')).toBe(ACCESS_WRITE);
    });

    it('prefers write when a note is both collaborative and public', () => {
      expect(resolveAccess(note({ isCollaborative: true, isPublic: true }), STRANGER)).toBe(
        ACCESS_WRITE
      );
    });

    it('ignores truthy-but-not-true flag values', () => {
      // Guards against a stray string or 1 from a loosely typed payload
      // silently widening access.
      expect(resolveAccess(note({ isCollaborative: 'yes' }), STRANGER)).toBe(ACCESS_NONE);
      expect(resolveAccess(note({ isPublic: 1 }), STRANGER)).toBe(ACCESS_NONE);
    });
  });

  describe('canRead / canWrite', () => {
    it('treats write as sufficient for reading', () => {
      expect(canRead(ACCESS_WRITE)).toBe(true);
      expect(canRead(ACCESS_READ)).toBe(true);
      expect(canRead(ACCESS_NONE)).toBe(false);
      expect(canRead(undefined)).toBe(false);
    });

    it('treats read as insufficient for writing', () => {
      expect(canWrite(ACCESS_WRITE)).toBe(true);
      expect(canWrite(ACCESS_READ)).toBe(false);
      expect(canWrite(ACCESS_NONE)).toBe(false);
      expect(canWrite(undefined)).toBe(false);
    });
  });

  describe('authorizeNote', () => {
    it('resolves the level for the loaded note', async () => {
      const model = { findByPk: vi.fn().mockResolvedValue(note()) };

      const result = await authorizeNote('note-1', OWNER, model);

      expect(model.findByPk).toHaveBeenCalledWith('note-1');
      expect(result.level).toBe(ACCESS_WRITE);
      expect(result.note).toEqual(note());
    });

    it('reports a missing note as no access rather than not found', async () => {
      // A probing client must not be able to distinguish "does not exist"
      // from "exists but is not yours".
      const model = { findByPk: vi.fn().mockResolvedValue(null) };

      const result = await authorizeNote('note-1', OWNER, model);

      expect(result.level).toBe(ACCESS_NONE);
      expect(result.note).toBeNull();
    });

    it('does not hit the database without a note id or user id', async () => {
      const model = { findByPk: vi.fn() };

      expect((await authorizeNote('', OWNER, model)).level).toBe(ACCESS_NONE);
      expect((await authorizeNote('note-1', '', model)).level).toBe(ACCESS_NONE);
      expect(model.findByPk).not.toHaveBeenCalled();
    });
  });
});
