/**
 * @fileoverview API routes for Academic Citation and Reference Management.
 */
const express = require('express');
const router = express.Router();
const referenceManagerController = require('../controllers/referenceManagerController');

/**
 * @route   POST /api/references
 * @desc    Generate and save a new citation from a URL or text snippet
 * @access  Private
 */
router.post('/', referenceManagerController.createCitation);

/**
 * @route   GET /api/references
 * @desc    Fetch the user's reference library with optional filters
 * @access  Private
 */
router.get('/', referenceManagerController.getReferences);

/**
 * @route   DELETE /api/references/:id
 * @desc    Delete a specific reference from the library
 * @access  Private
 */
router.delete('/:id', referenceManagerController.deleteReference);

module.exports = router;
