/**
 * @fileoverview Socket.IO event handlers for the Collaborative Study Room.
 * Manages room joining, whiteboard stroke synchronization, and real-time chat with Redis session cache.
 */

const redisService = require('../services/redisService');

// Local fallback state
const localRooms = new Map();

// Helper to get participants
async function getRoomParticipants(roomId) {
  const key = `room:${roomId}:participants`;
  if (redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.hgetall(key);
      const list = [];
      for (const field of Object.keys(data)) {
        list.push(JSON.parse(data[field]));
      }
      return list;
    } catch (err) {
      console.error('[studyRoomSocket] Failed to fetch participants from Redis:', err.message);
    }
  }
  
  // Local fallback
  const room = localRooms.get(roomId);
  return room ? Object.values(room.participants) : [];
}

// Helper to add participant
async function addRoomParticipant(roomId, userId, participant) {
  const key = `room:${roomId}:participants`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.hset(key, userId, JSON.stringify(participant));
      await redisService.client.expire(key, 86400); // 24 hours expiry
      return;
    } catch (err) {
      console.error('[studyRoomSocket] Failed to add participant to Redis:', err.message);
    }
  }

  // Local fallback
  if (!localRooms.has(roomId)) {
    localRooms.set(roomId, { metadata: { roomId, createdAt: Date.now() }, participants: {}, whiteboard: [] });
  }
  localRooms.get(roomId).participants[userId] = participant;
}

// Helper to remove participant
async function removeRoomParticipant(roomId, userId) {
  const key = `room:${roomId}:participants`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.hdel(key, userId);
      return;
    } catch (err) {
      console.error('[studyRoomSocket] Failed to remove participant from Redis:', err.message);
    }
  }

  // Local fallback
  const room = localRooms.get(roomId);
  if (room && room.participants[userId]) {
    delete room.participants[userId];
    if (Object.keys(room.participants).length === 0) {
      localRooms.delete(roomId);
    }
  }
}

// Helper to get whiteboard strokes
async function getWhiteboardStrokes(roomId) {
  const key = `room:${roomId}:whiteboard`;
  if (redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.lrange(key, 0, -1);
      return data.map((item) => JSON.parse(item));
    } catch (err) {
      console.error('[studyRoomSocket] Failed to fetch whiteboard strokes from Redis:', err.message);
    }
  }

  // Local fallback
  const room = localRooms.get(roomId);
  return room ? room.whiteboard : [];
}

// Helper to add whiteboard stroke
async function addWhiteboardStroke(roomId, stroke) {
  const key = `room:${roomId}:whiteboard`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.rpush(key, JSON.stringify(stroke));
      await redisService.client.expire(key, 86400); // 24 hours expiry
      return;
    } catch (err) {
      console.error('[studyRoomSocket] Failed to save stroke to Redis:', err.message);
    }
  }

  // Local fallback
  if (!localRooms.has(roomId)) {
    localRooms.set(roomId, { metadata: { roomId, createdAt: Date.now() }, participants: {}, whiteboard: [] });
  }
  localRooms.get(roomId).whiteboard.push(stroke);
}

// Helper to clear whiteboard
async function clearWhiteboard(roomId) {
  const key = `room:${roomId}:whiteboard`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.del(key);
      return;
    } catch (err) {
      console.error('[studyRoomSocket] Failed to clear whiteboard in Redis:', err.message);
    }
  }

  // Local fallback
  const room = localRooms.get(roomId);
  if (room) {
    room.whiteboard = [];
  }
}

/**
 * Initializes Socket.IO event listeners for study room features.
 * 
 * @param {Object} io - The Socket.IO server instance.
 */
const initializeStudyRoomSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        /**
         * Cleans up room membership state and removes event listeners
         * from a client socket to prevent memory and listener leaks.
         */
        socket.on('join_room', async ({ roomId, username }) => {
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.username = username;

            const participant = {
                id: socket.id,
                username: username || 'Anonymous'
            };

            await addRoomParticipant(roomId, socket.id, participant);

            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                username,
                userId: socket.id,
                message: `${username} has joined the study room.`
            });

            // Fetch current room state (participants & whiteboard)
            const users = await getRoomParticipants(roomId);
            const whiteboard = await getWhiteboardStrokes(roomId);

            // Send current room state
            socket.emit('room_state_sync', {
                users,
                whiteboard,
            });

            console.log(`[Socket] User ${username} joined room ${roomId}`);
        });

        const handleLeaveRoom = () => {
            const roomId = socket.data.roomId;
            const username = socket.data.username;

            if (roomId) {
                socket.leave(roomId);
                if (username) {
                    socket.to(roomId).emit('user_left', {
                        username,
                        message: `${username} has left the study room.`
                    });
                }
                cleanupSocket(socket.id);
            }
        };

        /**
         * Event: User joins a specific study room.
         * Payload: { roomId, username }
         */
        socket.on('join_room', handleJoinRoom);
        socket.on('study:room:join', handleJoinRoom);

        /**
         * Event: Broadcast a whiteboard drawing stroke to the room.
         * Payload: { roomId, strokeData: { x, y, color, width, tool, isEraser } }
         */
        socket.on('draw_stroke', async ({ roomId, strokeData }) => {
            // Validate payload basics
            if (!roomId || !strokeData || typeof strokeData.x !== 'number') {
                return;
            }

            // Save stroke to cache
            await addWhiteboardStroke(roomId, strokeData);

            // Broadcast to everyone in the room EXCEPT the sender
            socket.to(roomId).emit('receive_stroke', {
                userId: socket.id,
                strokeData,
            });
        });

        /**
         * Event: Clear the whiteboard for all users in the room.
         * Payload: { roomId }
         */
        socket.on('clear_whiteboard', async ({ roomId }) => {
            if (!roomId) return;

            // Clear in cache
            await clearWhiteboard(roomId);

            socket.to(roomId).emit('whiteboard_cleared');
        });

        /**
         * Event: Send a chat message to the room.
         * Payload: { roomId, username, message, timestamp }
         */
        socket.on('send_chat_message', ({ roomId, username, message, timestamp }) => {
            if (!roomId || !message.trim()) return;

            const chatPayload = {
                id: Date.now().toString(),
                userId: socket.id,
                username,
                message: message.trim(),
                timestamp,
            };
            io.to(roomId).emit('receive_chat_message', chatPayload);
        });

        /**
         * Event: Heartbeat checks for socket connectivity
         */
        socket.on('study:room:heartbeat', () => {
            socket.emit('study:room:heartbeat_ack');
        });

        /**
         * Event: Explicit study room leave
         */
        socket.on('study:room:leave', handleLeaveRoom);

        /**
         * Event: User disconnects or leaves the room.
         */
        socket.on('disconnect', async () => {
            const roomId = socket.data.roomId;
            const username = socket.data.username;

            if (roomId) {
                // Remove from cache
                await removeRoomParticipant(roomId, socket.id);

                if (username) {
                    socket.to(roomId).emit('user_left', {
                        username,
                        message: `${username} has left the study room.`
                    });
                }
            }
            cleanupSocket(socket.id);
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });
};

module.exports = initializeStudyRoomSockets;
module.exports.activeRooms = localRooms;
