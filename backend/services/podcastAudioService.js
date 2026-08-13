const https = require('https');
const fs = require('fs');
const path = require('path');

// Base64 encoded 1-second silent MP3 buffer (LAME encoded, 32kbps mono)
const SILENCE_BASE64 = '//uQxAAAAAAAAAAAAAAAAAAAAAAAaW5mbwAAAA8AAAACAAACcQADAgMDBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PExMTFxcXGxsbHx8fIyMjJycjKyv///8AAAA5TEFNRTMuOTlyA5gAAAAAAAAAAAAYHwHFAUYAAAABAnEH4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAAAAAAAWAAwgAAA0gAAABGAAAAYmVuY2htYXJrAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmQAEAAABbAAAAYAAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

/**
 * Returns a concatenated silent MP3 buffer of specified duration
 * @param {number} seconds
 * @returns {Buffer}
 */
const getSilenceBuffer = (seconds = 1) => {
  const silence1s = Buffer.from(SILENCE_BASE64, 'base64');
  const count = Math.ceil(seconds);
  const buffers = [];
  for (let i = 0; i < count; i++) {
    buffers.push(silence1s);
  }
  return Buffer.concat(buffers);
};

/**
 * Splits text into chunks of safe lengths for Google Translate TTS limit (200 characters)
 * @param {string} text
 * @param {number} maxLength
 * @returns {string[]}
 */
const splitText = (text, maxLength = 160) => {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLength) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

/**
 * Downloads TTS voice MP3 buffer for a single chunk of text
 * @param {string} text
 * @param {string} lang
 * @returns {Promise<Buffer>}
 */
const fetchTTSBuffer = (text, lang = 'en') => {
  return new Promise((resolve, reject) => {
    // If unit testing, bypass network requests to guarantee offline stability
    if (process.env.NODE_ENV === 'test') {
      return resolve(Buffer.from('mock_tts_audio_frame'));
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`TTS Service returned status ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
};

/**
 * Downloads full concatenated TTS audio for longer text elements
 * @param {string} text
 * @param {string} lang
 * @returns {Promise<Buffer>}
 */
const getFullTextTTSBuffer = async (text, lang = 'en') => {
  const chunks = splitText(text);
  const buffers = [];
  for (const chunk of chunks) {
    try {
      const buf = await fetchTTSBuffer(chunk, lang);
      buffers.push(buf);
      // Minimal pause between sentence fragments
      buffers.push(getSilenceBuffer(0.2));
    } catch (err) {
      console.error(`TTS fetch failure for chunk "${chunk}":`, err);
    }
  }
  return Buffer.concat(buffers);
};

/**
 * Compiles a revision podcast episode for a set of flashcards
 * @param {object[]} cards Array of flashcards ({ front: string, back: string, hint: string })
 * @param {string} subjectName
 * @returns {Promise<{ buffer: Buffer, durationSeconds: number }>}
 */
const compilePodcastEpisode = async (cards, subjectName) => {
  const buffers = [];

  // 1. Intro Podcast Welcome speech
  const introText = `Welcome to your OpenPrep study podcast revision for ${subjectName}. We will review ${cards.length} flashcards. Get ready to test your knowledge. Let's begin.`;
  const introAudio = await getFullTextTTSBuffer(introText);
  buffers.push(introAudio);
  buffers.push(getSilenceBuffer(1.5));

  // 2. Loop and compile cards
  for (let idx = 0; idx < cards.length; idx++) {
    const card = cards[idx];
    const cardNumber = idx + 1;

    // Speak Question prompt
    const questionPrompt = `Card ${cardNumber}. Question: ${card.front}`;
    const questionAudio = await getFullTextTTSBuffer(questionPrompt);
    buffers.push(questionAudio);

    // 3.5 seconds recall pause
    buffers.push(getSilenceBuffer(3.5));

    // Speak Answer prompt
    let answerPrompt = `Answer: ${card.back}.`;
    if (card.hint) {
      answerPrompt = `Hint: ${card.hint}. ` + answerPrompt;
    }
    const answerAudio = await getFullTextTTSBuffer(answerPrompt);
    buffers.push(answerAudio);

    // Card boundary transition silence (0.8s)
    buffers.push(getSilenceBuffer(0.8));
  }

  // 3. Outro Podcast goodbye speech
  const outroText = `This concludes this session of your OpenPrep revision podcast. Keep studying and stay motivated!`;
  const outroAudio = await getFullTextTTSBuffer(outroText);
  buffers.push(outroAudio);

  const finalBuffer = Buffer.concat(buffers);
  
  // Approximate duration based on standard MP3 sizes/silences (e.g. 1s of silence = ~1KB-4KB depending on bitrate)
  // Let's estimate 1 second per 4KB of stitched audio for simplicity
  const durationSeconds = Math.max(15, Math.round(finalBuffer.length / 4000));

  return {
    buffer: finalBuffer,
    durationSeconds,
  };
};

module.exports = {
  getSilenceBuffer,
  splitText,
  getFullTextTTSBuffer,
  compilePodcastEpisode,
};
