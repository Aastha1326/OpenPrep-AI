const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * JobApplication Model
 * Represents a single node on the Job Kanban Tracker.
 * Manages comprehensive state and metadata for telemetry.
 */
class JobApplication extends Model { }

JobApplication.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Identifier of the student who owns this application'
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },
        roleTitle: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },
        status: {
            type: DataTypes.ENUM(
                'Wishlist',
                'Applied',
                'Interviewing',
                'Offered',
                'Rejected',
                'Accepted'
            ),
            allowNull: false,
            defaultValue: 'Wishlist',
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        expectedSalary: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Base expected salary track'
        },
        offeredSalary: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Final package offering'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        applicationUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true,
            }
        },
        colorTag: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '#3b82f6', // Default blue tag
        },
        // Timeline tracking for analytics metrics
        dateAddedToWishlist: { type: DataTypes.DATE, allowNull: true },
        dateApplied: { type: DataTypes.DATE, allowNull: true },
        dateFirstInterview: { type: DataTypes.DATE, allowNull: true },
        dateOffered: { type: DataTypes.DATE, allowNull: true },
        dateRejected: { type: DataTypes.DATE, allowNull: true },

        kanbanOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Vertical sorting index within the specific status column'
        }
    },
    {
        sequelize,
        modelName: 'JobApplication',
        tableName: 'job_applications',
        timestamps: true,
        indexes: [
            { fields: ['userId', 'status'] },
            { fields: ['companyName'] }
        ]
    }
);

/**
 * Hook to automatically update timeline metrics based on status transitions
 */
JobApplication.beforeUpdate(async (job, options) => {
    if (job.changed('status')) {
        const now = new Date();
        switch (job.status) {
            case 'Applied':
                if (!job.dateApplied) job.dateApplied = now;
                break;
            case 'Interviewing':
                if (!job.dateFirstInterview) job.dateFirstInterview = now;
                break;
            case 'Offered':
            case 'Accepted':
                if (!job.dateOffered) job.dateOffered = now;
                break;
            case 'Rejected':
                if (!job.dateRejected) job.dateRejected = now;
                break;
        }
    }
});

module.exports = JobApplication;
