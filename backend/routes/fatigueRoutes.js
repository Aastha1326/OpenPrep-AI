const express = require('express');
const router = express.Router();
const fatigueEngine = require('../services/fatigueEngine');

router.post('/evaluate', async (req, res) => {
  try {
    const { sessionDurationMinutes, quizAccuracy, interactionsPerMinute } = req.body;
    
    // Simulate fatigue calculation logic
    const evaluation = fatigueEngine.calculateFatigue({
      sessionDurationMinutes,
      quizAccuracy,
      interactionsPerMinute
    });

    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: 'Error evaluating cognitive load' });
  }
});

module.exports = router;
