const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ConjugationDrill = sequelize.define('ConjugationDrill', {
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
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'spanish',
  },
  verb: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tense: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'present',
  },
  accuracyScore: {
    type: DataTypes.FLOAT,
    defaultValue: 100.0,
  },
  mistakeHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['language'],
    },
  ],
});

ConjugationDrill.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ConjugationDrill, { foreignKey: 'userId' });

module.exports = ConjugationDrill;
