/**
 * @fileoverview Sequelize model for recording individual habit completion logs.
 * Each record represents one instance of a user completing (or partially
 * completing) a habit on a given day.
 */
module.exports = (sequelize, DataTypes) => {
  const HabitLog = sequelize.define(
    'HabitLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who completed the habit',
      },
      habitId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the StudyHabit definition',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'The calendar date (YYYY-MM-DD) this log applies to',
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the habit was completed this instance',
      },
      completionCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment:
          'Number of times the habit was done on this date (supports multi-count habits)',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Actual time spent on the habit in minutes',
      },
      qualityRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Self-reported quality rating (1-5) for the habit session',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional note about this habit completion',
      },
      source: {
        type: DataTypes.STRING(40),
        allowNull: true,
        defaultValue: 'manual',
        comment:
          'Origin of the log entry: manual, focus_session, quiz_completion, etc.',
      },
      sourceId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the source entity if created automatically',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Flexible metadata for source-specific details',
      },
    },
    {
      tableName: 'habit_logs',
      timestamps: true,
      indexes: [
        { fields: ['userId', 'habitId', 'date'], unique: true },
        { fields: ['userId', 'date'] },
        { fields: ['habitId'] },
        { fields: ['date'] },
        { fields: ['userId', 'completed'] },
      ],
    }
  );

  return HabitLog;
};
