const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ResumeParseSession Model
 * Stores raw resume metadata, parsed AST structure, and ATS scoring telemetry.
 */
class ResumeParseSession extends Model { }

ResumeParseSession.init(
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
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        originalText: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        targetRole: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Software Engineer'
        },
        overallAtsScore: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Aggregated 0-100 score'
        },
        keywordMatchRate: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        formattingPenalty: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        extractedNodes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Structured data: { experience[], education[], skills[], projects[] }'
        },
        missingKeywords: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('Uploading', 'Parsing', 'Scoring', 'Complete', 'Failed'),
            defaultValue: 'Uploading',
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    },
    {
        sequelize,
        modelName: 'ResumeParseSession',
        tableName: 'resume_parse_sessions',
        timestamps: true,
    }
);

ResumeParseSession.beforeUpdate((session, options) => {
    if (session.status === 'Complete' && !session.processedAt) {
        session.processedAt = new Date();
    }
});

module.exports = ResumeParseSession;
