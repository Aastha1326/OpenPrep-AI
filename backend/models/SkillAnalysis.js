/**
 * @fileoverview Sequelize model for persisting historical skill gap analysis results.
 */
module.exports = (sequelize, DataTypes) => {
    const SkillAnalysis = sequelize.define('SkillAnalysis', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Reference to the user who performed the analysis',
        },
        targetRole: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'The job title or role the resume was analyzed against',
        },
        overallMatchScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Overall percentage match between resume and job description (0-100)',
        },
        extractedSkills: {
            type: DataTypes.JSONB,
            allowNull: false,
            comment: 'JSON array of extracted skills with current and required proficiency',
        },
        recommendations: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'AI-generated study recommendations based on gaps',
        },
    }, {
        tableName: 'skill_analyses',
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['createdAt'] }
        ]
    });

    return SkillAnalysis;
};
