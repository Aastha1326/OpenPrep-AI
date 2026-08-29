let redisService = null;
try {
  redisService = require('./redisService');
} catch (e) {}

const redisConfig = require('../config/redis');

let Note = null;
try {
  const models = require('../models');
  Note = models.Note;
} catch (e) {}

const logger = require('../utils/logger');

// Local in-memory document state cache
const localDocuments = new Map(); // noteId -> { content, revision, history: [], dirty: boolean }

function performTransform(opA, opB) {
  if (!opA || !opB) return opA || [];

  // Array-style delta operation transform (Quill/OT delta style)
  if (Array.isArray(opA) || Array.isArray(opB)) {
    return transformDelta(opA, opB);
  }

  const transformedA = { ...opA };
  const posA = opA.position !== undefined ? opA.position : 0;
  const posB = opB.position !== undefined ? opB.position : 0;

  if (opA.type === 'insert' && opB.type === 'insert') {
    if (posA < posB || (posA === posB && opA.userId < opB.userId)) {
      return { ...transformedA };
    } else {
      const textLen = (opB.text || '').length;
      return { ...transformedA, position: posA + textLen };
    }
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    const delLen = opB.length || 0;
    if (posA <= posB) return { ...transformedA };
    if (posA > posB + delLen) return { ...transformedA, position: posA - delLen };
    return { ...transformedA, position: posB };
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    const insLen = (opB.text || '').length;
    if (posA < posB) return { ...transformedA };
    return { ...transformedA, position: posA + insLen };
  }

  return transformedA;
}

class OTSyncService {
  constructor() {
    // Maps noteId -> Array of operations { userId, op, version }
    this.historyBuffers = new Map();
  }

  getHistory(noteId) {
    if (!this.historyBuffers.has(noteId)) {
      this.historyBuffers.set(noteId, []);
    }
    return this.historyBuffers.get(noteId);
  }

  transform(opA, opB) {
    return performTransform(opA, opB);
  }

  applyOperation(noteId, clientOp, clientVersion = 0) {
    const history = this.getHistory(noteId);
    let transformedOp = Array.isArray(clientOp) ? [...clientOp] : { ...clientOp };

    for (let i = clientVersion; i < history.length; i++) {
      const historicOp = history[i] ? history[i].op || history[i] : null;
      if (historicOp) {
        transformedOp = this.transform(transformedOp, historicOp);
      }
    }

    const record = { userId: clientOp.userId, op: transformedOp, version: history.length + 1 };
    history.push(record);
    return { transformedOp, newVersion: history.length };
  }

  async processEdit(noteId, clientRevision, clientOp, clientSocketId) {
    return processEdit(noteId, clientRevision, clientOp, clientSocketId);
  }
}

const instance = new OTSyncService();

/**
 * Loads a note document's active state from Redis or DB.
 */
