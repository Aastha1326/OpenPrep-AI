const audioSynthesisService = require('../services/audioSynthesisService');
const AudioReviewEpisode = require('../models/AudioReviewEpisode');

/**
 * @desc    Generate audio review podcast episode from flashcard deck or note items
 * @route   POST /api/podcast/generate
 * @access  Private
 */
exports.generatePodcastEpisode = async (req, res) => {
  try {
    const { items, title, subject, thinkTimeSeconds } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Study items array is required' });
    }

    const episodeData = audioSynthesisService.generateEpisodeData(items, {
      title: title || 'Quick Spaced Review',
      subject: subject || 'General',
      thinkTimeSeconds: thinkTimeSeconds || 5,
    });

    const episode = await AudioReviewEpisode.create({
      userId: req.user.id,
      title: episodeData.title,
      subject: episodeData.subject,
      durationSeconds: episodeData.durationSeconds,
      cadenceSeconds: episodeData.cadenceSeconds,
      chapters: episodeData.chapters,
      script: episodeData.script,
      audioUrl: null, // synthesized on-the-fly or streamed via speech API
    });

    return res.status(201).json({
      success: true,
      data: {
        episode,
        vttTrack: episodeData.vttTrack,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user podcast episodes
 * @route   GET /api/podcast/episodes
 * @access  Private
 */
exports.getUserEpisodes = async (req, res) => {
  try {
    const episodes = await AudioReviewEpisode.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: episodes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
