import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_STARTER_CODE = `// Live Collaborative Interview Workspace
// Write your code solution below.

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log('Test case 1:', twoSum([2, 7, 11, 15], 9));
console.log('Test case 2:', twoSum([3, 2, 4], 6));
`;

const initialState = {
  roomId: null,
  role: 'candidate', // 'interviewer' | 'candidate'
  code: DEFAULT_STARTER_CODE,
  language: 'javascript',
  output: null,
  isExecuting: false,
  participants: [],
  remoteCursors: {}, // socketId -> { position, selection, user, color }
  chatMessages: [],
  mySocketId: null,
  isJoined: false,
  videoEnabled: false,
  audioEnabled: false,
  error: null,
};

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setRoomInfo: (state, action) => {
      state.roomId = action.payload.roomId;
      if (action.payload.role) {
        state.role = action.payload.role;
      }
    },
    setRoomStateSync: (state, action) => {
      const { roomId, code, language, participants, chatMessages, output, mySocketId, myRole } = action.payload;
      state.roomId = roomId;
      state.code = code !== undefined ? code : state.code;
      state.language = language || state.language;
      state.participants = participants || [];
      state.chatMessages = chatMessages || [];
      state.output = output || null;
      if (mySocketId) state.mySocketId = mySocketId;
      if (myRole) state.role = myRole;
      state.isJoined = true;
      state.error = null;
    },
    updateCode: (state, action) => {
      state.code = action.payload;
    },
    updateLanguage: (state, action) => {
      state.language = action.payload;
    },
    setCodeOutput: (state, action) => {
      state.output = action.payload;
      state.isExecuting = false;
    },
    setIsExecuting: (state, action) => {
      state.isExecuting = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    addParticipant: (state, action) => {
      const { participant, participants } = action.payload;
      if (participants) {
        state.participants = participants;
      } else if (participant && !state.participants.some((p) => p.socketId === participant.socketId)) {
        state.participants.push(participant);
      }
    },
    removeParticipant: (state, action) => {
      const { socketId, participants } = action.payload;
      if (participants) {
        state.participants = participants;
      } else {
        state.participants = state.participants.filter((p) => p.socketId !== socketId);
      }
      delete state.remoteCursors[socketId];
    },
    updateRemoteCursor: (state, action) => {
      const { socketId, position, selection, user, color } = action.payload;
      if (socketId !== state.mySocketId) {
        state.remoteCursors[socketId] = { position, selection, user, color };
      }
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    toggleVideo: (state, action) => {
      state.videoEnabled = action.payload !== undefined ? action.payload : !state.videoEnabled;
    },
    toggleAudio: (state, action) => {
      state.audioEnabled = action.payload !== undefined ? action.payload : !state.audioEnabled;
    },
    setInterviewError: (state, action) => {
      state.error = action.payload;
    },
    resetInterviewRoom: () => initialState,
  },
});

export const {
  setRoomInfo,
  setRoomStateSync,
  updateCode,
  updateLanguage,
  setCodeOutput,
  setIsExecuting,
  setParticipants,
  addParticipant,
  removeParticipant,
  updateRemoteCursor,
  addChatMessage,
  toggleVideo,
  toggleAudio,
  setInterviewError,
  resetInterviewRoom,
} = interviewSlice.actions;

export default interviewSlice.reducer;
