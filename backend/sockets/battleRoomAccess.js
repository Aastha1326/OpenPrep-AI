const createRoomState = ({ roomId, roomName = '', password = '' } = {}) => ({
  id: roomId,
  name: roomName,
  password: password || '',
  players: {},
  status: 'waiting',
  questions: [],
});

const roomRequiresPassword = (room) => Boolean(room && room.password);

const isPasswordValid = (room, enteredPassword = '') => {
  if (!roomRequiresPassword(room)) return true;
  return room.password === enteredPassword;
};

module.exports = {
  createRoomState,
  roomRequiresPassword,
  isPasswordValid,
};
