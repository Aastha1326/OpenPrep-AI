const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const DeckSuggestion = sequelize.define('DeckSuggestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  deckId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  authorUserId: {
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
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  diffReport: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['deckId'],
    },
    {
      fields: ['authorUserId'],
    },
    {
      fields: ['status'],
    },
  ],
});

DeckSuggestion.belongsTo(User, { foreignKey: 'authorUserId' });
User.hasMany(DeckSuggestion, { foreignKey: 'authorUserId' });

module.exports = DeckSuggestion;
