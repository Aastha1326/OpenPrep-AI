const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const challengeController = require('../controllers/challengeController');
const squadActivityController = require('../controllers/squadActivityController');
const authenticateToken = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', squadController.getMySquads);
router.post('/create', squadController.createSquad);
router.post('/join', squadController.joinSquad);
router.post('/:id/leave', squadController.leaveSquad);
router.get('/:id/dashboard', squadController.getSquadDashboard);

router.post('/:squadId/challenges', challengeController.createChallenge);
router.put('/:squadId/challenges/:challengeId', challengeController.updateChallenge);

router.get('/:squadId/activity', squadActivityController.getFeed);
router.post('/:squadId/activity/:activityId/react', squadActivityController.react);

module.exports = router;