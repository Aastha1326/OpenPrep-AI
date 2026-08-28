const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Invokes the Gemini API to construct a 768-dimension semantic vector embedding.
 */
async function generateVector(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values; // Returns array of 768 floats
  } catch (err) {
    logger.error('[EmbeddingsProcessor] Gemini embedding call failed:', err.message);
    throw err;
  }
}

/**
 * Enqueues out-of-band embedding generation to prevent request blocking.
 */
async function enqueueEmbeddingUpdate(modelInstance, text) {
  try {
    const queueService = require('./queueService');
    await queueService.enqueue('generate_embeddings', {
      modelName: modelInstance.constructor.name,
      recordId: modelInstance.id,
      text,
    });
    logger.info(`[EmbeddingsProcessor] Enqueued embedding job for ${modelInstance.constructor.name} ID: ${modelInstance.id}`);
  } catch (err) {
    logger.warn('[EmbeddingsProcessor] Failed to enqueue embedding job, executing synchronously:', err.message);
    try {
      const vector = await generateVector(text);
      modelInstance.embedding = vector;
      await modelInstance.save({ hooks: false });
    } catch (fallbackErr) {
      logger.error('[EmbeddingsProcessor] Synch fallback failed:', fallbackErr.message);
    }
  }
}

/**
 * Registers afterCreate and afterUpdate hooks on target models.
 */
function attachHooks(models) {
  const { Note, Quiz } = models;

  // Note Hooks
  Note.afterCreate(async (note) => {
    const text = `${note.title || ''} ${note.content || ''}`.trim();
    if (text) await enqueueEmbeddingUpdate(note, text);
  });

  Note.afterUpdate(async (note) => {
    if (note.changed('title') || note.changed('content')) {
      const text = `${note.title || ''} ${note.content || ''}`.trim();
      if (text) await enqueueEmbeddingUpdate(note, text);
    }
  });

  // Quiz Hooks
  Quiz.afterCreate(async (quiz) => {
    const questionText = (quiz.questions || []).map(q => q.questionText || '').join(' ');
    const text = `${quiz.title || ''} ${questionText}`.trim();
    if (text) await enqueueEmbeddingUpdate(quiz, text);
  });

  Quiz.afterUpdate(async (quiz) => {
    if (quiz.changed('title') || quiz.changed('questions')) {
      const questionText = (quiz.questions || []).map(q => q.questionText || '').join(' ');
      const text = `${quiz.title || ''} ${questionText}`.trim();
      if (text) await enqueueEmbeddingUpdate(quiz, text);
    }
  });
}

/**
 * Register worker queue handler to generate and save embeddings asynchronously.
 */
function registerWorkerHandler(models) {
  const queueService = require('./queueService');

  queueService.registerHandler('generate_embeddings', async (payload) => {
    const { modelName, recordId, text } = payload;
    const Model = models[modelName];

    if (!Model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const record = await Model.findByPk(recordId);
    if (!record) {
      logger.warn(`[EmbeddingsWorker] Record not found for async embedding: ${modelName} ID: ${recordId}`);
      return;
    }

    const vector = await generateVector(text);
    record.embedding = vector;
    await record.save({ hooks: false });
    logger.info(`[EmbeddingsWorker] Successfully updated embedding vector for ${modelName} ID: ${recordId}`);
  });
}

module.exports = {
  generateVector,
  attachHooks,
  registerWorkerHandler,
};
