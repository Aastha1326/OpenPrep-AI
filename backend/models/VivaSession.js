const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VivaSession = sequelize.define(
  'VivaSession',
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    turns: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    feedback: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['subjectId'],
      },
    ],
  }
);

module.exports = VivaSession;
