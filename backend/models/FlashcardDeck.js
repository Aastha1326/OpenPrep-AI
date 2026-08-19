const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FlashcardDeck = sequelize.define(
  'FlashcardDeck',
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
        notEmpty: { msg: 'Please add a deck name' },
      },
    },
    subject: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    shareToken: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    cloneCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
    tableName: 'FlashcardDecks',
    indexes: [
      {
        name: 'flashcard_deck_user_idx',
        fields: ['user'],
      },
      {
        name: 'flashcard_deck_share_token_idx',
        fields: ['shareToken'],
      },
    ],
  }
);

module.exports = FlashcardDeck;
