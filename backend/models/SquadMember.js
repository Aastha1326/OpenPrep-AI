const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SquadMember = sequelize.define('SquadMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'squad_members',
  indexes: [
    {
      unique: true,
      fields: ['squadId', 'userId'] // Prevent duplicate membership
    }
  ]
});

module.exports = SquadMember;
