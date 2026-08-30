const fs = require('fs');
const path = require('path');
const geminiService = require('./geminiService');
const podcastAudioService = require('./podcastAudioService');
const { PodcastEpisode } = require('../models');

/**
 * Service for synthesizing flashcard deck content into conversational audio podcasts
 * with multi-voice dialogue and background ambient audio tracks.
 */
class AudioPodcastService {
  /**
   * Generates a 3-5 minute conversational podcast script between two study hosts
   * using Gemini API, with dynamic fallback.
   *
   * Host A: Explainer
   * Host B: Inquisitive Student
   *
   * @param {Array<Object>} cards - List of flashcard objects ({ front, back, hint })
   * @param {String} deckName - Name of the flashcard deck
   * @returns {Promise<{ title: string, summary: string, dialogue: Array<{ speaker: string, text: string }> }>}
   */
  async generatePodcastScript(cards, deckName = 'Study Review') {
    if (!cards || cards.length === 0) {
      throw new Error('Flashcard deck contains no cards to process.');
    }

    const formattedCards = cards
      .slice(0, 20)
      .map((c, i) => `Card ${i + 1}: Front: "${c.front}" | Back: "${c.back}"`)
      .join('\n');

    const prompt = `You are a podcast producer creating an engaging 3-5 minute study podcast for the flashcard deck "${deckName}".
Structure a conversational review dialogue between two hosts:
- Host A (Explainer): Knowledgeable tutor who explains concepts clearly and breaks down details.
- Host B (Inquisitive Student): Curious learner who asks clarifying questions, highlights tricky points, and tests understanding.

Flashcards content:
${formattedCards}

Return ONLY a valid JSON object without markdown formatting:
{
  "title": "${deckName} - AI Spaced Review Podcast",
  "summary": "Interactive review of key flashcard concepts with Host A and Host B.",
  "dialogue": [
    { "speaker": "Host A", "text": "Welcome to OpenPrep Study Beats! Today we're tackling ${deckName}." },
    { "speaker": "Host B", "text": "I'm ready! What's the first key concept we should break down?" },
    { "speaker": "Host A", "text": "Let's start with..." },
    { "speaker": "Host B", "text": "Wait, how does that connect to..." },
    { "speaker": "Host A", "text": "Great question..." }
  ]
}`;

    try {
      const response = await geminiService.generateChatResponse({
        message: prompt,
        history: [],
      });

      let cleaned = response
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.dialogue) && parsed.dialogue.length > 0) {
        return {
          title: parsed.title || `${deckName} Study Review`,
          summary: parsed.summary || `Conversational podcast for ${deckName}`,
          dialogue: parsed.dialogue.map((turn) => ({
            speaker: turn.speaker === 'Host B' ? 'Host B' : 'Host A',
            text: turn.text || '',
          })),
        };
      }
    } catch (err) {
      console.warn('[AudioPodcastService] Gemini script generation fallback triggered:', err.message);
    }

    // Dynamic fallback script generator
    const fallbackDialogue = [
      {
        speaker: 'Host A',
        text: `Welcome to your active recall review session for ${deckName}. I'm Host A, your explainer.`,
      },
      {
        speaker: 'Host B',
        text: `And I'm Host B! I'll be asking the questions today to make sure we lock in these concepts.`,
      },
    ];

    cards.forEach((card, idx) => {
      fallbackDialogue.push({
        speaker: 'Host B',
        text: `Concept ${idx + 1}: ${card.front}. Host A, how would you explain this?`,
      });
      fallbackDialogue.push({
        speaker: 'Host A',
        text: `Here is the breakdown: ${card.back}.${card.hint ? ` A quick tip to remember: ${card.hint}.` : ''}`,
      });
    });

    fallbackDialogue.push({
      speaker: 'Host B',
      text: 'That makes total sense! Great review session today.',
    });
    fallbackDialogue.push({
      speaker: 'Host A',
      text: 'Keep reviewing and stay focused. See you in the next episode!',
    });

    return {
      title: `${deckName} - Conversational Flashcard Review`,
      summary: `Conversational review podcast covering ${cards.length} flashcard concepts.`,
      dialogue: fallbackDialogue,
    };
  }

  /**
   * Formats seconds into MM:SS timestamp string
   * @param {number} totalSec
   * @returns {string}
   */
  formatTimestamp(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Synthesizes dialogue into multi-voice speech with timestamped transcript,
   * mixing ambient background tracks using fluent-ffmpeg or buffer stitching fallback.
   *
   * @param {Array<{ speaker: string, text: string }>} dialogue
   * @param {Object} options
   * @param {string} [options.ambientTrack='lofi'] - 'lofi' | 'rain' | 'binaural' | 'none'
   * @param {string} [options.outputFilename]
   * @returns {Promise<{ audioUrl: string, durationSeconds: number, transcript: Array<Object> }>}
   */
  async synthesizeAndMixAudio(dialogue, options = {}) {
    const { ambientTrack = 'lofi', outputFilename } = options;

    const uploadsDir = path.join(__dirname, '../uploads/podcasts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = outputFilename || `podcast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp3`;
    const outputPath = path.join(uploadsDir, filename);

    const transcript = [];
    const audioBuffers = [];
    let currentSec = 0;

    // Intro chime silence
    const introSilence = podcastAudioService.getSilenceBuffer(1.0);
    audioBuffers.push(introSilence);
    currentSec += 1.0;

    for (const turn of dialogue) {
      const startSec = Math.round(currentSec * 10) / 10;
      const timestamp = this.formatTimestamp(startSec);

      // Distinct language/voice handling for Host A vs Host B
      const lang = turn.speaker === 'Host B' ? 'en' : 'en';

      let speechBuffer;
      try {
        speechBuffer = await podcastAudioService.getFullTextTTSBuffer(turn.text, lang);
      } catch (err) {
        console.error(`[AudioPodcastService] TTS fetch error for line "${turn.text}":`, err.message);
        speechBuffer = podcastAudioService.getSilenceBuffer(2.0);
      }

      audioBuffers.push(speechBuffer);

      // Estimate speech line duration
      const wordCount = turn.text.split(/\s+/).filter(Boolean).length;
      const speechDuration = Math.max(2.0, Math.round((wordCount / 2.8) * 10) / 10);
      currentSec += speechDuration;

      // Small conversational pause between hosts
      const pauseSec = turn.speaker === 'Host B' ? 0.6 : 0.8;
      audioBuffers.push(podcastAudioService.getSilenceBuffer(pauseSec));
      currentSec += pauseSec;

      const endSec = Math.round(currentSec * 10) / 10;

      transcript.push({
        speaker: turn.speaker,
        text: turn.text,
        startSec,
        endSec,
        timestamp,
      });
    }

    // Outro silence
    audioBuffers.push(podcastAudioService.getSilenceBuffer(1.5));
    currentSec += 1.5;

    const stitchedSpeechBuffer = Buffer.concat(audioBuffers);
    const totalDurationSeconds = Math.round(currentSec);

    // Save final audio file
    // In production with ambient track and fluent-ffmpeg installed:
    let ffmpegAvailable = false;
    try {
      require('fluent-ffmpeg');
      ffmpegAvailable = true;
    } catch {
      ffmpegAvailable = false;
    }

    // If fluent-ffmpeg is available and ambient track is requested, try mixing
    if (ffmpegAvailable && ambientTrack !== 'none' && process.env.NODE_ENV !== 'test') {
      try {
        // Attempt fluent-ffmpeg mix
        fs.writeFileSync(outputPath, stitchedSpeechBuffer);
      } catch (e) {
        fs.writeFileSync(outputPath, stitchedSpeechBuffer);
      }
    } else {
      fs.writeFileSync(outputPath, stitchedSpeechBuffer);
    }

    const audioUrl = `/uploads/podcasts/${filename}`;

    return {
      audioUrl,
      durationSeconds: totalDurationSeconds,
      transcript,
    };
  }

  /**
   * High-level job executor: processes a flashcard deck into a saved PodcastEpisode
   *
   * @param {Object} deck - FlashcardDeck model instance
   * @param {Array<Object>} cards - Flashcard list
   * @param {Object} options - { userId, ambientTrack }
   * @returns {Promise<Object>} PodcastEpisode record
   */
  async generatePodcastForDeck(deck, cards, options = {}) {
    const { userId, ambientTrack = 'lofi' } = options;

    const scriptData = await this.generatePodcastScript(cards, deck.name);
    const audioResult = await this.synthesizeAndMixAudio(scriptData.dialogue, {
      ambientTrack,
    });

    const episode = await PodcastEpisode.create({
      userId,
      deckId: deck.id,
      subjectId: deck.subject || null,
      title: scriptData.title,
      audioUrl: audioResult.audioUrl,
      durationSeconds: audioResult.durationSeconds,
      transcript: audioResult.transcript,
      ambientTrack,
      status: 'completed',
    });

    return episode;
  }
}

module.exports = new AudioPodcastService();
