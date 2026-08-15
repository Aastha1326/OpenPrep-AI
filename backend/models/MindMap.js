const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MindMap = sequelize.define(
  'MindMap',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Interactive Concept Mind Map',
    },
    nodesData: {
      type: DataTypes.JSONB,
      defaultValue: { nodes: [], edges: [], hierarchy: {} },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'mindmap_user_idx',
        fields: ['user'],
      },
      {
        name: 'mindmap_subject_idx',
        fields: ['subject'],
      },
      {
        name: 'mindmap_note_idx',
        fields: ['note'],
      },
    ],
  }
);

module.exports = MindMap;
