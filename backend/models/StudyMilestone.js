/**
 * @fileoverview Sequelize model for defining study milestones that users can earn.
 * Milestones are achievement targets that are automatically evaluated against
 * user activity (quizzes taken, study hours, streaks, etc.) and awarded with
 * XP bonuses, badge unlocks, or other rewards.
 */
module.exports = (sequelize, DataTypes) => {
  const StudyMilestone = sequelize.define(
    'StudyMilestone',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        comment: 'Short display name, e.g. "Quiz Master"',
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        comment: 'URL-safe identifier, e.g. "quiz-master"',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description shown to the user',
      },
      category: {
        type: DataTypes.ENUM(
          'quiz',
          'study_hours',
          'streak',
          'flashcard',
          'note',
          'battle',
          'focus_session',
          'social',
          'general'
        ),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Activity category this milestone tracks',
      },
      metricType: {
        type: DataTypes.STRING(60),
        allowNull: false,
        comment:
          'Name of the metric to evaluate, e.g. "quizzesTaken", "totalStudyMinutes", "currentStreak"',
      },
      thresholds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment:
          'Array of { level: number, target: number, label: string } objects for tiered milestones',
      },
      rewardXp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bonus XP awarded when any tier of this milestone is earned',
      },
      rewardBadgeCode: {
        type: DataTypes.STRING(80),
        allowNull: true,
        comment: 'Badge code to unlock when the highest tier is reached',
      },
      iconEmoji: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: '🏆',
        comment: 'Emoji icon displayed alongside the milestone',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Inactive milestones are hidden but still evaluated',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Display ordering (lower = shown first)',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Flexible key-value store for milestone-specific configuration',
      },
    },
    {
      tableName: 'study_milestones',
      timestamps: true,
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['category'] },
        { fields: ['isActive'] },
        { fields: ['sortOrder'] },
      ],
    }
  );

  return StudyMilestone;
};
