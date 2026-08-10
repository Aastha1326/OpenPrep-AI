const {
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  createRoomState,
  generateRoomCode,
  validateRoomCode,
  roomRequiresPassword,
  isPasswordValid,
} = require('../../sockets/battleRoomAccess');

describe('battleRoomAccess - room codes', () => {
  it('generates a 6-character code using only the safe alphabet', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(ROOM_CODE_LENGTH);
    expect([...code].every((char) => ROOM_CODE_ALPHABET.includes(char))).toBe(true);
  });

  it('produces varied codes across many calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });

  it('validates exactly 6-char codes from the safe alphabet', () => {
    expect(validateRoomCode('ABCDEF')).toBe(true);
    expect(validateRoomCode('K8M2PQ')).toBe(true);
  });

  it('rejects codes that are too short, contain ambiguous chars, or are not strings', () => {
    expect(validateRoomCode('ABC')).toBe(false);
    expect(validateRoomCode('ABCDEFG')).toBe(false);
    expect(validateRoomCode('ABCDE0')).toBe(false);
    expect(validateRoomCode('ABCDEI')).toBe(false);
    expect(validateRoomCode('ABC123')).toBe(false);
    expect(validateRoomCode(123456)).toBe(false);
    expect(validateRoomCode('')).toBe(false);
  });
});

describe('battleRoomAccess - room state', () => {
  it('createRoomState defaults password and status', () => {
    const room = createRoomState({ roomId: 'ABCDEF' });
    expect(room.id).toBe('ABCDEF');
    expect(room.name).toBe('');
    expect(room.password).toBe('');
    expect(room.status).toBe('waiting');
    expect(room.players).toEqual({});
  });

  it('roomRequiresPassword only for rooms with a password', () => {
    expect(roomRequiresPassword(createRoomState({ roomId: 'ABCDEF' }))).toBe(false);
    expect(roomRequiresPassword(createRoomState({ roomId: 'ABCDEF', password: 'x' }))).toBe(true);
    expect(roomRequiresPassword(null)).toBe(false);
  });

  it('isPasswordValid checks the stored password when required', () => {
    const room = createRoomState({ roomId: 'ABCDEF', password: 'secret' });
    expect(isPasswordValid(room, 'secret')).toBe(true);
    expect(isPasswordValid(room, 'nope')).toBe(false);
    expect(isPasswordValid(createRoomState({ roomId: 'ABCDEF' }), 'anything')).toBe(true);
  });
});
