const { Model, DataTypes } = require('sequelize');

/**
 * ModeratorAuditLog Model
 * 
 * Specifically tracks all actions taken by administrators,
 * compliance officers, and automated AI moderation workflows.
 * Serves as a canonical, immutable ledger of moderation actions.
 * Perfect for GDPR compliance, accountability, and the Enterprise Dashboard.
 * 
 * @class ModeratorAuditLog
 * @extends Model
 */
class ModeratorAuditLog extends Model {
    /**
     * Helper method for defining associations.
     * @static
     * @param {Object} models - Injected models
     */
    static associate(models) {
        if (models.User) {
            // The administrator taking the action
            ModeratorAuditLog.belongsTo(models.User, {
                foreignKey: 'moderatorId',
                as: 'moderator',
                onDelete: 'RESTRICT', // Never delete a user if they have moderation history
            });

            // The user being affected by the action (if applicable)
            ModeratorAuditLog.belongsTo(models.User, {
                foreignKey: 'targetUserId',
                as: 'targetUser',
                onDelete: 'RESTRICT',
            });
        }

        if (models.ContentItem) {
            // A specific asset being moderated (Post, Quiz, Comment, etc)
            ModeratorAuditLog.belongsTo(models.ContentItem, {
                foreignKey: 'contentItemId',
                as: 'contentItem',
            });
        }
    }

    /**
     * Determines if a specific moderation action can be reversed
     */
    get isReversible() {
        return ['USER_BANNED', 'CONTENT_HIDDEN', 'FLAG_RAISED'].includes(this.actionType)
            && !this.revertedAt;
    }
}

/**
 * Initialization routine for ModeratorAuditLog schema
 */
function initModeratorAuditLog(sequelize) {
    ModeratorAuditLog.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            moderatorId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'ID of the system moderator or admin User who performed the action. Empty implies System AI action.',
            },
            targetUserId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'ID of the user affected by the moderator action',
            },
            contentItemId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'ID of the content (Comment, File, Submission) that was targeted',
            },
            actionType: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [[
                        'USER_BANNED',
                        'USER_WARNED',
                        'USER_UNBANNED',
                        'CONTENT_HIDDEN',
                        'CONTENT_DELETED',
                        'CONTENT_APPROVED',
                        'FLAG_RAISED',
                        'FLAG_RESOLVED',
                        'AI_AUTO_BAN',
                        'AI_CONTENT_BLOCK',
                        'SYSTEM_OVERRIDE'
                    ]]
                },
                comment: 'Exact type of moderation action executed',
            },
            entityModel: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: 'Which table/model is targeted (e.g., "ForumPost", "QuizResult")',
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [5, 2000],
                },
                comment: 'Textual justification provided by the moderator or AI agent',
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: 'Diff states, previous statuses, snapshot of blocked content',
            },
            detectedByAI: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Indicator that the action was originally flagged by an AI toxicity filter',
            },
            aiConfidenceScore: {
                type: DataTypes.FLOAT,
                allowNull: true,
                validate: {
                    min: 0.0,
                    max: 1.0
                },
                comment: '0-1.0 confidence score if flagged by AI model',
            },
            revertedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Timestamp if this moderation action was later appealed and reversed',
            },
            revertedById: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Who performed the reversal',
            },
            revertReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Justification for the action reversal',
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            }
        },
        {
            sequelize,
            modelName: 'ModeratorAuditLog',
            tableName: 'moderator_audit_logs',
            timestamps: true, // Auto adds createdAt, updatedAt
            paranoid: true,  // Never hard delete audit logs, deletedAt will track removals
            indexes: [
                {
                    name: 'idx_modlog_moderator',
                    fields: ['moderatorId'],
                },
                {
                    name: 'idx_modlog_target_user',
                    fields: ['targetUserId'],
                },
                {
                    name: 'idx_modlog_action_timestamp',
                    fields: ['actionType', 'timestamp'],
                },
                {
                    name: 'idx_modlog_content_item',
                    fields: ['entityModel', 'contentItemId'],
                }
            ],
            hooks: {
                beforeValidate: (log, options) => {
                    if (log.revertedAt && !log.revertReason) {
                        throw new Error('A reverted moderation log must supply a revertReason');
                    }
                    if (log.detectedByAI && log.aiConfidenceScore === null) {
                        // Provide a default or require it implicitly
                        log.aiConfidenceScore = 0.5;
                    }
                },
                afterCreate: (log, options) => {
                    // If this is a high-severity ban, an external email worker could be notified
                }
            }
        }
    );

    return ModeratorAuditLog;
}

module.exports = {
    ModeratorAuditLog,
    initModeratorAuditLog
};
