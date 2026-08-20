const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizAttempt = sequelize.define(
  'QuizAttempt',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quiz: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    answers: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    weakTopics: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    strongTopics: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        name: 'quizattempt_user_idx',
        fields: ['user'],
      },
      {
        name: 'quizattempt_quiz_idx',
        fields: ['quiz'],
      },
      {
        name: 'quizattempt_user_quiz_idx',
        fields: ['user', 'quiz'],
      },
      {
        name: 'quizattempt_user_created_idx',
        fields: ['user', 'createdAt'],
      },
    ],
  }
);

const cacheManager = require('../utils/cacheManager');

QuizAttempt.afterSave(async (attempt, options) => {
  try {
    const pattern = `user_${attempt.user}:*`;
    await cacheManager.invalidate(pattern);
  } catch (err) {
    console.error('Error invalidating cache after QuizAttempt save:', err);
  }
});

QuizAttempt.afterDestroy(async (attempt, options) => {
  try {
    const pattern = `user_${attempt.user}:*`;
    await cacheManager.invalidate(pattern);
  } catch (err) {
    console.error('Error invalidating cache after QuizAttempt destroy:', err);
  }
});

module.exports = QuizAttempt;
