const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subject = sequelize.define(
  'Subject',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a subject name' },
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    exam: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    weightage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    clonedFromId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    cloneCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    ratingsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    starCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },

  {
    timestamps: true,
    indexes: [
      {
        name: 'subject_exam_idx',
        fields: ['exam'],
      },
      {
        name: 'subject_user_idx',
        fields: ['user'],
      },
      {
        name: 'subject_is_public_rating_idx',
        fields: ['isPublic', 'rating'],
      },
      {
        name: 'subject_is_public_clone_count_idx',
        fields: ['isPublic', 'cloneCount'],
      },
    ],
  }
);

module.exports = Subject;
