const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SyllabusTopic = sequelize.define(
  'SyllabusTopic',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    syllabusId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    moduleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtopics: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    weightage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    coverageStatus: {
      type: DataTypes.ENUM('Covered', 'Partially Covered', 'Unstudied Gap'),
      defaultValue: 'Unstudied Gap',
    },
    linkedNoteId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['syllabusId'],
      },
      {
        fields: ['coverageStatus'],
      },
    ],
  }
);

module.exports = SyllabusTopic;
