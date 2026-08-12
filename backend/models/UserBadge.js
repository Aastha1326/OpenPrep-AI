const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserBadge = sequelize.define(
  'UserBadge',
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
    badgeCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unlockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = UserBadge;
