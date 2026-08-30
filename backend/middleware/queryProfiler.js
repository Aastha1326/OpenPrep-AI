/**
 * @fileoverview Database query profiler middleware/hook for detecting and logging slow queries (>100ms).
 */
const logger = require('../utils/logger');

/**
 * Registers the slow query profiler on the Sequelize instance.
 * @param {Object} sequelize - Sequelize instance
 */
const registerQueryProfiler = (sequelize) => {
  sequelize.addHook('beforeQuery', (options) => {
    options.profilerStartTime = Date.now();
  });

  sequelize.addHook('afterQuery', async (options) => {
    if (options.profilerStartTime) {
      const duration = Date.now() - options.profilerStartTime;

      if (duration > 100) {
        let explainPlan = '';

        // Execute EXPLAIN only in development environment to avoid overhead in production
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          try {
            // Explain select queries to confirm index usage
            if (options.query.trim().toUpperCase().startsWith('SELECT')) {
              const explainQuery = `EXPLAIN ${options.query}`;
              const [results] = await sequelize.query(explainQuery, {
                bind: options.bind,
                type: sequelize.QueryTypes.SELECT,
                logging: false,
              });
              explainPlan = results.map(row => row['QUERY PLAN']).join('\n');
            }
          } catch (explainErr) {
            explainPlan = `Could not generate explain plan: ${explainErr.message}`;
          }
        }

        logger.warn(`[SLOW QUERY DETECTED] Database query execution exceeded threshold of 100ms:`, {
          query: options.query,
          durationMs: duration,
          bind: options.bind || 'none',
          explainPlan: explainPlan || 'No execution plan generated',
        });
      }
    }
  });

  console.log('[QueryProfiler] Database query profiling & slow query logger initialized successfully.');
};

module.exports = {
  registerQueryProfiler,
};
