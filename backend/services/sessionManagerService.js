const Redis = require('ioredis');

// Connect to Redis for fast session lookup and caching
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

class SessionManagerService {
  /**
   * Tracks and registers a new device session with security auditing checks.
   */
  static async registerSession(userId, sessionMetadata, dbClient) {
    const { sessionId, tokenJti, ip, os, browser, country, latitude, longitude } = sessionMetadata;
    const now = new Date();

    // --- SUSPICIOUS LOGIN ANOMALY DETECTOR ---
    // Fetch user's immediate prior active session state to evaluate velocity parameters
    const priorSession = await dbClient.query(
      `SELECT country, latitude, longitude, last_active_at FROM user_sessions 
       WHERE user_id = $1 AND is_active = true ORDER BY last_active_at DESC LIMIT 1`,
      [userId]
    );

    if (priorSession.rows.length > 0) {
      const lastSession = priorSession.rows[0];
      
      // Impossible Travel Check: Logins from different countries within a tight window
      if (lastSession.country !== country) {
        const timeDeltaHours = Math.abs(now - new Date(lastSession.last_active_at)) / (1000 * 60 * 60);
        
        // If the location change happens faster than commercial airline speed (impossible travel velocity)
        if (timeDeltaHours < 3.0 && lastSession.latitude && latitude) {
          await this.triggerSecurityAlertEmail(userId, sessionMetadata, lastSession);
        }
      }
    }

    // Persist session parameters securely inside the relational database core
    await dbClient.query(
      `INSERT INTO user_sessions (id, jwt_jti, user_id, ip_address, os, browser, country, latitude, longitude, created_at, last_active_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`,
      [sessionId, tokenJti, userId, ip, os, browser, country, latitude, longitude, now, now]
    );

    // Cache active session markers inside Redis for fast middleware verification
    await redisClient.set(`session:active:${tokenJti}`, 'valid', 'EX', 60 * 60 * 24 * 7); // 7-day TTL matching JWT expiry
  }

  /**
   * Revokes a targeted session immediately via database updating and Redis blacklisting.
   */
  static async revokeSession(sessionId, dbClient) {
    const sessionRes = await dbClient.query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1 RETURNING jwt_jti',
      [sessionId]
    );

    if (sessionRes.rows.length > 0) {
      const tokenJti = sessionRes.rows[0].jwt_jti;
      // Atomic blacklisting: Evict tracking key directly from Redis cache layers
      await redisClient.del(`session:active:${tokenJti}`);
    }
  }

  /**
   * Terminates all active devices except the current active connection marker.
   */
  static async revokeOtherSessions(userId, currentSessionId, dbClient) {
    const sessionsRes = await dbClient.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND id != $2 AND is_active = true RETURNING jwt_jti',
      [userId, currentSessionId]
    );

    const pipe = redisClient.pipeline();
    sessionsRes.rows.forEach(row => {
      pipe.del(`session:active:${row.jwt_jti}`);
    });
    await pipe.exec();
  }

  static async triggerSecurityAlertEmail(userId, currentMeta, priorMeta) {
    console.warn(`🚨 SUSPICIOUS CONCURRENT LOGIN DETECTED FOR USER ${userId}!`);
    console.warn(`Concurrent access attempt flagged: Country shifted from ${priorMeta.country} to ${currentMeta.country} unexpectedly.`);
    // In production, integrate your email client transport script here (e.g., SendGrid, AWS SES)
  }
}

module.exports = SessionManagerService;
