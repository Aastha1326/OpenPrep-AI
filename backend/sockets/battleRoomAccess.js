const ROOM_CODE_LENGTH = 6;

// Ambiguity-free alphabet (no 0/O/1/I so codes are easy to read and share)
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createRoomState = ({ roomId, roomName = '', password = '' } = {}) => ({
  id: roomId,
  name: roomName,
  password: password || '',
  players: {},
  status: 'waiting',
  questions: [],
});

const generateRoomCode = () => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
};

const validateRoomCode = (code = '') =>
  typeof code === 'string' &&
  code.length === ROOM_CODE_LENGTH &&
  [...code].every((char) => ROOM_CODE_ALPHABET.includes(char));

const roomRequiresPassword = (room) => Boolean(room && room.password);

const isPasswordValid = (room, enteredPassword = '') => {
  if (!roomRequiresPassword(room)) return true;
  return room.password === enteredPassword;
};

module.exports = {
  ROOM_CODE_LENGTH,
  ROOM_CODE_ALPHABET,
  createRoomState,
  generateRoomCode,
  validateRoomCode,
  roomRequiresPassword,
  isPasswordValid,
};
