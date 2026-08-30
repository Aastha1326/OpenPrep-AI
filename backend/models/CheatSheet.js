const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const CheatSheet = sequelize.define('CheatSheet', {
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
    allowNull: false,
    defaultValue: 'General',
  },
  columns: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  sections: {
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
      fields: ['subject'],
    },
  ],
});

CheatSheet.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CheatSheet, { foreignKey: 'userId' });

module.exports = CheatSheet;
