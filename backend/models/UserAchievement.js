/**
 * @fileoverview Sequelize model for tracking user achievements, badges, and streaks.
 */
module.exports = (sequelize, DataTypes) => {
    const UserAchievement = sequelize.define('UserAchievement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        achievementType: {
            type: DataTypes.ENUM('streak_3', 'streak_7', 'streak_30', 'quiz_master', 'flashcard_pro', 'note_contributor'),
            allowNull: false,
        },
        currentCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Progress towards the next threshold',
        },
        isUnlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        unlockedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'user_achievements',
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['isUnlocked'] }
        ]
    });

    return UserAchievement;
};
