const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReviewSubmissionToken = sequelize.define(
  'ReviewSubmissionToken',
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
    submissionToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reviewHistoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'rst_flashcard_idx', fields: ['flashcardId'] },
      { name: 'rst_token_idx', fields: ['submissionToken'] },
    ],
  }
);

module.exports = ReviewSubmissionToken;