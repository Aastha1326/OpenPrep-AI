const { Flashcard, Subject, PodcastEpisode } = require('../models');
const { compilePodcastEpisode } = require('../services/podcastAudioService');
const fs = require('fs');
const path = require('path');

exports.generatePodcast = async (req, res, next) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.id;

    // 1. Verify subject exists
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject/Deck not found.' });
    }

    // 2. Fetch all cards for this user/subject
    const flashcards = await Flashcard.findAll({
      where: { user: userId, subject: subjectId },
      order: [['createdAt', 'ASC']],
    });

    if (flashcards.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'This deck is empty. Add flashcards before generating a podcast.',
      });
    }

    // 3. Paginate to keep file size manageable (max 50 cards per podcast part)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 25);
    const offset = (page - 1) * limit;

    const paginatedCards = flashcards.slice(offset, offset + limit);
    if (paginatedCards.length === 0) {
      return res.status(400).json({ success: false, error: 'No flashcards found for this page number.' });
    }

    const title = `${subject.name} Revision Podcast - Part ${page}`;
    const fileName = `podcast-${userId}-${subjectId}-page${page}.mp3`;
    const audioUrl = `/uploads/${fileName}`;
    const uploadPath = path.join(__dirname, '../../uploads', fileName);

    // 4. Cache check: If file already exists, return linked episode directly
    if (fs.existsSync(uploadPath)) {
      let episode = await PodcastEpisode.findOne({ where: { userId, subjectId, audioUrl } });
      if (!episode) {
        // file exists but record not in DB (e.g. wiped DB), reconstruct record
        episode = await PodcastEpisode.create({
          userId,
          subjectId,
          title,
          audioUrl,
          durationSeconds: Math.round(fs.statSync(uploadPath).size / 4000),
        });
      }
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: {
          id: episode.id,
          title: episode.title,
          audioUrl: episode.audioUrl,
          durationSeconds: episode.durationSeconds,
          totalCards: paginatedCards.length,
          totalPages: Math.ceil(flashcards.length / limit),
          currentPage: page,
        },
      });
    }

    // 5. Generate stitched MP3 podcast
    const { buffer, durationSeconds } = await compilePodcastEpisode(paginatedCards, subject.name);

    // Ensure uploads directory exists
    const uploadsDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(uploadPath, buffer);

    const episode = await PodcastEpisode.create({
      userId,
      subjectId,
      title,
      audioUrl,
      durationSeconds,
    });

    res.status(201).json({
      success: true,
      source: 'synthesized',
      data: {
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audioUrl,
        durationSeconds: episode.durationSeconds,
        totalCards: paginatedCards.length,
        totalPages: Math.ceil(flashcards.length / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPodcastHistory = async (req, res, next) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.id;

    const episodes = await PodcastEpisode.findAll({
      where: { userId, subjectId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: episodes,
    });
  } catch (error) {
    next(error);
  }
};
