const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const CircuitModel = sequelize.define('CircuitModel', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'COMBINATIONAL',
  },
  nodes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  wires: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['category'],
    },
  ],
});

CircuitModel.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CircuitModel, { foreignKey: 'userId' });

module.exports = CircuitModel;
