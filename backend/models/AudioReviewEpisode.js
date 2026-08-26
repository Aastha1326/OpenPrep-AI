const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const AudioReviewEpisode = sequelize.define('AudioReviewEpisode', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  cadenceSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  chapters: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  script: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
  ],
});

AudioReviewEpisode.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AudioReviewEpisode, { foreignKey: 'userId' });

module.exports = AudioReviewEpisode;
