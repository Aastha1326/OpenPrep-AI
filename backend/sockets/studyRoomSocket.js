/**
 * @fileoverview Socket.IO event handlers for the Collaborative Study Room.
 * Manages room joining, whiteboard stroke synchronization, and real-time chat.
 */

/**
 * Initializes Socket.IO event listeners for study room features.
 * 
 * @param {Object} io - The Socket.IO server instance.
 */
const initializeStudyRoomSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        /**
         * Event: User joins a specific study room.
         * Payload: { roomId, username }
         */
        socket.on('join_room', ({ roomId, username }) => {
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.username = username;

            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                username,
                userId: socket.id,
                message: `${username} has joined the study room.`
            });

            // Send current room state (mocked for now, would fetch from DB in production)
            socket.emit('room_state_sync', {
                users: Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(id => ({
                    id,
                    username: io.sockets.sockets.get(id)?.data?.username || 'Anonymous'
                }))
            });

            console.log(`[Socket] User ${username} joined room ${roomId}`);
        });

        /**
         * Event: Broadcast a whiteboard drawing stroke to the room.
         * Payload: { roomId, strokeData: { x, y, color, width, tool, isEraser } }
         */
        socket.on('draw_stroke', ({ roomId, strokeData }) => {
            // Validate payload basics
            if (!roomId || !strokeData || typeof strokeData.x !== 'number') {
                return;
            }

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
        socket.on('clear_whiteboard', ({ roomId }) => {
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

            // Broadcast to the entire room, including sender for consistency
            io.to(roomId).emit('receive_chat_message', chatPayload);
        });

        /**
         * Event: User disconnects or leaves the room.
         */
        socket.on('disconnect', () => {
            const roomId = socket.data.roomId;
            const username = socket.data.username;

            if (roomId && username) {
                socket.to(roomId).emit('user_left', {
                    username,
                    message: `${username} has left the study room.`
                });
            }
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });
};

module.exports = initializeStudyRoomSockets;
