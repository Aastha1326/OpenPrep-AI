const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const GraphProject = sequelize.define('GraphProject', {
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
  isDirected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isWeighted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  nodes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  edges: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
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

GraphProject.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(GraphProject, { foreignKey: 'userId' });

module.exports = GraphProject;
