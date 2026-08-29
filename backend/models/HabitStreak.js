/**
 * @fileoverview Sequelize model for tracking persistent streak data for each
 * habit. Updated after every log entry and used for fast dashboard queries
 * without recalculating from the full log history.
 */
module.exports = (sequelize, DataTypes) => {
  const HabitStreak = sequelize.define(
    'HabitStreak',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who owns this streak',
      },
      habitId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The habit this streak tracks',
      },
      currentStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Consecutive qualifying days ending today or yesterday',
      },
      longestStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'All-time longest streak for this habit',
      },
      lastCompletedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Most recent date the habit was completed',
      },
      lastStreakStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Start date of the current streak run',
      },
      totalCompletions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total number of days the habit was completed',
      },
      totalSkips: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of required days the habit was skipped',
      },
      completionRate: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        comment: 'Rolling completion percentage (0-100)',
      },
      lastEvaluatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the streak was last recalculated',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Flexible metadata — e.g. grace day flags, holiday adjustments',
      },
    },
    {
      tableName: 'habit_streaks',
      timestamps: true,
      indexes: [
        { fields: ['userId', 'habitId'], unique: true },
        { fields: ['userId'] },
        { fields: ['currentStreak'] },
        { fields: ['longestStreak'] },
      ],
    }
  );

  return HabitStreak;
};
