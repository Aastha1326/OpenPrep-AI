/**
 * @fileoverview Sequelize model for storing persistent AI chat histories.
 */
module.exports = (sequelize, DataTypes) => {
    const ChatSession = sequelize.define('ChatSession', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        topic: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'The main subject of this chat session',
        },
        messages: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Array of message objects: { role: "user" | "model", content: string, timestamp: string }',
        },
    }, {
        tableName: 'chat_sessions',
        timestamps: true,
        indexes: [{ fields: ['userId', 'createdAt'] }]
    });

    return ChatSession;
};
