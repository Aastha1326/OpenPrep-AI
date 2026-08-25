/**
 * @fileoverview WebSocket service for real-time collaborative whiteboard and mind-mapping.
 * Handles stroke broadcasting, cursor tracking, and state synchronization with throttling.
 */

// In-memory store for active whiteboard states (in production, use Redis)
const activeBoards = new Map();

/**
 * Initializes the whiteboard socket event listeners.
 * @param {Object} io - Socket.IO server instance
 */
const initializeWhiteboardSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Whiteboard] User connected: ${socket.id}`);

        /**
         * Join a specific squad's whiteboard room
         */
        socket.on('whiteboard:join', ({ squadId, userId, username }) => {
            socket.join(`squad_${squadId}`);
            socket.data = { squadId, userId, username };

            // Initialize board state if not exists
            if (!activeBoards.has(squadId)) {
                activeBoards.set(squadId, { strokes: [], nodes: [], edges: [], cursors: new Map() });
            }

            // Send current state to the joining user
            const boardState = activeBoards.get(squadId);
            socket.emit('whiteboard:sync', {
                strokes: boardState.strokes,
                nodes: boardState.nodes,
                edges: boardState.edges,
            });

            // Broadcast new cursor to others
            socket.to(`squad_${squadId}`).emit('whiteboard:cursor-joined', {
                userId,
                username,
                color: getRandomColor(),
            });
        });

        /**
         * Handle drawing strokes with throttling
         */
        socket.on('whiteboard:stroke', (strokeData) => {
            const { squadId } = socket.data;
            if (!squadId) return;

            const boardState = activeBoards.get(squadId);
            if (boardState) {
                boardState.strokes.push(strokeData);
                // Broadcast to everyone else in the room
                socket.to(`squad_${squadId}`).emit('whiteboard:stroke-received', strokeData);
            }
        });

        /**
         * Handle mind-map node/edge mutations
         */
        socket.on('whiteboard:mindmap-update', (updateData) => {
            const { squadId } = socket.data;
            if (!squadId) return;

            const boardState = activeBoards.get(squadId);
            if (boardState) {
                if (updateData.type === 'add_node') boardState.nodes.push(updateData.payload);
                if (updateData.type === 'add_edge') boardState.edges.push(updateData.payload);
                if (updateData.type === 'update_node') {
                    const idx = boardState.nodes.findIndex(n => n.id === updateData.payload.id);
                    if (idx !== -1) boardState.nodes[idx] = updateData.payload;
                }

                socket.to(`squad_${squadId}`).emit('whiteboard:mindmap-synced', updateData);
            }
        });

        /**
         * Handle cursor movement
         */
        socket.on('whiteboard:cursor-move', ({ x, y }) => {
            const { squadId, userId, username } = socket.data;
            if (!squadId) return;

            const boardState = activeBoards.get(squadId);
            if (boardState) {
                boardState.cursors.set(userId, { x, y, username });
                socket.to(`squad_${squadId}`).emit('whiteboard:cursor-moved', { userId, x, y });
            }
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', () => {
            const { squadId, userId } = socket.data;
            if (squadId) {
                const boardState = activeBoards.get(squadId);
                if (boardState) {
                    boardState.cursors.delete(userId);
                    socket.to(`squad_${squadId}`).emit('whiteboard:cursor-left', { userId });
                }
            }
            console.log(`[Whiteboard] User disconnected: ${socket.id}`);
        });
    });
};

/**
 * Helper to generate consistent random colors for cursors
 */
const getRandomColor = () => {
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = {
    initializeWhiteboardSockets,
    getBoardState: (squadId) => activeBoards.get(squadId) || null,
};
