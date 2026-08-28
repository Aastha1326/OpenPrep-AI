const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * MilestoneReward — tracks learning milestones and associated rewards/badges.
 * When a student hits a defined milestone (e.g. 10 quizzes, 50 study hours),
 * a reward record is created. The student can claim or view their earned rewards.
 */
const MilestoneReward = sequelize.define(
  'MilestoneReward',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, allowNull: false },
    milestoneType: {
      type: DataTypes.ENUM('quiz_count', 'study_hours', 'streak', 'topic_mastery', 'flashcard_review', 'score_achievement', 'custom'),
      allowNull: false,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    targetValue: { type: DataTypes.FLOAT, allowNull: false },
    currentValue: { type: DataTypes.FLOAT, defaultValue: 0 },
    unit: { type: DataTypes.STRING, defaultValue: '' },
    rewardType: {
      type: DataTypes.ENUM('badge', 'xp', 'title', 'theme', 'streak_freeze', 'custom'),
      defaultValue: 'xp',
    },
    rewardValue: { type: DataTypes.FLOAT, defaultValue: 0 },
    rewardLabel: { type: DataTypes.STRING, defaultValue: '' },
    status: {
      type: DataTypes.ENUM('locked', 'in_progress', 'earned', 'claimed'),
      defaultValue: 'locked',
    },
    earnedAt: { type: DataTypes.DATE, allowNull: true },
    claimedAt: { type: DataTypes.DATE, allowNull: true },
    icon: { type: DataTypes.STRING, defaultValue: '🏆' },
    tier: { type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'), defaultValue: 'bronze' },
  },
  {
    timestamps: true,
    indexes: [
      { name: 'milestonereward_user_idx', fields: ['user'] },
      { name: 'milestonereward_user_type_idx', fields: ['user', 'milestoneType'] },
      { name: 'milestonereward_user_status_idx', fields: ['user', 'status'] },
    ],
  }
);

module.exports = MilestoneReward;
