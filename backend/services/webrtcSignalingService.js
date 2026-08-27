/**
 * @fileoverview WebRTC Mesh Signaling Service & Room Capacity Management for Study Squad Audio Lounge.
 * Manages Socket.io signaling (offers, answers, ICE candidates), room participant states, and enforces
 * a maximum of 8 active voice participants per room for low CPU and bandwidth overhead.
 */

const MAX_ROOM_CAPACITY = 8;
const rooms = new Map(); // squadId -> Map(socketId -> participantState)

/**
 * Clean up participant from all rooms on disconnect or manual leave
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Socket.io socket instance
 * @param {string} [specificSquadId] - Optional squadId to leave
 */
function leaveRoom(io, socket, specificSquadId = null) {
  const targetSquadIds = specificSquadId ? [specificSquadId] : Array.from(rooms.keys());

  for (const squadId of targetSquadIds) {
    const room = rooms.get(squadId);
    if (room && room.has(socket.id)) {
      const participant = room.get(socket.id);
      room.delete(socket.id);

      if (room.size === 0) {
        rooms.delete(squadId);
      }

      socket.leave(`squad:audio:${squadId}`);
      io.to(`squad:audio:${squadId}`).emit('squad:peer_left', {
        socketId: socket.id,
        userId: participant ? participant.userId : null
      });
    }
  }
}

/**
 * Initializes WebRTC Signaling Handlers on Socket.io connection.
 * @param {Object} io - Socket.io server instance
 */
function initWebRTCSignalingService(io) {
  io.on('connection', (socket) => {
    // Join WebRTC Audio Lounge
    socket.on('squad:join_audio_lounge', ({ squadId, user }) => {
      if (!squadId) return;

      if (!rooms.has(squadId)) {
        rooms.set(squadId, new Map());
      }

      const room = rooms.get(squadId);

      // Check if user is already in room (reconnection cleanup)
      if (room.has(socket.id)) {
        room.delete(socket.id);
      }

      // Enforce room capacity limit (max 8 active peers)
      if (room.size >= MAX_ROOM_CAPACITY) {
        socket.emit('squad:audio_lounge_error', {
          message: `Squad Audio Lounge is full (maximum ${MAX_ROOM_CAPACITY} active participants).`
        });
        return;
      }

      const participant = {
        socketId: socket.id,
        userId: user?.id || socket.user?.id || socket.id,
        name: user?.name || socket.user?.name || user?.username || 'Squad Member',
        avatar: user?.avatar || socket.user?.avatar || '',
        isMuted: false,
        isDeafened: false,
        isScreenSharing: false,
        isSpeaking: false,
        joinedAt: new Date().toISOString()
      };

      // Send existing peers list to the newly joined peer
      const existingPeers = Array.from(room.values());
      socket.emit('squad:existing_peers', { peers: existingPeers });

      // Add new peer to room
      room.set(socket.id, participant);
      socket.join(`squad:audio:${squadId}`);

      // Broadcast to existing room members that a new peer joined
      socket.to(`squad:audio:${squadId}`).emit('squad:peer_joined', { peer: participant });
    });

    // Handle WebRTC Offer forwarding
    socket.on('squad:webrtc_offer', ({ targetSocketId, offer }) => {
      if (!targetSocketId || !offer) return;
      io.to(targetSocketId).emit('squad:webrtc_offer', {
        callerSocketId: socket.id,
        offer
      });
    });

    // Handle WebRTC Answer forwarding
    socket.on('squad:webrtc_answer', ({ targetSocketId, answer }) => {
      if (!targetSocketId || !answer) return;
      io.to(targetSocketId).emit('squad:webrtc_answer', {
        responderSocketId: socket.id,
        answer
      });
    });

    // Handle ICE Candidate forwarding
    socket.on('squad:webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
      if (!targetSocketId || !candidate) return;
      io.to(targetSocketId).emit('squad:webrtc_ice_candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // Handle Participant State Changes (Mute, Deafen, Screen Share, Speaking Waveform)
    socket.on('squad:peer_state_update', ({ squadId, isMuted, isDeafened, isScreenSharing, isSpeaking }) => {
      if (!squadId || !rooms.has(squadId)) return;
      const room = rooms.get(squadId);
      const participant = room.get(socket.id);

      if (participant) {
        if (typeof isMuted === 'boolean') participant.isMuted = isMuted;
        if (typeof isDeafened === 'boolean') participant.isDeafened = isDeafened;
        if (typeof isScreenSharing === 'boolean') participant.isScreenSharing = isScreenSharing;
        if (typeof isSpeaking === 'boolean') participant.isSpeaking = isSpeaking;

        socket.to(`squad:audio:${squadId}`).emit('squad:peer_state_changed', {
          socketId: socket.id,
          isMuted: participant.isMuted,
          isDeafened: participant.isDeafened,
          isScreenSharing: participant.isScreenSharing,
          isSpeaking: participant.isSpeaking
        });
      }
    });

    // Leave Audio Lounge
    socket.on('squad:leave_audio_lounge', ({ squadId }) => {
      leaveRoom(io, socket, squadId);
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      leaveRoom(io, socket);
    });
  });
}

module.exports = initWebRTCSignalingService;
