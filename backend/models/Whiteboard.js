const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Whiteboard = sequelize.define(
  'Whiteboard',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    squadId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Collaborative Whiteboard',
    },
    state: {
      type: DataTypes.JSONB,
      defaultValue: { strokes: [], nodes: [], edges: [] },
    },
    previewUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'whiteboard_room_idx',
        fields: ['roomId'],
      },
      {
        name: 'whiteboard_squad_idx',
        fields: ['squadId'],
      },
    ],
  }
);

module.exports = Whiteboard;
