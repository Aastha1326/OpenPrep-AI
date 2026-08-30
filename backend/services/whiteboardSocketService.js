/**
 * @fileoverview WebSocket service for real-time collaborative whiteboard.
 * Handles stroke broadcasting, cursor tracking, and state synchronization with throttling.
 */
const { Whiteboard } = require('../models');

// In-memory cache for fast room presence, fell back to database for full states
const activeRooms = new Map();

/**
 * Initializes the whiteboard socket event listeners.
 * @param {Object} io - Socket.IO server instance
 */
const initializeWhiteboardSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Whiteboard Socket] User connected: ${socket.id}`);

    /**
     * Join a specific whiteboard room
     */
    socket.on('whiteboard:join', async ({ roomId, userId, username }) => {
      socket.join(`whiteboard_${roomId}`);
      socket.data = { roomId, userId, username };

      console.log(`[Whiteboard Socket] User ${username} (${userId}) joined room ${roomId}`);

      // Initialize room session if not exists
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          cursors: new Map(),
          elements: [], // cached elements
        });
      }

      const room = activeRooms.get(roomId);

      // Assign a random color to this user cursor
      const userColor = getRandomColor();
      room.cursors.set(userId, { x: 0, y: 0, username, color: userColor, points: [] });

      // Fetch latest state from database to ensure fresh data
      let dbState = { strokes: [], nodes: [], edges: [] };
      try {
        const board = await Whiteboard.findOne({ where: { roomId } });
        if (board && board.state) {
          dbState = board.state;
          room.elements = board.state.strokes || [];
        }
      } catch (err) {
        console.error('[Whiteboard Socket] DB read error on join:', err);
      }

      // Send current state to the joining user
      socket.emit('whiteboard:sync', {
        roomId,
        strokes: dbState.strokes || [],
        nodes: dbState.nodes || [],
        edges: dbState.edges || [],
        cursors: Array.from(room.cursors.entries()).map(([id, data]) => ({ userId: id, ...data })),
      });

      // Broadcast new cursor and member join to others in the room
      socket.to(`whiteboard_${roomId}`).emit('whiteboard:cursor-joined', {
        userId,
        username,
        color: userColor,
      });
    });

    /**
     * Handle operational transform / element mutations (add, transform, delete, z-index)
     */
    socket.on('whiteboard:element-mutate', (mutation) => {
      const { roomId } = socket.data;
      if (!roomId) return;

      // Broadcast the mutation to all other room members
      socket.to(`whiteboard_${roomId}`).emit('whiteboard:element-mutated', mutation);
    });

    /**
     * Handle real-time drawing strokes
     */
    socket.on('whiteboard:stroke', (strokeData) => {
      const { roomId } = socket.data;
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (room) {
        // Keep in-memory cache updated
        room.elements.push(strokeData);
        // Broadcast to all other peers in the room
        socket.to(`whiteboard_${roomId}`).emit('whiteboard:stroke-received', strokeData);
      }
    });

    /**
     * Handle undo / redo command broadcasts
     */
    socket.on('whiteboard:history-action', (actionData) => {
      const { roomId } = socket.data;
      if (!roomId) return;

      // Broadcast history operations (undo/redo action triggers)
      socket.to(`whiteboard_${roomId}`).emit('whiteboard:history-acted', actionData);
    });

    /**
     * Handle real-time cursor movement & trail tracking
     */
    socket.on('whiteboard:cursor-move', ({ x, y, points }) => {
      const { roomId, userId, username } = socket.data;
      if (!roomId || !userId) return;

      const room = activeRooms.get(roomId);
      if (room) {
        const cursorInfo = room.cursors.get(userId) || { username, color: getRandomColor() };
        cursorInfo.x = x;
        cursorInfo.y = y;
        cursorInfo.points = points || []; // Store recent coordinates trail
        room.cursors.set(userId, cursorInfo);

        // Broadcast to others with latency optimized emission
        socket.to(`whiteboard_${roomId}`).emit('whiteboard:cursor-moved', {
          userId,
          x,
          y,
          points: cursorInfo.points,
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      const { roomId, userId } = socket.data;
      if (roomId && userId) {
        const room = activeRooms.get(roomId);
        if (room) {
          room.cursors.delete(userId);
          if (room.cursors.size === 0) {
            // Clean up room memory if empty
            activeRooms.delete(roomId);
          } else {
            socket.to(`whiteboard_${roomId}`).emit('whiteboard:cursor-left', { userId });
          }
        }
      }
      console.log(`[Whiteboard Socket] User disconnected: ${socket.id}`);
    });
  });
};

/**
 * Helper to generate consistent vibrant cursor colors
 */
const getRandomColor = () => {
  const colors = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = {
  initializeWhiteboardSockets,
  getBoardState: (roomId) => activeRooms.get(roomId) || null,
};
