const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const DeckFork = sequelize.define('DeckFork', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentDeckId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  forkedDeckId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id',
    },
    allowNull: false,
  },
  parentVersionHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['parentDeckId'],
    },
    {
      fields: ['forkedDeckId'],
    },
    {
      fields: ['userId'],
    },
  ],
});

DeckFork.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(DeckFork, { foreignKey: 'userId' });

module.exports = DeckFork;
