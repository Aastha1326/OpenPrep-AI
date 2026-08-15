const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Folder = sequelize.define(
  'Folder',
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
        notEmpty: { msg: 'Folder name is required' },
      },
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['parentId'],
      },
    ],
  }
);

module.exports = Folder;
