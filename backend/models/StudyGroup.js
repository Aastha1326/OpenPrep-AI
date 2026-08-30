/**
 * @fileoverview Sequelize model for tracking peer-to-peer study groups and sessions.
 */
module.exports = (sequelize, DataTypes) => {
    const StudyGroup = sequelize.define('StudyGroup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        hostId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who created the group',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        examDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        maxMembers: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
        },
        currentMembers: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        nextSessionTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('open', 'full', 'closed'),
            defaultValue: 'open',
        },
    }, {
        tableName: 'study_groups',
        timestamps: true,
        indexes: [
            { fields: ['subject'] },
            { fields: ['status'] }
        ]
    });

    return StudyGroup;
};
