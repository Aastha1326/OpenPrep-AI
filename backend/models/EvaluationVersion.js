const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class EvaluationVersion extends Model {}

EvaluationVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    weights: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    rubric: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'EvaluationVersion',
    tableName: 'evaluation_versions',
    timestamps: true,
  }
);

module.exports = EvaluationVersion;