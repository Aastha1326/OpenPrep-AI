const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Exam = sequelize.define(
  'Exam',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add an exam name' },
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add an exam date' },
      },
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isBundle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    targetExamType: {
      type: DataTypes.STRING,
      defaultValue: 'Custom',
    },
  },

  {
    timestamps: true,
    indexes: [
      {
        name: 'exam_user_idx',
        fields: ['user'],
      },
      {
        name: 'exam_user_created_idx',
        fields: ['user', 'createdAt'],
      },
    ],
  }
);

module.exports = Exam;
