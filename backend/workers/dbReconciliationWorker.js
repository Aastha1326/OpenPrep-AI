let cron = null;
try {
  cron = require('node-cron');
} catch (e) {}

const redis = require('../config/redis');

let redisService = null;
try {
  redisService = require('../services/redisService');
} catch (e) {}

const otSyncService = require('../services/otSyncService');

let Note = null;
try {
  const models = require('../models');
  Note = models.Note;
} catch (e) {}

const logger = require('../utils/logger');

async function getKeys(pattern) {
  if (redisService && redisService.isReady && redisService.client && typeof redisService.client.keys === 'function') {
    try {
      return await redisService.client.keys(pattern);
    } catch (e) {}
  }
  if (typeof redis.keys === 'function') {
    try {
      return await redis.keys(pattern);
    } catch (e) {}
  }
  return [];
}

async function getValue(key) {
  if (redisService && redisService.isReady && redisService.client && typeof redisService.client.get === 'function') {
    try {
      return await redisService.client.get(key);
    } catch (e) {}
  }
  if (typeof redis.get === 'function') {
    try {
      return await redis.get(key);
    } catch (e) {}
  }
  if (typeof redis.getCache === 'function') {
    try {
      return await redis.getCache(key);
    } catch (e) {}
  }
  return null;
}

/**
 * Scans volatile note content keys in Redis and flushes updated documents down to PostgreSQL.
 */
async function reconcileNotes() {
  try {
    const keys = (await getKeys('note:*:content')) || [];
    const otKeys = (await getKeys('ot:note:*')) || [];
    const allKeys = Array.from(new Set([...keys, ...otKeys]));

    for (const key of allKeys) {
      let noteId = null;
      if (key.startsWith('note:') && key.endsWith(':content')) {
        noteId = key.split(':')[1];
      } else if (key.startsWith('ot:note:')) {
        noteId = key.replace('ot:note:', '');
      }

      if (!noteId) continue;

      const cachedRaw = await getValue(key);
      let cachedContent = cachedRaw;

      if (typeof cachedRaw === 'string' && cachedRaw.startsWith('{')) {
        try {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.content !== undefined) {
            cachedContent = parsed.content;
          }
        } catch (e) {}
      }

      if (cachedContent !== null && cachedContent !== undefined && Note && typeof Note.update === 'function') {
        await Note.update({ content: cachedContent }, { where: { id: noteId } });
      }
    }

    if (typeof otSyncService.runReconciliationLoop === 'function') {
      await otSyncService.runReconciliationLoop();
    }
  } catch (error) {
    if (logger && typeof logger.error === 'function') {
      logger.error('Error during Sequelize Note synchronization flush:', error);
    } else {
      console.error('Error during Sequelize Note synchronization flush:', error);
    }
  }
}

let cronTask = null;

function startWorker() {
  if (cronTask) return cronTask;
  if (cron && typeof cron.schedule === 'function') {
    cronTask = cron.schedule('*/5 * * * * *', async () => {
      await reconcileNotes();
    });
  } else {
    const intervalId = setInterval(async () => {
      await reconcileNotes();
    }, 5000);
    cronTask = { stop: () => clearInterval(intervalId) };
  }
  return cronTask;
}

function stopWorker() {
  if (cronTask) {
    if (typeof cronTask.stop === 'function') cronTask.stop();
    cronTask = null;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startWorker();
}

module.exports = {
  reconcileNotes,
  startWorker,
  stopWorker,
};
