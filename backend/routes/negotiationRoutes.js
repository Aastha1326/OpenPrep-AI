const express = require('express');
const router = express.Router();
const NegotiationController = require('../controllers/NegotiationController');

// Routes mapped to /api/negotiation/*
router.post('/init', NegotiationController.initiate);
router.post('/:id/start', NegotiationController.start);
router.post('/:id/reply', NegotiationController.submitReply);

module.exports = router;
