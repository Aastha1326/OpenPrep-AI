/**
 * @fileoverview API routes for Tournament & Bracket Management.
 */
const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

/**
 * @route   POST /api/tournaments
 * @desc    Creates a new tournament event
 * @access  Private (Admin)
 */
router.post('/', tournamentController.createTournament);

/**
 * @route   GET /api/tournaments/:id/bracket
 * @desc    Returns live bracket tree structure and match statuses
 * @access  Public
 */
router.get('/:id/bracket', tournamentController.getBracket);

/**
 * @route   POST /api/tournaments/:id/join
 * @desc    Registers student or squad for tournament
 * @access  Private
 */
router.post('/:id/join', tournamentController.joinTournament);

module.exports = router;
