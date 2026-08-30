const redisService = require('../services/redisService');
const codeRunnerService = require('../services/codeRunnerService');
const logger = require('../utils/logger');

// Local in-memory fallback cache when Redis is unavailable
const activeInterviewRooms = new Map();
const clientAckTracking = new Map(); // Track client ack states
const TTL_SECONDS = 86400; // 24 hours
const MAX_UPDATE_LOG = 1000;
const STALE_CLIENT_THRESHOLD = 100; // If behind by 100+ updates, send snapshot

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

/**
 * Gets or creates room state with Redis or in-memory fallback.
 */
async function getRoomState(roomId) {
  const redisKey = `interview:room:${roomId}`;

  if (redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.get(redisKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      logger.warn('Failed to fetch interview room state from Redis', { roomId, error: err.message });
    }
  }

  let room = activeInterviewRooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      stateVersion: 0,
      code: DEFAULT_STARTER_CODE,
      language: 'javascript',
      participants: {},
      chatMessages: [
        {
          id: 'system-1',
          seqNum: 0,
          user: { name: 'System', role: 'system' },
          text: 'Welcome to the Collaborative Interview Room! Shared editor and video chat are active.',
          timestamp: new Date().toISOString(),
        },
      ],
      updateLog: [], // Track all updates for recovery
      output: null,
      updatedAt: new Date().toISOString(),
    };
    activeInterviewRooms.set(roomId, room);
  }
  return room;
}

/**
 * Records an update in the room's update log (for recovery).
 */
async function recordUpdate(roomId, update) {
  const roomState = await getRoomState(roomId);
  roomState.stateVersion++;
  
  const versionedUpdate = {
    seqNum: roomState.stateVersion,
    ...update,
    timestamp: new Date().toISOString(),
  };
  
  if (!roomState.updateLog) {
    roomState.updateLog = [];
  }
  
  roomState.updateLog.push(versionedUpdate);
  
  // Keep only last MAX_UPDATE_LOG updates in memory
  if (roomState.updateLog.length > MAX_UPDATE_LOG) {
    roomState.updateLog = roomState.updateLog.slice(-MAX_UPDATE_LOG);
  }
  
  return versionedUpdate;
}

/**
 * Track client acknowledgement of updates.
 */
function trackClientAck(socketId, seqNum) {
  if (!clientAckTracking.has(socketId)) {
    clientAckTracking.set(socketId, { lastAckSeqNum: 0 });
  }
  const tracking = clientAckTracking.get(socketId);
  tracking.lastAckSeqNum = Math.max(tracking.lastAckSeqNum, seqNum);
}

/**
 * Get updates since client's last acknowledged sequence number.
 */
async function getMissedUpdates(roomId, clientLastAckSeqNum) {
  const roomState = await getRoomState(roomId);
  if (!roomState.updateLog) return [];
  
  return roomState.updateLog.filter(update => update.seqNum > clientLastAckSeqNum);
}
/**
 * Persists room state in Redis or in-memory fallback.
 */
async function saveRoomState(roomId, roomState) {
  roomState.updatedAt = new Date().toISOString();
  activeInterviewRooms.set(roomId, roomState);

  const redisKey = `interview:room:${roomId}`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.set(redisKey, JSON.stringify(roomState), 'EX', TTL_SECONDS);
    } catch (err) {
      logger.warn('Failed to save interview room state to Redis', { roomId, error: err.message });
    }
  }
}

/**
 * Assigns cursor color based on participant role or index.
 */
function getCursorColor(role, index) {
  if (role === 'interviewer') return '#ec4899'; // pink/fuchsia
  if (role === 'candidate') return '#3b82f6'; // blue
  const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
  return colors[index % colors.length];
}

/**
 * Socket.io Namespace Handler for Collaborative Interview Rooms.
 * Supports injection of dependencies for unit testing.
 */
