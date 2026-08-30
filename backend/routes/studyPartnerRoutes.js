/**
 * @fileoverview API routes for Study Partner Matchmaking and Shared Hub.
 */
const express = require('express');
const router = express.Router();
const studyPartnerController = require('../controllers/studyPartnerController');

/**
 * @route   GET /api/study-partners/matches
 * @desc    Fetch potential study partner matches sorted by compatibility
 * @access  Private
 */
router.get('/matches', studyPartnerController.getPotentialMatches);

/**
 * @route   POST /api/study-partners/request
 * @desc    Send a study partner request to a specific user
 * @access  Private
 */
router.post('/request', studyPartnerController.sendRequest);

/**
 * @route   GET /api/study-partners/:partnerId/hub
 * @desc    Fetch shared resource hub data for an accepted partner
 * @access  Private
 */
router.get('/:partnerId/hub', studyPartnerController.getSharedHub);

module.exports = router;
