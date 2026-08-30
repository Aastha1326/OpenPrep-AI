const { SecurityAuditLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Paginated, filterable query interface for security events.
 */
async function getSecurityLogs(req, res, next) {
  try {
    const { eventType, severity, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = {};

    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await SecurityAuditLog.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['timestamp', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        logs: rows,
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Exports compliance reports in CSV and JSON formats.
 */
async function exportSecurityLogs(req, res, next) {
  try {
    const { format = 'json', eventType, severity } = req.query;
    const where = {};

    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;

    const logs = await SecurityAuditLog.findAll({
      where,
      order: [['timestamp', 'DESC']],
    });

    if (format === 'csv') {
      let csv = 'ID,User ID,Event Type,Severity,IP Address,User Agent,Status Code,Timestamp\n';
      logs.forEach(log => {
        const uAgent = (log.userAgent || '').replace(/"/g, '""');
        csv += `"${log.id}","${log.userId || ''}","${log.eventType}","${log.severity}","${log.ipAddress || ''}","${uAgent}","${log.statusCode || ''}","${log.timestamp.toISOString()}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=security-audit-log.csv');
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Summary metrics of threats and rate-limited accesses.
 */
async function getThreatSummary(req, res, next) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedLogins = await SecurityAuditLog.count({
      where: {
        eventType: 'failed_login',
        timestamp: { [Op.gte]: oneDayAgo }
      }
    });

    const rateLimits = await SecurityAuditLog.findAll({
      attributes: [
        'ipAddress',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        eventType: 'rate_limit_breach',
        timestamp: { [Op.gte]: oneDayAgo }
      },
      group: ['ipAddress'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
    });

    // Mock geo-velocity anomaly alerts
    const geoAnomalies = [
      {
        userId: 'user-999',
        email: 'attacker@openprep.ai',
        message: 'Suspicious geo-velocity login detected between US (Ashburn) and DE (Frankfurt) within 10 minutes.'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        failedLoginSpikes: failedLogins,
        topRateLimitedIps: rateLimits.map(item => ({
          ipAddress: item.ipAddress,
          count: parseInt(item.getDataValue('count'), 10)
        })),
        geoVelocityAnomalies: geoAnomalies,
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSecurityLogs,
  exportSecurityLogs,
  getThreatSummary,
};
