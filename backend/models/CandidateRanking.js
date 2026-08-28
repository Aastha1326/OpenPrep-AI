const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CandidateRanking = sequelize.define(
  'CandidateRanking',
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
    interviewId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    partitionType: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    partitionKey: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    percentile: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    benchmark: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: 'candidate_rankings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'partitionType', 'partitionKey'],
      },
      {
        fields: ['partitionType', 'partitionKey', 'score'],
      },
    ],
  }
);

module.exports = CandidateRanking;