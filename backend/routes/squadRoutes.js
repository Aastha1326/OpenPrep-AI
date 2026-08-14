const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const challengeController = require('../controllers/challengeController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', squadController.getMySquads);
router.post('/create', squadController.createSquad);
router.post('/join', squadController.joinSquad);
router.post('/:id/leave', squadController.leaveSquad);
router.get('/:id/dashboard', squadController.getSquadDashboard);

router.post('/:squadId/challenges', challengeController.createChallenge);
router.put('/:squadId/challenges/:challengeId', challengeController.updateChallenge);

module.exports = router;
