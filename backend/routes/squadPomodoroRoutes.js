/**
 * @fileoverview API routes for Squad Pomodoro features.
 */
const express = require('express');
const router = express.Router();
const squadPomodoroController = require('../controllers/squadPomodoroController');

router.get('/squads/:squadId/stats', squadPomodoroController.getSquadStats);

module.exports = router;
