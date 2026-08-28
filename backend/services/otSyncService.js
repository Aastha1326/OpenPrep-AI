const redisService = require('./redisService');
const { Note } = require('../models');
const logger = require('../utils/logger');

// Local in-memory document state cache
const localDocuments = new Map(); // noteId -> { content, revision, history: [], dirty: boolean }

/**
 * Loads a note document's active state from Redis or DB.
 */
async function loadDocument(noteId) {
  const redisKey = `ot:note:${noteId}`;

  if (redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.get(redisKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      logger.warn('Failed to load OT document from Redis', { noteId, error: err.message });
    }
  }

  let doc = localDocuments.get(noteId);
  if (!doc) {
    const note = await Note.findByPk(noteId);
    doc = {
      content: note ? (note.content || '') : '',
      revision: 0,
      history: [],
      dirty: false,
    };
    localDocuments.set(noteId, doc);
  }
  return doc;
}

/**
 * Saves a document's active state.
 */
async function saveDocument(noteId, doc) {
  localDocuments.set(noteId, doc);

  const redisKey = `ot:note:${noteId}`;
  if (redisService.isReady && redisService.client) {
    try {
      await redisService.client.set(redisKey, JSON.stringify(doc), 'EX', 86400); // 24h cache
    } catch (err) {
      logger.warn('Failed to save OT document to Redis', { noteId, error: err.message });
    }
  }
}

/**
 * Simple Operational Transformation (OT) transformation algorithm.
 * Transforms incoming operations against concurrent operations in the history buffer.
 */
function transform(op, concurrentOp) {
  const transformed = [];
  let i = 0, j = 0;

  // Clone operations to avoid side effects
  const o1 = JSON.parse(JSON.stringify(op));
  const o2 = JSON.parse(JSON.stringify(concurrentOp));

  while (i < o1.length && j < o2.length) {
    const act1 = o1[i];
    const act2 = o2[j];

    if (act1.insert !== undefined) {
      transformed.push({ insert: act1.insert });
      i++;
    } else if (act2.insert !== undefined) {
      transformed.push({ retain: act2.insert.length });
      j++;
    } else if (act1.retain !== undefined && act2.retain !== undefined) {
      const min = Math.min(act1.retain, act2.retain);
      transformed.push({ retain: min });
      act1.retain -= min;
      act2.retain -= min;
      if (act1.retain === 0) i++;
      if (act2.retain === 0) j++;
    } else if (act1.delete !== undefined && act2.delete !== undefined) {
      const min = Math.min(act1.delete, act2.delete);
      act1.delete -= min;
      act2.delete -= min;
      if (act1.delete === 0) i++;
      if (act2.delete === 0) j++;
    } else if (act1.delete !== undefined && act2.retain !== undefined) {
      const min = Math.min(act1.delete, act2.retain);
      transformed.push({ delete: min });
      act1.delete -= min;
      act2.retain -= min;
      if (act1.delete === 0) i++;
      if (act2.retain === 0) j++;
    } else if (act1.retain !== undefined && act2.delete !== undefined) {
      const min = Math.min(act1.retain, act2.delete);
      act1.retain -= min;
      act2.delete -= min;
      if (act1.retain === 0) i++;
      if (act2.delete === 0) j++;
    }
  }

  // Push remaining elements
  while (i < o1.length) {
    transformed.push(o1[i++]);
  }

  return transformed;
}

/**
 * Applies an operation to a document string.
 */
function applyOpToString(str, op) {
  let output = '';
  let index = 0;

  for (const act of op) {
    if (act.retain !== undefined) {
      output += str.substring(index, index + act.retain);
      index += act.retain;
    } else if (act.insert !== undefined) {
      output += act.insert;
    } else if (act.delete !== undefined) {
      index += act.delete;
    }
  }

  // Append remaining text
  if (index < str.length) {
    output += str.substring(index);
  }

  return output;
}

/**
 * Process client edit operations via OT transformation.
 */
async function processEdit(noteId, clientRevision, clientOp, clientSocketId) {
  const doc = await loadDocument(noteId);

  let transformedOp = clientOp;
  const currentRevision = doc.revision;

  // 1. Transform if client is operating on an older revision
  if (clientRevision < currentRevision) {
    logger.info(`[OTService] Client revision outdated: ${clientRevision} vs server: ${currentRevision}. Transforming...`);
    const concurrentOps = doc.history.slice(clientRevision);
    for (const historic of concurrentOps) {
      if (historic.clientSocketId !== clientSocketId) {
        transformedOp = transform(transformedOp, historic.op);
      }
    }
  }

  // 2. Apply transformed operation
  const updatedContent = applyOpToString(doc.content, transformedOp);

  // 3. Update doc context
  doc.content = updatedContent;
  doc.revision += 1;
  doc.history.push({
    revision: doc.revision,
    op: transformedOp,
    clientSocketId,
  });
  doc.dirty = true;

  await saveDocument(noteId, doc);

  return {
    revision: doc.revision,
    op: transformedOp,
    content: updatedContent,
  };
}

/**
 * Periodic database reconciliation loop flushing dirty document edits to PostgreSQL.
 */
async function runReconciliationLoop() {
  const dirtyItems = [];

  // Identify dirty local items
  for (const [noteId, doc] of localDocuments.entries()) {
    if (doc.dirty) {
      dirtyItems.push({ noteId, content: doc.content });
      doc.dirty = false;
    }
  }

  // Identify Redis dirty items (optional for scaled multi-instance, but local flush handles updates)
  if (dirtyItems.length === 0) return;

  logger.info(`[OTSync] Reconciling ${dirtyItems.length} dirty documents to database...`);
  for (const item of dirtyItems) {
    try {
      await Note.update(
        { content: item.content },
        { where: { id: item.noteId } }
      );
    } catch (err) {
      logger.error(`[OTSync] Failed to reconcile note ID: ${item.noteId}`, { error: err.message });
      // Restore dirty flag if write failed
      const doc = localDocuments.get(item.noteId);
      if (doc) doc.dirty = true;
    }
  }
}

let reconciliationIntervalId = null;

function startReconciliationScheduler() {
  if (reconciliationIntervalId) return;
  reconciliationIntervalId = setInterval(runReconciliationLoop, 5000);
  logger.info('⏰ OT Document Sync Reconciliation scheduler (5s interval) started.');
}

function stopReconciliationScheduler() {
  if (reconciliationIntervalId) {
    clearInterval(reconciliationIntervalId);
    reconciliationIntervalId = null;
  }
}

module.exports = {
  processEdit,
  transform,
  applyOpToString,
  startReconciliationScheduler,
  stopReconciliationScheduler,
  runReconciliationLoop,
  localDocuments,
};
