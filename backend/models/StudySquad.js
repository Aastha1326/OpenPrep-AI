const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudySquad = sequelize.define('StudySquad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  inviteCode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 6]
    }
  },
  adminUserId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'study_squads'
});

module.exports = StudySquad;
