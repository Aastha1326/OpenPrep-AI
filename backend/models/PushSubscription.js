const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PushSubscription = sequelize.define(
  'PushSubscription',
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
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    keys: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'push_sub_user_idx',
        fields: ['user'],
      },
    ],
  }
);

module.exports = PushSubscription;