module.exports = (io, deps = {}) => {
  const runner = deps.codeRunnerService || codeRunnerService;
  const nsp = io.of ? io.of('/interview') : io;

  nsp.on('connection', (socket) => {
    logger.info('Interview socket connected', { socketId: socket.id, user: socket.user?.name || socket.user?.id });

    // Reconnect with recovery
    socket.on('interview:reconnect_request', async ({ roomId, role = 'candidate', user = {}, lastAckSeqNum = 0 } = {}) => {
      if (!roomId) {
        return socket.emit('interview:error', { message: 'Room ID is required.' });
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.role = role;
      socket.data.user = {
        id: user.id || socket.id,
        name: user.name || (role === 'interviewer' ? 'Interviewer' : 'Candidate'),
        role,
        avatar: user.avatar || '',
      };
      socket.data.lastAckSeqNum = lastAckSeqNum;

      const roomState = await getRoomState(roomId);
      
      // Retrieve missed updates since last acknowledgement
      const missedUpdates = await getMissedUpdates(roomId, lastAckSeqNum);
      
      // Determine recovery strategy
      const shouldSendSnapshot = missedUpdates.length >= STALE_CLIENT_THRESHOLD;

      if (shouldSendSnapshot) {
        // Send snapshot for stale clients
        socket.emit('interview:recovery_snapshot', {
          roomId,
          stateVersion: roomState.stateVersion,
          snapshot: {
            code: roomState.code,
            language: roomState.language,
            participants: Object.values(roomState.participants),
            chatMessages: roomState.chatMessages,
            output: roomState.output,
          },
          mySocketId: socket.id,
          myRole: role,
        });
      } else if (missedUpdates.length > 0) {
        // Send incremental updates
        socket.emit('interview:recovery_updates', {
          roomId,
          stateVersion: roomState.stateVersion,
          missedUpdates,
          mySocketId: socket.id,
          myRole: role,
        });
      } else {
        // No missed updates
        socket.emit('interview:recovery_complete', {
          roomId,
          stateVersion: roomState.stateVersion,
          mySocketId: socket.id,
          myRole: role,
        });
      }

      trackClientAck(socket.id, lastAckSeqNum);
      logger.info('User reconnected to interview room', { roomId, socketId: socket.id, role, missedUpdatesCount: missedUpdates.length });
    });

    // Join room (backward compatibility)
    socket.on('interview:join_room', async ({ roomId, role = 'candidate', user = {}, lastAckSeqNum = 0 } = {}) => {
      if (!roomId) {
        return socket.emit('interview:error', { message: 'Room ID is required.' });
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.role = role;
      socket.data.user = {
        id: user.id || socket.id,
        name: user.name || (role === 'interviewer' ? 'Interviewer' : 'Candidate'),
        role,
        avatar: user.avatar || '',
      };
      socket.data.lastAckSeqNum = lastAckSeqNum;

      const roomState = await getRoomState(roomId);
      const participantCount = Object.keys(roomState.participants).length;
      const color = getCursorColor(role, participantCount);

      const participantInfo = {
        socketId: socket.id,
        ...socket.data.user,
        color,
        joinedAt: new Date().toISOString(),
        cursor: null,
      };

      roomState.participants[socket.id] = participantInfo;
      await saveRoomState(roomId, roomState);

      // Notify socket of current state
      socket.emit('interview:room_state_sync', {
        roomId,
        stateVersion: roomState.stateVersion,
        code: roomState.code,
        language: roomState.language,
        participants: Object.values(roomState.participants),
        chatMessages: roomState.chatMessages,
        output: roomState.output,
        mySocketId: socket.id,
        myRole: role,
      });

      // Broadcast participant joined to peers
      socket.to(roomId).emit('interview:participant_joined', {
        participant: participantInfo,
        participants: Object.values(roomState.participants),
      });

      trackClientAck(socket.id, lastAckSeqNum);
      logger.info('User joined interview room', { roomId, socketId: socket.id, role });
    });

    // Real-time Code changes
    socket.on('interview:code_change', async ({ roomId, code } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom || typeof code !== 'string') return;

      const roomState = await getRoomState(targetRoom);
      roomState.code = code;
      
      const update = await recordUpdate(targetRoom, {
        type: 'code_change',
        code,
        senderSocketId: socket.id,
        user: socket.data.user,
      });

      await saveRoomState(targetRoom, roomState);

      socket.to(targetRoom).emit('interview:code_changed', {
        seqNum: update.seqNum,
        code,
        senderSocketId: socket.id,
        updatedBy: socket.data.user,
      });
    });

    // Real-time Cursor & Selection movement
    socket.on('interview:cursor_move', async ({ roomId, position, selection } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom) return;

      const roomState = await getRoomState(targetRoom);
      if (roomState.participants[socket.id]) {
        roomState.participants[socket.id].cursor = { position, selection };
      }

      socket.to(targetRoom).emit('interview:cursor_moved', {
        socketId: socket.id,
        user: socket.data.user,
        color: roomState.participants[socket.id]?.color || '#3b82f6',
        position,
        selection,
      });
    });

    // Language selection change
    socket.on('interview:language_change', async ({ roomId, language } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom || !language) return;

      const roomState = await getRoomState(targetRoom);
      roomState.language = language;
      
      const update = await recordUpdate(targetRoom, {
        type: 'language_change',
        language,
        user: socket.data.user,
      });

      await saveRoomState(targetRoom, roomState);

      nsp.in(targetRoom).emit('interview:language_changed', {
        seqNum: update.seqNum,
        language,
        updatedBy: socket.data.user,
      });
    });

    // Code Execution
    socket.on('interview:run_code', async ({ roomId, code, language, stdin } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom) return;

      const roomState = await getRoomState(targetRoom);
      const codeToRun = code !== undefined ? code : roomState.code;
      const langToRun = language || roomState.language;

      // Broadcast running status
      nsp.in(targetRoom).emit('interview:code_executing', {
        executingBy: socket.data.user,
      });

      const result = await runner.runCode({
        code: codeToRun,
        language: langToRun,
        stdin: stdin || '',
      });

      roomState.output = result;
      
      const update = await recordUpdate(targetRoom, {
        type: 'code_execution',
        output: result,
        user: socket.data.user,
      });

      await saveRoomState(targetRoom, roomState);

      nsp.in(targetRoom).emit('interview:code_output', {
        seqNum: update.seqNum,
        output: result,
        executedBy: socket.data.user,
      });
    });

    // Text Chat message
    socket.on('interview:chat_message', async ({ roomId, text } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom || !text || text.trim() === '') return;

      const roomState = await getRoomState(targetRoom);
      const messageObj = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user: socket.data.user || { name: 'Anonymous', role: 'candidate' },
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const update = await recordUpdate(targetRoom, {
        type: 'chat_message',
        message: messageObj,
        user: socket.data.user,
      });

      messageObj.seqNum = update.seqNum;
      roomState.chatMessages.push(messageObj);
      if (roomState.chatMessages.length > 200) {
        roomState.chatMessages = roomState.chatMessages.slice(-200);
      }
      await saveRoomState(targetRoom, roomState);

      nsp.in(targetRoom).emit('interview:chat_message_received', {
        ...messageObj,
        seqNum: update.seqNum,
      });
    });

    // Client acknowledgement of updates
    socket.on('interview:ack_update', ({ seqNum }) => {
      if (typeof seqNum === 'number') {
        socket.data.lastAckSeqNum = Math.max(socket.data.lastAckSeqNum || 0, seqNum);
        trackClientAck(socket.id, seqNum);
      }
    });

    // WebRTC Signaling for Video / Audio
    socket.on('interview:webrtc_signal', ({ roomId, targetSocketId, signal } = {}) => {
      const targetRoom = roomId || socket.data.roomId;
      if (!targetRoom || !signal) return;

      if (targetSocketId) {
        // Direct peer message
        nsp.to(targetSocketId).emit('interview:webrtc_signal', {
          fromSocketId: socket.id,
          user: socket.data.user,
          signal,
        });
      } else {
        // Broadcast to all other peers in room
        socket.to(targetRoom).emit('interview:webrtc_signal', {
          fromSocketId: socket.id,
          user: socket.data.user,
          signal,
        });
      }
    });

    // Leave room
    socket.on('interview:leave_room', async () => {
      await handleUserExit(socket, nsp);
    });

    // Disconnect listener
    socket.on('disconnect', async () => {
      await handleUserExit(socket, nsp);
      clientAckTracking.delete(socket.id);
    });
  });
  return nsp;
};

async function handleUserExit(socket, nsp) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const roomState = await getRoomState(roomId);
  if (roomState && roomState.participants[socket.id]) {
    const leavingUser = roomState.participants[socket.id];
    delete roomState.participants[socket.id];

    await saveRoomState(roomId, roomState);

    nsp.in(roomId).emit('interview:participant_left', {
      socketId: socket.id,
      participant: leavingUser,
      participants: Object.values(roomState.participants),
    });

    socket.leave(roomId);
    socket.data.roomId = null;

    logger.info('User left interview room', { roomId, socketId: socket.id });
  }
}

// Export internal state and functions for unit testing
module.exports.activeInterviewRooms = activeInterviewRooms;
module.exports.clientAckTracking = clientAckTracking;
module.exports.getRoomState = getRoomState;
module.exports.getMissedUpdates = getMissedUpdates;
module.exports.recordUpdate = recordUpdate;
module.exports.trackClientAck = trackClientAck;
