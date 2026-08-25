const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/ResumeController');

router.post('/upload', ResumeController.upload);
router.post('/:id/process', ResumeController.process);
router.get('/analytics', ResumeController.analytics);

module.exports = router;
