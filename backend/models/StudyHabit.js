/**
 * @fileoverview Sequelize model for defining trackable study habits.
 * Each habit represents a daily routine the student wants to maintain,
 * such as "Read 30 minutes", "Review flashcards", or "Solve 10 problems".
 */
module.exports = (sequelize, DataTypes) => {
  const StudyHabit = sequelize.define(
    'StudyHabit',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who owns this habit',
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        comment: 'Short display name, e.g. "Morning Flashcard Review"',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional longer description of the habit',
      },
      iconEmoji: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: '✅',
        comment: 'Emoji icon shown in calendar views',
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#4F46E5',
        comment: 'Hex color for calendar heatmap display',
      },
      category: {
        type: DataTypes.ENUM(
          'reading',
          'practice',
          'review',
          'exercise',
          'writing',
          'meditation',
          'custom'
        ),
        allowNull: false,
        defaultValue: 'custom',
        comment: 'Categorization for filtering and analytics',
      },
      frequency: {
        type: DataTypes.ENUM('daily', 'weekdays', 'specific_days'),
        allowNull: false,
        defaultValue: 'daily',
        comment: 'How often the habit should be performed',
      },
      specificDays: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment:
          'Array of day-of-week numbers (0=Sun..6=Sat) when frequency is specific_days',
      },
      targetMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional target duration in minutes for the habit',
      },
      targetCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Number of completions required per day (e.g. 3 sets of exercises)',
      },
      reminderTime: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Suggested reminder time (HH:MM)',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Inactive habits are hidden from tracking but history is preserved',
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Archived habits are read-only',
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the habit was archived',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Display ordering within the user\'s habit list',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Flexible key-value store for habit-specific configuration',
      },
    },
    {
      tableName: 'study_habits',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'isActive'] },
        { fields: ['userId', 'category'] },
        { fields: ['sortOrder'] },
      ],
    }
  );

  return StudyHabit;
};
