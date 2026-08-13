const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Syllabus = sequelize.define(
  'Syllabus',
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
    ],
  }
);

module.exports = Syllabus;
