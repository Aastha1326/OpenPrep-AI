const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * WeaknessReport — stores periodic snapshots of a user's weakness profile.
 * Each row captures a point-in-time assessment of topic mastery across all
 * subjects, enabling trend analysis, improvement velocity tracking, and
 * historical comparison.
 */
const WeaknessReport = sequelize.define(
  'WeaknessReport',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    subjectName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    topicBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: [],
      /*
        Shape:
        [
          {
            topicId: "uuid",
            topicName: "string",
            status: "Weak" | "Medium" | "Strong",
            avgScore: 0-100,
            attemptCount: number,
            confidenceScore: 0-1,
            improvementVelocity: number (slope),
            lastAttemptAt: ISO date,
          }
        ]
      */
    },
    overallScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    weakCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    mediumCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    strongCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    coveragePercentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    aiRecommendations: {
      type: DataTypes.JSONB,
      defaultValue: [],
      /*
        Shape:
        [
          {
            type: "study" | "quiz" | "review" | "focus",
            priority: "high" | "medium" | "low",
            title: "string",
            description: "string",
            topicName: "string",
            estimatedMinutes: number,
          }
        ]
      */
    },
    trendDirection: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      defaultValue: 'stable',
    },
    comparisonDelta: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Score change compared to previous report',
    },
    snapshotType: {
      type: DataTypes.ENUM('auto', 'manual', 'post-quiz', 'post-study'),
      defaultValue: 'auto',
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'weaknessreport_user_idx',
        fields: ['user'],
      },
      {
        name: 'weaknessreport_user_subject_idx',
        fields: ['user', 'subject'],
      },
      {
        name: 'weaknessreport_user_created_idx',
        fields: ['user', 'createdAt'],
      },
      {
        name: 'weaknessreport_user_trend_idx',
        fields: ['user', 'trendDirection'],
      },
    ],
  }
);

module.exports = WeaknessReport;
