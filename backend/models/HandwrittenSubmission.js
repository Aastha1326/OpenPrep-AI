const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HandwrittenSubmission = sequelize.define(
  'HandwrittenSubmission',
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
    examId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    photoUrls: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    transcription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evaluation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    modelAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rubricDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    timestamps: true,
    tableName: 'HandwrittenSubmissions',
  }
);

module.exports = HandwrittenSubmission;
