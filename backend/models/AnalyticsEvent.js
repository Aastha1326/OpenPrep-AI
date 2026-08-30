const { Model, DataTypes } = require('sequelize');

/**
 * AnalyticsEvent Model
 * 
 * Represents a high-velocity telemetry event within the OpenPrep AI ecosystem.
 * This model captures user interactions, AI completions, quiz performances,
 * and system health metrics to feed into the Enterprise Studio Analytics Hub.
 * Designed to handle large volumes of data with partitioned tables (in production).
 * 
 * @class AnalyticsEvent
 * @extends Model
 */
class AnalyticsEvent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * 
     * @static
     * @param {Object} models - The models object injected by Sequelize
     */
    static associate(models) {
        if (models.User) {
            AnalyticsEvent.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'SET NULL',
            });
        }

        if (models.Session) {
            AnalyticsEvent.belongsTo(models.Session, {
                foreignKey: 'sessionId',
                as: 'session',
                onDelete: 'CASCADE',
            });
        }

        if (models.Course) {
            AnalyticsEvent.belongsTo(models.Course, {
                foreignKey: 'courseId',
                as: 'course',
            });
        }
    }

    /**
     * Custom query scope to get events filtered by a generic action type.
     */
    static get scopes() {
        return {
            highSeverity: {
                where: { severity: 'high' }
            },
            recent: {
                where: {
                    timestamp: {
                        // Placeholder: Sequelize.Op will be available in actual queries
                    }
                }
            },
            aiInteractions: {
                where: {
                    category: 'AI_INTERACTION'
                }
            }
        };
    }
}

/**
 * Enterprise Database Schema Definition
 * Strict column typings, indexing strategies, and default values.
 */
function initAnalyticsEvent(sequelize) {
    AnalyticsEvent.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                comment: 'Primary globally unique identifier for the analytics event',
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Optional user association, null for anonymous telemetry',
            },
            sessionId: {
                type: DataTypes.STRING(128),
                allowNull: true,
                comment: 'Session identifier linking events across a user visit',
            },
            courseId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Course or module contextual ID to scope the event',
            },
            eventType: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [3, 100],
                },
                comment: 'Specific granular event (e.g., QUIZ_SUBMITTED, AI_PROMPT_SENT)',
            },
            category: {
                type: DataTypes.ENUM(
                    'USER_ENGAGEMENT',
                    'AI_INTERACTION',
                    'SYSTEM_PERFORMANCE',
                    'COURSE_COMPLETION',
                    'PAYMENT_TRANSACTION',
                    'SECURITY_ALERT',
                    'MODERATION_ACTION'
                ),
                allowNull: false,
                defaultValue: 'USER_ENGAGEMENT',
                comment: 'High-level architectural bucket for the event',
            },
            severity: {
                type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
                allowNull: false,
                defaultValue: 'low',
                comment: 'Impact scale of the event, usually for errors and alerts',
            },
            payload: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
                validate: {
                    isValidPayload(value) {
                        if (typeof value !== 'object') {
                            throw new Error('Payload must be a valid JSON object');
                        }
                    },
                },
                comment: 'Flexible structured metadata relevant to the specific event',
            },
            routeId: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Frontend route or backend path where the event occurred',
            },
            deviceType: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: 'UNKNOWN',
                comment: 'Client device category: MOBILE, TABLET, DESKTOP',
            },
            browser: {
                type: DataTypes.STRING(100),
                allowNull: true,
                comment: 'Parsed browser string (e.g., Chrome 116.0)',
            },
            os: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: 'Operating System of the client (e.g., Windows 10)',
            },
            ipAddressHash: {
                type: DataTypes.STRING(256),
                allowNull: true,
                comment: 'Hashed IP address for demographic/geo-loc inference while preserving PII compliance',
            },
            clientDurationMs: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 0,
                },
                comment: 'Time required for the respective client-side operation if applicable',
            },
            serverLatencyMs: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Time required for the backend resolution associated with the event',
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Exact canonical timestamp of when the event originally occurred',
            },
            sourceIsServer: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Whether this event was generated exclusively backend-side',
            },
            version: {
                type: DataTypes.STRING(20),
                allowNull: true,
                defaultValue: '1.0.0',
                comment: 'App/Schema version in case payload structures change over time',
            }
        },
        {
            sequelize,
            modelName: 'AnalyticsEvent',
            tableName: 'analytics_events',
            timestamps: true,
            updatedAt: false, // Analytics are append-only; updates shouldn't alter the record conceptually
            indexes: [
                {
                    name: 'idx_analytics_user_session',
                    fields: ['userId', 'sessionId'],
                },
                {
                    name: 'idx_analytics_event_type',
                    fields: ['eventType'],
                },
                {
                    name: 'idx_analytics_category_timestamp',
                    fields: ['category', 'timestamp'],
                },
                {
                    name: 'idx_analytics_payload_gin',
                    fields: ['payload'],
                    using: 'GIN',
                }
            ],
            hooks: {
                beforeCreate: (event, options) => {
                    // Normalize strings to upper case for standardization
                    if (event.eventType) {
                        event.eventType = event.eventType.toUpperCase();
                    }
                    if (event.deviceType) {
                        event.deviceType = event.deviceType.toUpperCase();
                    }
                    // Validate payload size (e.g., prevent massive logs from killing DB performance)
                    const payloadStr = JSON.stringify(event.payload || {});
                    if (payloadStr.length > 50000) {
                        throw new Error('Analytics payload exceeds maximum permitted size (50KB)');
                    }
                },
                afterCreate: (event, options) => {
                    // In an enterprise environment, we might dispatch an event to Kafka or an SQS queue here
                    // e.g., EventBus.emit('ANALYTICS_CREATED', event);
                }
            }
        }
    );

    return AnalyticsEvent;
}

module.exports = {
    AnalyticsEvent,
    initAnalyticsEvent
};
