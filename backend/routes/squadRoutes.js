const express = require('express');
const router = express.Router();
const {
  createSquad,
  getSquads,
  joinSquad,
  getSquadDetails,
  createChallenge,
} = require('../controllers/squadController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createSquad)
  .get(protect, getSquads);

router.post('/join', protect, joinSquad);

router.route('/:id')
  .get(protect, getSquadDetails);

router.route('/:id/challenges')
  .post(protect, createChallenge);

module.exports = router;
