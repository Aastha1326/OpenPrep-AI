/**
 * @fileoverview Sequelize model for tracking individual user progress toward
 * study milestones. Each record represents one user's state for a single
 * milestone — current value, tier reached, and whether a reward has been claimed.
 */
module.exports = (sequelize, DataTypes) => {
  const UserMilestone = sequelize.define(
    'UserMilestone',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user this progress record belongs to',
      },
      milestoneId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the StudyMilestone definition',
      },
      currentValue: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        comment: 'Current accumulated value toward the metric target',
      },
      currentTier: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment:
          'Highest tier (index into thresholds array) that has been reached',
      },
      highestTierReached: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Peak tier ever reached (never decreases)',
      },
      lastEvaluatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of the most recent automated evaluation',
      },
      rewardClaimed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the user has explicitly claimed the reward',
      },
      rewardClaimedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the reward was claimed',
      },
      isComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True once the highest available tier has been earned',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the highest tier was reached',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Flexible metadata — e.g. notification flags, evaluation notes',
      },
    },
    {
      tableName: 'user_milestones',
      timestamps: true,
      indexes: [
        { fields: ['userId', 'milestoneId'], unique: true },
        { fields: ['userId'] },
        { fields: ['milestoneId'] },
        { fields: ['isComplete'] },
        { fields: ['currentTier'] },
      ],
    }
  );

  return UserMilestone;
};
