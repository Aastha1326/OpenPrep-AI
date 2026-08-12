const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PYQQuestion = sequelize.define(
  'PYQQuestion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pyqAnalysisId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    chapterName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    topicName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['pyqAnalysisId'],
      },
      {
        fields: ['chapterName'],
      },
    ],
  }
);

module.exports = PYQQuestion;
