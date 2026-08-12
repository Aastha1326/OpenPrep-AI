const express = require('express');
const { createBattleSession, getBattleSession } = require('../controllers/battleController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, createBattleSession);
router.get('/:roomCode', protect, getBattleSession);

module.exports = router;
