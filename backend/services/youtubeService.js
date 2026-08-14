const { YoutubeTranscript } = require('youtube-transcript');
const cacheManager = require('../utils/cacheManager');

// Strict YouTube URL Regex to prevent SSRF
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;

/**
 * Validates YouTube URL and extracts video ID
 * @param {string} url
 * @returns {string|null} videoId if valid, null otherwise
 */
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[5] : null;
}

/**
 * Fetch transcripts with timestamps for a YouTube video
 * @param {string} videoUrl
 * @returns {Promise<Array<{text: string, start: number, duration: number}>>}
 */
async function fetchTranscript(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL pattern');
  }

  const cacheKey = `youtube_transcript:${videoId}`;
  try {
    // Check Cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (cacheErr) {
    console.error('Redis cache fetch error:', cacheErr);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      throw new Error('Captions are disabled or unavailable for this video');
    }

    // Cache for 24 hours (86400 seconds)
    try {
      await cacheManager.set(cacheKey, JSON.stringify(transcript), 86400);
    } catch (cacheErr) {
      console.error('Redis cache save error:', cacheErr);
    }

    return transcript;
  } catch (err) {
    console.error('youtube-transcript fetch error:', err);
    throw new Error('Failed to fetch video transcripts. Please verify closed captions are enabled.');
  }
}

module.exports = {
  extractVideoId,
  fetchTranscript,
  YOUTUBE_REGEX,
};
