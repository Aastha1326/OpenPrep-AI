/**
 * @fileoverview Sequelize model for tracking peer-to-peer mock interview pairings and feedback.
 */
module.exports = (sequelize, DataTypes) => {
    const InterviewExchange = sequelize.define('InterviewExchange', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requesterId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who initiated the interview request',
        },
        receiverId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who received the request',
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        scheduledTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'completed', 'rejected', 'cancelled'),
            defaultValue: 'pending',
        },
        feedback: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Structured feedback: { communication: 1-5, technical: 1-5, comments: string }',
        },
    }, {
        tableName: 'interview_exchanges',
        timestamps: true,
        indexes: [
            { fields: ['requesterId'] },
            { fields: ['receiverId'] },
            { fields: ['status'] }
        ]
    });

    return InterviewExchange;
};
