const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SquadMember = sequelize.define('SquadMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  squadId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'StudySquads',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
  pointsContributed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['squadId', 'userId']
    }
  ]
});

module.exports = SquadMember;
