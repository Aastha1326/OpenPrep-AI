const { SecurityAuditLog } = require('../models');
const crypto = require('crypto');

/**
 * Mask IP address for privacy compliance (GDPR/HIPAA).
 */
function maskIp(ip) {
  if (!ip) return '0.0.0.0';
  if (ip.includes(':')) {
    // IPv6
    return ip.split(':').slice(0, 3).join(':') + ':xxxx:xxxx';
  }
  // IPv4
  const parts = ip.split('.');
  if (parts.length < 4) return ip;
  return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
}

/**
 * Creates SHA-256 hash of the request body (excluding credential keys).
 */
function getPayloadHash(body) {
  if (!body || Object.keys(body).length === 0) return null;
  const cleanBody = { ...body };
  delete cleanBody.password;
  delete cleanBody.token;
  delete cleanBody.secret;
  return crypto.createHash('sha256').update(JSON.stringify(cleanBody)).digest('hex');
}

/**
 * Helper to record security events out-of-band to prevent thread locks.
 */
async function logSecurityEvent({ userId, eventType, severity, req, statusCode, metadata = {} }) {
  try {
    const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const ipAddress = maskIp(ip);
    const userAgent = req ? req.headers['user-agent'] : null;
    const payloadHash = req && req.body ? getPayloadHash(req.body) : null;

    // Simulate location mapping
    const geo = { country: 'United States', city: 'Ashburn' };
    if (ip && (ip.startsWith('127.0') || ip.startsWith('192.168') || ip === '::1')) {
      geo.country = 'Local';
      geo.city = 'Private Loopback';
    }

    await SecurityAuditLog.create({
      userId: userId || (req && req.user ? req.user.id : null),
      eventType,
      severity: severity || 'INFO',
      ipAddress,
      userAgent,
      payloadHash,
      statusCode: statusCode || (req && req.res ? req.res.statusCode : null),
      metadata: {
        ...metadata,
        geo,
      },
    });
  } catch (err) {
    console.error('[AuditLogMiddleware] Failed to write security event:', err.message);
  }
}

/**
 * Interceptor middleware routing response statuses into security logs.
 */
const auditInterceptor = (eventType, severity = 'INFO') => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      const statusCode = res.statusCode;

      let finalSeverity = severity;
      let finalEventType = eventType;

      if (eventType === 'user_login') {
        if (statusCode >= 400) {
          finalSeverity = 'WARNING';
          finalEventType = 'failed_login';
        } else {
          finalEventType = 'successful_login';
        }
      }

      logSecurityEvent({
        userId: req.user ? req.user.id : null,
        eventType: finalEventType,
        severity: finalSeverity,
        req,
        statusCode,
      });

      return originalSend.call(this, body);
    };
    next();
  };
};

module.exports = {
  logSecurityEvent,
  auditInterceptor,
  maskIp,
  getPayloadHash,
};
