const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generatePodcastEpisode,
  getUserEpisodes,
} = require('../controllers/podcastController');

router.post('/generate', protect, generatePodcastEpisode);
router.get('/episodes', protect, getUserEpisodes);

module.exports = router;
