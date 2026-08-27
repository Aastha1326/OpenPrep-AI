const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
/**
 * MockInterview Model
 * Stores telemetry, configuration, and transcript for an AI Mock Interview session.
 */
class MockInterview extends Model { }

MockInterview.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        targetCompany: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'General Technical',
        },
        jobRole: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        difficultyLevel: {
            type: DataTypes.ENUM('Junior', 'Mid', 'Senior', 'Staff'),
            allowNull: false,
            defaultValue: 'Mid',
        },
        status: {
            type: DataTypes.ENUM('Scheduled', 'InProgress', 'Completed', 'Aborted'),
            defaultValue: 'Scheduled',
        },
        durationSeconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        transcript: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of message objects: [{ role: "ai", text: "..." }, { role: "user", text: "..." }]'
        },
        overallScore: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            }
        },
        // Detailed Telemetry
        technicalScore: { type: DataTypes.INTEGER, allowNull: true },
        communicationScore: { type: DataTypes.INTEGER, allowNull: true },
        confidenceMetrics: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Real-time tracked sentiment and vocal tone confidence array'
        },
        feedbackSummary: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        feedbackProvenance: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Evidence, AI model, prompt version, and confidence metadata for interview feedback',
        },        startedAt: { type: DataTypes.DATE, allowNull: true },
        completedAt: { type: DataTypes.DATE, allowNull: true },
        evaluationVersionId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        evaluationSnapshot: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Immutable evaluation version configuration used for scoring',
        },    },
    {
        sequelize,
        modelName: 'MockInterview',
        tableName: 'mock_interviews',
        timestamps: true,
    }
);

/**
 * Ensures durations and scores are properly bounded before saving
 */
MockInterview.beforeSave((session, options) => {
    if (session.status === 'Completed' && !session.completedAt) {
        session.completedAt = new Date();
    }

    if (session.startedAt && session.completedAt) {
        session.durationSeconds = Math.floor(
            (new Date(session.completedAt) - new Date(session.startedAt)) / 1000
        );
    }
});

module.exports = MockInterview;
