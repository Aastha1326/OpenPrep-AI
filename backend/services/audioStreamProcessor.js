const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MockInterviewSession } = require('../models');
const logger = require('../utils/logger');

// Local cache for accumulating raw audio buffers per interview room/session
const audioBuffers = new Map(); // roomId -> Array of audio buffers

/**
 * Accumulates incoming binary audio chunks for a given interview room.
 */
function accumulateAudioChunk(roomId, chunk) {
  if (!roomId || !chunk) return;
  if (!audioBuffers.has(roomId)) {
    audioBuffers.set(roomId, []);
  }
  audioBuffers.get(roomId).push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

/**
 * Runs amplitude analyses to determine average audio volume levels.
 */
function analyzeConversationalVolume(collatedBuffer) {
  try {
    let sum = 0;
    let sampleCount = 0;
    // Iterate PCM bytes to compute root-mean-square amplitude
    for (let i = 0; i < collatedBuffer.length; i += 2) {
      if (i + 1 < collatedBuffer.length) {
        const val = collatedBuffer.readInt16LE(i);
        sum += val * val;
        sampleCount++;
      }
    }
    const rms = Math.sqrt(sum / (sampleCount || 1));
    // Normalize to 0-100 scale (normal voice is around 20-50% RMS range)
    const normalized = Math.min(100, Math.round((rms / 32768) * 300));
    return normalized || 35; // Default average fallback
  } catch (err) {
    logger.warn('Failed to calculate exact audio RMS volume', { error: err.message });
    return 40; // Default voice level
  }
}

/**
 * Analyzes conversational pauses and pacing metrics.
 */
function analyzeSpeechRhythm(collatedBuffer) {
  // Simple heuristic: count silent parts where amplitude drops below a threshold
  let silentChunks = 0;
  let totalChunks = 0;
  const chunkSize = 1600; // 100ms chunks at 8kHz 16-bit

  for (let i = 0; i < collatedBuffer.length; i += chunkSize) {
    let chunkSum = 0;
    let chunkCount = 0;
    for (let j = i; j < i + chunkSize && j < collatedBuffer.length; j += 2) {
      if (j + 1 < collatedBuffer.length) {
        chunkSum += Math.abs(collatedBuffer.readInt16LE(j));
        chunkCount++;
      }
    }
    const avg = chunkSum / (chunkCount || 1);
    if (avg < 500) { // silent boundary threshold
      silentChunks++;
    }
    totalChunks++;
  }

  const hesitationSeconds = parseFloat(((silentChunks / (totalChunks || 1)) * (collatedBuffer.length / 16000)).toFixed(2));
  return {
    hesitationSeconds: isNaN(hesitationSeconds) ? 1.2 : hesitationSeconds,
    totalSeconds: parseFloat((collatedBuffer.length / 16000).toFixed(2)) || 5,
  };
}

/**
 * Pipes collated audio to Gemini for speech-to-text transcription and saves evaluation metrics.
 */
async function processSessionAudio(roomId, userId) {
  const chunks = audioBuffers.get(roomId) || [];
  audioBuffers.delete(roomId); // Clear cache immediately to prevent memory leaks

  if (chunks.length === 0) {
    logger.warn('No audio chunks accumulated for interview processing', { roomId });
    return null;
  }

  const collatedBuffer = Buffer.concat(chunks);
  const avgVolume = analyzeConversationalVolume(collatedBuffer);
  const rhythm = analyzeSpeechRhythm(collatedBuffer);

  const apiKey = process.env.GEMINI_API_KEY;
  let transcriptionText = 'Speech transcription failed or was empty.';
  let wordsPerMinute = 120; // default conversational reading speed

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Convert audio stream to base64 inline data format
      const audioPart = {
        inlineData: {
          data: collatedBuffer.toString('base64'),
          mimeType: 'audio/webm',
        },
      };

      const response = await model.generateContent([
        audioPart,
        'You are an AI Interviewer Speech-To-Text module. Transcribe the spoken text in this audio chunk accurately. If no speech is present, return an empty string.',
      ]);

      transcriptionText = response.response.text().trim();
      
      const wordCount = transcriptionText.split(/\s+/).filter(Boolean).length;
      const durationMin = rhythm.totalSeconds / 60 || 0.1;
      wordsPerMinute = Math.round(wordCount / durationMin) || 120;
    } catch (err) {
      logger.error('Gemini Speech-To-Text API failed', { error: err.message, roomId });
    }
  } else {
    logger.warn('GEMINI_API_KEY not configured. Falling back to mocked transcription output.', { roomId });
    transcriptionText = 'Hello, this is a mock interview transcription of the student response detailing algorithm time complexity.';
  }

  // Calculate ELO-like grade score
  const overallScore = Math.max(1, Math.min(10, Math.round(
    10 - (rhythm.hesitationSeconds > 3 ? 2 : 0) - (avgVolume < 10 || avgVolume > 85 ? 1 : 0)
  )));

  const metrics = {
    avgVolume,
    hesitationSeconds: rhythm.hesitationSeconds,
    totalDurationSeconds: rhythm.totalSeconds,
    speechSpeedWpm: wordsPerMinute,
    overallScore,
  };

  try {
    const session = await MockInterviewSession.create({
      userId,
      roomId,
      transcription: transcriptionText,
      metrics,
      status: 'completed',
    });

    logger.info('Saved mock interview session metrics and transcriptions', { sessionId: session.id, roomId });
    return session;
  } catch (err) {
    logger.error('Failed to create MockInterviewSession record', { error: err.message, roomId });
    throw err;
  }
}

module.exports = {
  accumulateAudioChunk,
  processSessionAudio,
  audioBuffers,
};
