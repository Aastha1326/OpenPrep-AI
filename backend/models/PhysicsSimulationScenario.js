const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const PhysicsSimulationScenario = sequelize.define('PhysicsSimulationScenario', {
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
  category: {
    type: DataTypes.ENUM('KINEMATICS', 'COLLISIONS', 'HARMONIC', 'GRAVITY'),
    defaultValue: 'COLLISIONS',
  },
  initialBodies: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },
  physicsParams: {
    type: DataTypes.JSONB,
    defaultValue: { gravity: 9.81, restitution: 1.0, friction: 0.05 },
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
    {
      fields: ['category'],
    },
  ],
});

PhysicsSimulationScenario.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PhysicsSimulationScenario, { foreignKey: 'userId' });

module.exports = PhysicsSimulationScenario;
