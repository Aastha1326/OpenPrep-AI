const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const MockEndpoint = sequelize.define('MockEndpoint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id',
    },
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    defaultValue: 'GET',
  },
  statusCode: {
    type: DataTypes.INTEGER,
    defaultValue: 200,
  },
  delayMs: {
    type: DataTypes.INTEGER,
    defaultValue: 150,
  },
  responseSchema: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  headers: {
    type: DataTypes.JSONB,
    defaultValue: { 'Content-Type': 'application/json' },
  },
  callCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['path'],
    },
  ],
});

MockEndpoint.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(MockEndpoint, { foreignKey: 'userId' });

module.exports = MockEndpoint;
