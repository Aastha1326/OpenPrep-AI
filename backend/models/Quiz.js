const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Quiz = sequelize.define(
  'Quiz',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a quiz title' },
      },
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    topic: {
      type: DataTypes.UUID,
    },
    questions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    type: {
      type: DataTypes.ENUM('AI_Generated', 'Manual'),
      defaultValue: 'AI_Generated',
    },
    sourceType: {
      type: DataTypes.STRING(20),
      defaultValue: 'AI_Generated',
      allowNull: false,
      validate: {
        isIn: {
          args: [['AI_Generated', 'REMEDIATION']],
          msg: 'sourceType must be AI_Generated or REMEDIATION',
        },
      },
    },
    linkedDeckId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'english',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    embedding: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'quiz_createdby_id_idx',
        unique: false,
        fields: ['createdBy', 'id'],
      },
      {
        name: 'quiz_subject_idx',
        fields: ['subject'],
      },
      {
        name: 'quiz_topic_idx',
        fields: ['topic'],
      },
    ],
  }
);

module.exports = Quiz;
