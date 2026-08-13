const express = require('express');
const { protect } = require('../middleware/auth');
const { generatePodcast, getPodcastHistory } = require('../controllers/podcastController');

const router = express.Router();

router.post('/decks/:id/generate-podcast', protect, generatePodcast);
router.get('/decks/:id/podcasts', protect, getPodcastHistory);

module.exports = router;
