/**
 * @fileoverview Sequelize model for caching interview sentiment and confidence analytics.
 */
module.exports = (sequelize, DataTypes) => {
    const InterviewAnalytics = sequelize.define('InterviewAnalytics', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Reference to the specific viva/quiz session',
        },
        confidenceScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'AI-evaluated confidence score (1-10)',
        },
        sentiment: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Overall sentiment: positive, neutral, or negative',
        },
        keywords: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Array of key technical terms identified in the response',
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'interview_analytics',
        timestamps: true,
        indexes: [{ fields: ['userId', 'createdAt'] }]
    });

    return InterviewAnalytics;
};
