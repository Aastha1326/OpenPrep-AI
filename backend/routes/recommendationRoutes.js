const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /recommendations/:userId or /api/recommendations/:userId
router.get('/recommendations/:userId', recommendationController.getRecommendations);
router.get('/:userId', recommendationController.getRecommendations);

// POST /recommendations/:userId/hit or /api/recommendations/:userId/hit
router.post('/recommendations/:userId/hit', recommendationController.recordRecommendationHit);
router.post('/:userId/hit', recommendationController.recordRecommendationHit);

module.exports = router;
