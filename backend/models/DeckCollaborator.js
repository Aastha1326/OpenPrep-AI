const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeckCollaborator = sequelize.define(
  'DeckCollaborator',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deckId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'FlashcardDecks',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('view', 'edit', 'admin'),
      allowNull: false,
      defaultValue: 'view',
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    timestamps: true,
    tableName: 'DeckCollaborators',
    indexes: [
      {
        name: 'deck_collaborator_deck_idx',
        fields: ['deckId'],
      },
      {
        name: 'deck_collaborator_user_idx',
        fields: ['userId'],
      },
      {
        name: 'deck_collaborator_deck_user_idx',
        fields: ['deckId', 'userId'],
        unique: true,
      },
      {
        name: 'deck_collaborator_status_idx',
        fields: ['status'],
      },
    ],
  }
);

module.exports = DeckCollaborator;
