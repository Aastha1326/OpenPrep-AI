/**
 * @fileoverview Sequelize model for tracking focused study sessions and analytics.
 */
module.exports = (sequelize, DataTypes) => {
    const StudySession = sequelize.define('StudySession', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        topic: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Optional topic being studied',
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Total duration of the completed session in minutes',
        },
        focusScore: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Self-rated focus score (1-5)',
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        tableName: 'study_sessions',
        timestamps: true,
        indexes: [{ fields: ['userId', 'createdAt'] }]
    });

    return StudySession;
};
