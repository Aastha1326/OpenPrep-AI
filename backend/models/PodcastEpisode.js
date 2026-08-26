const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PodcastEpisode = sequelize.define(
  'PodcastEpisode',
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deckId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    transcript: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    ambientTrack: {
      type: DataTypes.STRING,
      defaultValue: 'lofi',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'completed',
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['userId', 'subjectId'],
      },
    ],
  }
);

module.exports = PodcastEpisode;
