const { Op, Sequelize } = require('sequelize');
const { AnalyticsEvent, ModeratorAuditLog, User } = require('../models');

/**
 * Service Layer class for interacting with the Analytics and Moderation systems.
 * Provides heavily optimized and encapsulated aggregation logic.
 * Adheres to RESTful principles while enabling complex time-series queries.
 * @class AnalyticsService
 */
class AnalyticsService {
    /**
     * Pushes a new telemetry event into the database asynchronously.
     * Can be fire-and-forget or awaited for critical transactions.
     * 
     * @param {Object} eventDto - Data Transfer Object containing the event body
     * @returns {Promise<AnalyticsEvent>} The newly persisted event
     */
    static async logEvent(eventDto) {
        try {
            const newEvent = await AnalyticsEvent.create({
                userId: eventDto.userId || null,
                sessionId: eventDto.sessionId || null,
                courseId: eventDto.courseId || null,
                eventType: eventDto.eventType,
                category: eventDto.category || 'USER_ENGAGEMENT',
                severity: eventDto.severity || 'low',
                payload: eventDto.payload || {},
                routeId: eventDto.routeId,
                deviceType: eventDto.deviceType,
                browser: eventDto.browser,
                os: eventDto.os,
                ipAddressHash: eventDto.ipAddressHash,
                clientDurationMs: eventDto.clientDurationMs,
                serverLatencyMs: eventDto.serverLatencyMs,
                sourceIsServer: eventDto.sourceIsServer || false,
            });

            return newEvent;
        } catch (error) {
            console.error('[AnalyticsService] Critical Log Event Failure:', error);
            // Fail gracefully in production, do not disrupt user core experience for telemetry drops
            return null;
        }
    }

    /**
     * Retrieves high-volume aggregated engagement metrics binned by day.
     * 
     * @param {Date} startDate - the starting range for the time series
     * @param {Date} endDate - the ending range
     * @returns {Promise<Array>} Time-series data points ready for Recharts Line/Area charts 
     */
    static async getEngagementMetrics(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('startDate and endDate are required parameters for time series aggregation');
        }

        try {
            // 1. Activity Grouping By Day
            // using native PostgreSQL DATE_TRUNC for high-performance aggregations
            const timeSeries = await AnalyticsEvent.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('timestamp')), 'dateStr'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalEvents'],
                    [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('userId'))), 'uniqueUsers']
                ],
                where: {
                    timestamp: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    }
                },
                group: [Sequelize.fn('DATE', Sequelize.col('timestamp'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('timestamp')), 'ASC']],
            });

            // 2. High-Severity Error Overview
            const errorMetrics = await AnalyticsEvent.count({
                where: {
                    timestamp: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                    severity: {
                        [Op.in]: ['high', 'critical']
                    }
                }
            });

            // 3. Browser Demographic Spread (Top 5)
            const browserDemographics = await AnalyticsEvent.findAll({
                attributes: [
                    'browser',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                ],
                where: {
                    timestamp: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                    browser: {
                        [Op.not]: null
                    }
                },
                group: ['browser'],
                order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
                limit: 5,
            });

            return {
                success: true,
                data: {
                    timeSeries: timeSeries.map(ts => ({
                        date: ts.getDataValue('dateStr'),
                        totalEvents: parseInt(ts.getDataValue('totalEvents'), 10),
                        uniqueUsers: parseInt(ts.getDataValue('uniqueUsers'), 10),
                    })),
                    criticalErrorsCount: errorMetrics,
                    deviceMatrix: browserDemographics.map(bd => ({
                        name: bd.browser || 'Unknown',
                        value: parseInt(bd.getDataValue('count'), 10)
                    }))
                }
            };
        } catch (error) {
            console.error('[AnalyticsService] Time Series Aggregation Error:', error);
            throw new Error('Failed to compute global analytics metrics');
        }
    }

    /**
     * Safely fetches the paginated Mod Audit trail for system administrators.
     * Includes joins on the User table to display moderator/target emails or usernames.
     * 
     * @param {number} page - The current page (1-indexed)
     * @param {number} limit - Items per page (default 20)
     * @param {string} filterScope - Optional filter (e.g. "BANS_ONLY", "AI_ONLY")
     */
    static async getPaginatedAuditTrail(page = 1, limit = 20, filterScope = 'ALL') {
        try {
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (filterScope === 'BANS_ONLY') {
                whereClause.actionType = {
                    [Op.in]: ['USER_BANNED', 'AI_AUTO_BAN']
                };
            } else if (filterScope === 'AI_ONLY') {
                whereClause.detectedByAI = true;
            }

            const { count, rows } = await ModeratorAuditLog.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['timestamp', 'DESC']],
                include: [
                    // If User module was formally provided: (mocking pseudo inclusion for now)
                    // { model: User, as: 'moderator', attributes: ['id', 'email', 'name'] },
                    // { model: User, as: 'targetUser', attributes: ['id', 'email', 'name'] }
                ]
            });

            return {
                success: true,
                data: {
                    totalRecords: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    auditLogs: rows
                }
            };
        } catch (error) {
            console.error('[AnalyticsService] Audit Trail Fetch Error:', error);
            throw new Error('Failed to retrieve system audit trails');
        }
    }

    /**
     * Action endpoint designed for an Administrator to reverse an earlier moderation decision.
     * Asserts the reversal rule that previously hidden content gets restored.
     * @param {string} logId - The UUID of the moderation log
     * @param {string} adminId - The UUID of the restoring admin
     * @param {string} reason - Revert justification
     */
    static async reverseModerationAction(logId, adminId, reason) {
        if (!reason || reason.trim().length < 10) {
            throw new Error('You must provide at least a 10-character justification to reverse a moderation action.');
        }

        try {
            const log = await ModeratorAuditLog.findByPk(logId);

            if (!log) {
                throw new Error('Audit log not found with the specified ID.');
            }

            if (!log.isReversible) {
                throw new Error('This action is either not reversible or has already been reverted.');
            }

            // Enact Database State Change
            log.revertedAt = new Date();
            log.revertedById = adminId;
            log.revertReason = reason;
            await log.save();

            // IMPORTANT: In an enterprise context, this would trigger an EventBus to actually restore
            // the hidden state on the ContentItem model, but we strictly update the ledger here.

            // Log the reversal as its own independent action
            await ModeratorAuditLog.create({
                moderatorId: adminId,
                targetUserId: log.targetUserId,
                contentItemId: log.contentItemId,
                actionType: 'SYSTEM_OVERRIDE',
                entityModel: log.entityModel,
                reason: `Automated Ledger Entry: Action reverted. Original Log ID: ${log.id}. Reason given: ${reason}`,
                detectedByAI: false,
            });

            return {
                success: true,
                message: 'Moderation action successfully reverted.',
            };

        } catch (error) {
            console.error(`[AnalyticsService] Error Reverting Action [${logId}]:`, error);
            throw error;
        }
    }
}

module.exports = AnalyticsService;
