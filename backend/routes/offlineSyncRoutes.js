/**
 * @fileoverview API routes for Offline Sync features.
 */
const express = require('express');
const router = express.Router();
const offlineSyncController = require('../controllers/offlineSyncController');

/**
 * @route   POST /api/sync/batch
 * @desc    Process a batch of queued actions from offline mode
 * @access  Private
 */
router.post('/batch', offlineSyncController.processBatchSync);

module.exports = router;
