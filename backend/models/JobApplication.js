const { Model, DataTypes } = require('sequelize');

/**
 * JobApplication Model
 * 
 * Represents a student's personal relationship bridging to a JobOpportunity.
 * Acts as the node within the Kanban board system, containing state arrays
 * timeline data, and dynamic sequence IDs for visual drag-and-drop.
 * 
 * @class JobApplication
 * @extends Model
 */
class JobApplication extends Model {
    /**
     * Helper method for defining associations.
     * @static
     */
    static associate(models) {
        if (models.User) {
            JobApplication.belongsTo(models.User, {
                foreignKey: 'studentUserId',
                as: 'student',
                onDelete: 'CASCADE',
            });
        }

        if (models.JobOpportunity) {
            JobApplication.belongsTo(models.JobOpportunity, {
                foreignKey: 'jobOpportunityId',
                as: 'opportunity',
            });
        }

        if (models.Resume) {
            // The specific resume version they used to apply
            JobApplication.belongsTo(models.Resume, {
                foreignKey: 'resumeId',
                as: 'submittedResume',
            });
        }

        if (models.CoverLetter) {
            JobApplication.belongsTo(models.CoverLetter, {
                foreignKey: 'coverLetterId',
                as: 'submittedCoverLetter',
            });
        }
    }

    /**
     * Helper to append a timeline tracking event transparently
     */
    async appendTimelineEvent(eventType, metadata = {}) {
        this.timelineEvents = [
            ...this.timelineEvents,
            {
                id: crypto.randomUUID(), // Assuming Node 15+ Crypto API available natively in execution environment
                type: eventType,
                timestamp: new Date().toISOString(),
                metadata
            }
        ];
        await this.save();
    }
}

/**
 * Schema Initialization
 */
function initJobApplication(sequelize) {
    JobApplication.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            studentUserId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            jobOpportunityId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            resumeId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            coverLetterId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            statusPhase: {
                type: DataTypes.ENUM(
                    'WISHLIST',
                    'PREPARING',
                    'APPLIED',
                    'ONLINE_ASSESSMENT',
                    'INTERVIEWING',
                    'OFFER_RECEIVED',
                    'ACCEPTED',
                    'REJECTED',
                    'WITHDRAWN'
                ),
                allowNull: false,
                defaultValue: 'WISHLIST',
                comment: 'Kanban Column Identifier',
            },
            kanbanSequence: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
                comment: 'Floating point lexical order index for resolving positional permutations during drag and drop',
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Private markdown notes written by the student',
            },
            salaryExpectation: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            matchConfidenceScore: {
                type: DataTypes.FLOAT, // Personal match score specifically for this exact student
                allowNull: true,
            },
            timelineEvents: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
                comment: 'Array of state transitions e.g. [{type: "STATUS_CHANGE", from: "WISHLIST", to: "APPLIED", timestamp: "..."}]',
            },
            customCompanyContactName: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            customCompanyContactEmail: {
                type: DataTypes.STRING(255),
                allowNull: true,
                validate: { isEmail: true }
            },
            dateApplied: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            dateNextInterview: {
                type: DataTypes.DATE,
                allowNull: true,
            }
        },
        {
            sequelize,
            modelName: 'JobApplication',
            tableName: 'student_job_applications',
            timestamps: true,
            indexes: [
                {
                    name: 'idx_job_app_student',
                    fields: ['studentUserId'],
                },
                {
                    name: 'idx_job_app_status',
                    fields: ['statusPhase'],
                },
                {
                    name: 'idx_job_app_student_sequence', // Critical for optimized kanban load queries
                    fields: ['studentUserId', 'statusPhase', 'kanbanSequence'],
                }
            ],
            hooks: {
                beforeUpdate: (app, options) => {
                    // If the status phase changed, enforce recording the transition on the timeline JSONB list automatically
                    if (app.changed('statusPhase')) {
                        const history = app.timelineEvents || [];
                        const previousStatus = app.previous('statusPhase');
                        const newStatus = app.getDataValue('statusPhase');

                        history.push({
                            id: require('crypto').randomUUID ? require('crypto').randomUUID() : Math.random().toString(),
                            type: 'STATUS_SYSTEM_TRANSITION',
                            timestamp: new Date().toISOString(),
                            metadata: {
                                from: previousStatus,
                                to: newStatus
                            }
                        });

                        app.timelineEvents = history;

                        if (newStatus === 'APPLIED' && !app.dateApplied) {
                            app.dateApplied = new Date();
                        }
                    }
                }
            }
        }
    );

    return JobApplication;
}

module.exports = {
    JobApplication,
    initJobApplication
};
