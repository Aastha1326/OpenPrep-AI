const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * AlumniMentorProfile Model
 * Master dataset containing registered alumni willing to mentor students.
 */
class AlumniMentorProfile extends Model { }

AlumniMentorProfile.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        alumniId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        currentCompany: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        currentRole: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        industry: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        yearsOfExperience: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        bioText: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        skillsRequired: {
            type: DataTypes.JSON,
            comment: 'Skills the mentor can offer guidance on e.g., ["React", "System Design", "AWS"]',
            allowNull: true,
        },
        availabilityStatus: {
            type: DataTypes.ENUM('Open', 'Waitlist', 'Unavailable'),
            defaultValue: 'Open',
        },
        maxMentees: {
            type: DataTypes.INTEGER,
            defaultValue: 3,
        },
        currentMenteeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        socialLinks: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '{ linkedin: "...", github: "..." }'
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        matchAffinityScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Virtual transient column for runtime matching algorithm'
        }
    },
    {
        sequelize,
        modelName: 'AlumniMentorProfile',
        tableName: 'alumni_mentor_profiles',
        timestamps: true,
        indexes: [
            { fields: ['industry'] },
            { fields: ['currentCompany'] }
        ]
    }
);

// Prevent over-booking mentees
AlumniMentorProfile.beforeUpdate((profile) => {
    if (profile.currentMenteeCount >= profile.maxMentees) {
        profile.availabilityStatus = 'Waitlist';
    } else if (profile.availabilityStatus === 'Waitlist' && profile.currentMenteeCount < profile.maxMentees) {
        profile.availabilityStatus = 'Open';
    }
});

module.exports = AlumniMentorProfile;
