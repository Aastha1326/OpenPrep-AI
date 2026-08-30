const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FlashcardReviewHistory = sequelize.define(
  'FlashcardReviewHistory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    flashcardId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    schedulerVersionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quality: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 5 },
    },
    preState: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    postState: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    reviewDurationMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    timezoneIdentifier: {
      type: DataTypes.STRING,
      defaultValue: 'UTC',
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'frh_flashcard_idx', fields: ['flashcardId'] },
      { name: 'frh_reviewed_at_idx', fields: ['reviewedAt'] },
    ],
  }
);

module.exports = FlashcardReviewHistory;