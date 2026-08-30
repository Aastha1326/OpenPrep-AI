const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const CodeSubmission = sequelize.define('CodeSubmission', {
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
  problemId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'javascript',
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tokenFingerprint: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  cyclomaticComplexity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  halsteadVolume: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  reviewReport: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['problemId'],
    },
  ],
});

CodeSubmission.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(CodeSubmission, { foreignKey: 'userId' });

module.exports = CodeSubmission;
