const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeckRating = sequelize.define(
  'DeckRating',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deckId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'deck_rating_deck_idx',
        fields: ['deckId'],
      },
      {
        name: 'deck_rating_user_idx',
        fields: ['userId'],
      },
      {
        name: 'deck_rating_deck_user_unique',
        unique: true,
        fields: ['deckId', 'userId'],
      },
    ],
  }
);

module.exports = DeckRating;
