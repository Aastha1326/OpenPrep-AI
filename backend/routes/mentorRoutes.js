const express = require('express');
const router = express.Router();
const MentorController = require('../controllers/MentorController');

router.post('/discover', MentorController.discover);
router.post('/:id/connect', MentorController.requestConnection);
router.get('/telemetry', MentorController.telemetry);

module.exports = router;
