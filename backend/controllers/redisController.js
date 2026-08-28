const redisSentinelService = require('../services/redisSentinelService');
const logger = require('../utils/logger');

// @desc    Get Redis replication status and Sentinel metadata
// @route   GET /api/admin/redis/status
// @access  Private/Admin
exports.getRedisStatus = async (req, res, next) => {
  const client = redisSentinelService.client;

  if (!redisSentinelService.isReady || !client) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'DISCONNECTED',
        isSentinel: false,
        latencyMs: null,
        message: 'Redis connection is offline or uninitialized.',
      },
    });
  }

  try {
    const start = Date.now();
    await client.ping();
    const latencyMs = Date.now() - start;

    const data = {
      status: 'CONNECTED',
      isSentinel: redisSentinelService.isSentinel,
      latencyMs,
      masters: [],
      slaves: [],
      sentinelNodes: [],
    };

    if (redisSentinelService.isSentinel) {
      try {
        const masterName = process.env.REDIS_SENTINEL_NAME || 'mymaster';

        // Fetch Sentinel masters info
        const masters = await client.sentinel('masters');
        data.masters = Array.isArray(masters) ? masters.map(m => ({
          name: m[1],
          ip: m[3],
          port: Number(m[5]),
          status: m[9], // e.g. ok
          numSlaves: Number(m[31]),
        })) : [];

        // Fetch Sentinel slaves info
        const slaves = await client.sentinel('slaves', masterName);
        data.slaves = Array.isArray(slaves) ? slaves.map(s => ({
          ip: s[3],
          port: Number(s[5]),
          flags: s[9],
          masterLinkStatus: s[11],
          lag: Number(s[35] || 0), // replication offset lag
        })) : [];

        // Fetch Sentinels list
        const sentinels = await client.sentinel('sentinels', masterName);
        data.sentinelNodes = Array.isArray(sentinels) ? sentinels.map(sn => ({
          ip: sn[3],
          port: Number(sn[5]),
          flags: sn[9],
        })) : [];

      } catch (sentinelErr) {
        logger.warn('Failed to query Sentinel stats commands, parsing raw Redis INFO instead', { error: sentinelErr.message });
      }
    }

    // Always append basic replication info from raw Redis
    try {
      const infoStr = await client.info('replication');
      const replicationInfo = {};
      infoStr.split('\r\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length === 2) {
          replicationInfo[parts[0]] = parts[1];
        }
      });
      data.role = replicationInfo.role || 'master';
      data.connectedSlaves = Number(replicationInfo.connected_slaves || 0);
    } catch (infoErr) {
      logger.warn('Failed to query Redis INFO stats', { error: infoErr.message });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (err) {
    logger.error('Failed to benchmark Redis connection status', { error: err.message });
    next(err);
  }
};
