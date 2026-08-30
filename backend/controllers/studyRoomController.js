/**
 * @fileoverview Controller for managing Collaborative Study Room lifecycle.
 */

/**
 * Creates a new study room and generates a unique access code.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createStudyRoom = async (req, res) => {
    try {
        const { roomName, creatorName } = req.body;

        if (!roomName || !creatorName) {
            return res.status(400).json({
                success: false,
                message: 'roomName and creatorName are required.'
            });
        }

        // Generate a 6-character alphanumeric room code
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // In a full implementation, save this to the PostgreSQL database via Sequelize
        const newRoom = {
            id: `room_${Date.now()}`,
            roomCode,
            roomName,
            creatorName,
            createdAt: new Date().toISOString(),
            whiteboardState: [], // Will be populated on close
            chatHistory: [],     // Will be populated on close
        };

        res.status(201).json({
            success: true,
            data: newRoom,
        });
    } catch (error) {
        console.error('Error creating study room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating study room.'
        });
    }
};

/**
 * Validates a room code and returns room details.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const joinStudyRoom = async (req, res) => {
    try {
        const { roomCode } = req.params;

        if (!roomCode || roomCode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room code format.'
            });
        }

        // Mock database lookup. Replace with Sequelize model query in production.
        // const room = await StudyRoom.findOne({ where: { roomCode } });
        const roomExists = true; // Mocked

        if (!roomExists) {
            return res.status(404).json({
                success: false,
                message: 'Study room not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                roomCode,
                message: 'Room validated. Connect via WebSocket to join.'
            }
        });
    } catch (error) {
        console.error('Error joining study room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while joining study room.'
        });
    }
};

/**
 * Persists the final state of a study room (whiteboard + chat) upon closure.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const closeStudyRoom = async (req, res) => {
    try {
        const { roomId, whiteboardState, chatHistory } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId is required.'
            });
        }

        // Mock database update. Replace with Sequelize model update in production.
        console.log(`[Controller] Persisting room ${roomId} with ${whiteboardState?.length || 0} strokes and ${chatHistory?.length || 0} messages.`);

        res.status(200).json({
            success: true,
            message: 'Study room closed and state persisted successfully.'
        });
    } catch (error) {
        console.error('Error closing study room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while closing study room.'
        });
    }
};

module.exports = {
    createStudyRoom,
    joinStudyRoom,
    closeStudyRoom,
};
