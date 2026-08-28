const redisService = require('../services/redisService');
const logger = require('../utils/logger');
const { accumulateAudioChunk, processSessionAudio } = require('../services/audioStreamProcessor');

// Local in-memory store fallback when Redis is offline
const localActiveRooms = new Map();

async function addPeerToRoom(roomId, socketId, peerData) {
  const redisKey = `interview:signalling:${roomId}`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.hset(redisKey, socketId, JSON.stringify(peerData));
      await redisService.client.expire(redisKey, 86400); // 24h TTL
      return;
    } catch (err) {
      logger.warn('Failed to save peer info to Redis hash', { roomId, socketId, error: err.message });
    }
  }

  if (!localActiveRooms.has(roomId)) {
    localActiveRooms.set(roomId, new Map());
  }
  localActiveRooms.get(roomId).set(socketId, peerData);
}

async function removePeerFromRoom(roomId, socketId) {
  const redisKey = `interview:signalling:${roomId}`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.hdel(redisKey, socketId);
      return;
    } catch (err) {
      logger.warn('Failed to delete peer info from Redis hash', { roomId, socketId, error: err.message });
    }
  }

  if (localActiveRooms.has(roomId)) {
    localActiveRooms.get(roomId).delete(socketId);
    if (localActiveRooms.get(roomId).size === 0) {
      localActiveRooms.delete(roomId);
    }
  }
}

async function getRoomPeers(roomId) {
  const redisKey = `interview:signalling:${roomId}`;
  if (redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.hgetall(redisKey);
      if (data) {
        const peers = {};
        for (const [key, val] of Object.entries(data)) {
          peers[key] = JSON.parse(val);
        }
        return peers;
      }
    } catch (err) {
      logger.warn('Failed to fetch peer mappings from Redis', { roomId, error: err.message });
    }
  }

  const peers = {};
  const map = localActiveRooms.get(roomId);
  if (map) {
    for (const [key, val] of map.entries()) {
      peers[key] = val;
    }
  }
  return peers;
}

module.exports = (io) => {
  const nsp = io.of ? io.of('/interview-signalling') : io;

  nsp.on('connection', (socket) => {
    logger.info('Interview WebRTC Signalling socket connected', { socketId: socket.id });

    // Join WebRTC room
    socket.on('join-room', async ({ roomId, userId, userName } = {}) => {
      if (!roomId || !userId) {
        return socket.emit('error', { message: 'roomId and userId are required.' });
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = userName || 'Anonymous Candidate';

      const peerData = {
        socketId: socket.id,
        userId,
        userName: socket.data.userName,
        joinedAt: new Date().toISOString(),
      };

      await addPeerToRoom(roomId, socket.id, peerData);

      // Broadcast join to other peers
      socket.to(roomId).emit('peer-joined', peerData);

      // Send list of current peers back to the joining user
      const peers = await getRoomPeers(roomId);
      socket.emit('current-peers', Object.values(peers).filter(p => p.socketId !== socket.id));

      logger.info('Peer registered to signalling room', { roomId, socketId: socket.id, userId });
    });

    // WebRTC Offer Relay
    socket.on('send-offer', ({ targetSocketId, sdp } = {}) => {
      if (!targetSocketId || !sdp) return;
      nsp.to(targetSocketId).emit('receive-offer', {
        senderSocketId: socket.id,
        sdp,
      });
    });

    // WebRTC Answer Relay
    socket.on('send-answer', ({ targetSocketId, sdp } = {}) => {
      if (!targetSocketId || !sdp) return;
      nsp.to(targetSocketId).emit('receive-answer', {
        senderSocketId: socket.id,
        sdp,
      });
    });

    // ICE Candidate Relay
    socket.on('send-ice-candidate', ({ targetSocketId, candidate } = {}) => {
      if (!targetSocketId || !candidate) return;
      nsp.to(targetSocketId).emit('receive-ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // Audio stream chunk processing
    socket.on('audio-chunk', (chunk) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        accumulateAudioChunk(roomId, chunk);
      }
    });

    // Recording finished, trigger speech-to-text evaluation
    socket.on('stop-recording', async (callback) => {
      const roomId = socket.data.roomId;
      const userId = socket.data.userId;

      if (!roomId || !userId) {
        return callback && callback({ success: false, error: 'User is not in an active session.' });
      }

      logger.info('Ending audio recording and starting speech-to-text RAG analyses', { roomId, userId });
      try {
        const session = await processSessionAudio(roomId, userId);
        if (session) {
          nsp.in(roomId).emit('evaluation-completed', {
            sessionId: session.id,
            transcription: session.transcription,
            metrics: session.metrics,
          });
          if (callback) callback({ success: true, data: session });
        } else {
          if (callback) callback({ success: false, error: 'No audio captured to transcribe.' });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        await removePeerFromRoom(roomId, socket.id);
        socket.to(roomId).emit('peer-left', { socketId: socket.id });
        logger.info('Peer disconnected from WebRTC signalling', { roomId, socketId: socket.id });
      }
    });
  });

  return nsp;
};

module.exports.localActiveRooms = localActiveRooms;
