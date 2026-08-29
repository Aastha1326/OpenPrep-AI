const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskDependency = sequelize.define(
  'TaskDependency',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dependsOnTaskId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ name: 'td_task_idx', fields: ['taskId', 'dependsOnTaskId'] }],
  }
);

module.exports = TaskDependency;