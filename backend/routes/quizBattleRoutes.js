const express = require('express');
const router = express.Router();
const { joinMatchmaking, calculateElo } = require('../controllers/matchmakingController');

router.post('/matchmake', joinMatchmaking);
router.post('/elo', calculateElo);

module.exports = router;