async function loadDocument(noteId) {
  const redisKey = `ot:note:${noteId}`;

  if (redisService && redisService.isReady && redisService.client) {
    try {
      const data = await redisService.client.get(redisKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      if (logger && logger.warn) logger.warn('Failed to load OT document from Redis', { noteId, error: err.message });
    }
  }

  let doc = localDocuments.get(noteId);
  if (!doc) {
    let note = null;
    try {
      if (Note && typeof Note.findByPk === 'function') {
        note = await Note.findByPk(noteId);
      }
    } catch (e) {}

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
  if (redisService && redisService.isReady && redisService.client) {
    try {
      await redisService.client.set(redisKey, JSON.stringify(doc), 'EX', 86400);
    } catch (err) {
      if (logger && logger.warn) logger.warn('Failed to save OT document to Redis', { noteId, error: err.message });
    }
  }
}

/**
 * Delta-style transform implementation.
 */
function transformDelta(op, concurrentOp) {
  const transformed = [];
  let i = 0, j = 0;

  const o1 = JSON.parse(JSON.stringify(op || []));
  const o2 = JSON.parse(JSON.stringify(concurrentOp || []));

  while (i < o1.length && j < o2.length) {
    const act1 = o1[i];
    const act2 = o2[j];

    if (act1.insert !== undefined) {
      transformed.push({ insert: act1.insert });
      i++;
    } else if (act2.insert !== undefined) {
      transformed.push({ retain: typeof act2.insert === 'string' ? act2.insert.length : 1 });
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

  while (i < o1.length) {
    transformed.push(o1[i++]);
  }

  return transformed;
}

function transform(opA, opB) {
  return performTransform(opA, opB);
}

/**
 * Applies an operation to a document string.
 */
function applyOpToString(str, op) {
  let output = '';
  let index = 0;

  if (Array.isArray(op)) {
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
    if (index < str.length) {
      output += str.substring(index);
    }
    return output;
  }

  const pos = op.position !== undefined ? op.position : 0;
  if (op.type === 'insert') {
    return str.slice(0, pos) + (op.text || '') + str.slice(pos);
  } else if (op.type === 'delete') {
    const len = op.length !== undefined ? op.length : 1;
    return str.slice(0, pos) + str.slice(pos + len);
  }

  return str;
}

async function processEdit(noteId, clientRevision, clientOp, clientSocketId) {
  const doc = await loadDocument(noteId);

  let transformedOp = clientOp;
  const currentRevision = doc.revision;

  if (clientRevision < currentRevision) {
    if (logger && logger.info) logger.info(`[OTService] Client revision outdated: ${clientRevision} vs server: ${currentRevision}. Transforming...`);
    const concurrentOps = doc.history.slice(clientRevision);
    for (const historic of concurrentOps) {
      if (historic.clientSocketId !== clientSocketId) {
        transformedOp = transform(transformedOp, historic.op);
      }
    }
  }

  const updatedContent = applyOpToString(doc.content, transformedOp);

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

async function runReconciliationLoop() {
  const dirtyItems = [];

  for (const [noteId, doc] of localDocuments.entries()) {
    if (doc.dirty) {
      dirtyItems.push({ noteId, content: doc.content });
      doc.dirty = false;
    }
  }

  if (dirtyItems.length === 0) return;

  if (logger && logger.info) logger.info(`[OTSync] Reconciling ${dirtyItems.length} dirty documents to database...`);
  for (const item of dirtyItems) {
    try {
      if (Note && typeof Note.update === 'function') {
        await Note.update({ content: item.content }, { where: { id: item.noteId } });
      }
    } catch (err) {
      if (logger && logger.error) logger.error(`[OTSync] Failed to reconcile note ID: ${item.noteId}`, { error: err.message });
      const doc = localDocuments.get(item.noteId);
      if (doc) doc.dirty = true;
    }
  }
}

let reconciliationIntervalId = null;

function startReconciliationScheduler() {
  if (reconciliationIntervalId) return;
  reconciliationIntervalId = setInterval(runReconciliationLoop, 5000);
  if (logger && logger.info) logger.info('⏰ OT Document Sync Reconciliation scheduler (5s interval) started.');
}

function stopReconciliationScheduler() {
  if (reconciliationIntervalId) {
    clearInterval(reconciliationIntervalId);
    reconciliationIntervalId = null;
  }
}

// Bind methods onto singleton instance
instance.processEdit = processEdit;
instance.loadDocument = loadDocument;
instance.saveDocument = saveDocument;
instance.applyOpToString = applyOpToString;
instance.runReconciliationLoop = runReconciliationLoop;
instance.startReconciliationScheduler = startReconciliationScheduler;
instance.stopReconciliationScheduler = stopReconciliationScheduler;
instance.localDocuments = localDocuments;

module.exports = instance;
module.exports.OTSyncService = OTSyncService;
module.exports.processEdit = processEdit;
module.exports.transform = transform;
module.exports.applyOpToString = applyOpToString;
module.exports.startReconciliationScheduler = startReconciliationScheduler;
module.exports.stopReconciliationScheduler = stopReconciliationScheduler;
module.exports.runReconciliationLoop = runReconciliationLoop;
module.exports.localDocuments = localDocuments;
