const express = require('express');
const router = express.Router();

// Mock endpoint for "Ghost Text" AI suggestions (Copilot style)
router.post('/suggest', async (req, res) => {
  try {
    const { context } = req.body;
    
    // Simulate LLM generation delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock completion based on context ending
    let suggestion = " and this leads to further implications.";
    
    if (context.endsWith("mitochondria is the")) {
      suggestion = " powerhouse of the cell.";
    } else if (context.endsWith("Newton's second law is")) {
      suggestion = " F = ma.";
    }

    res.status(200).json({ suggestion });
  } catch (err) {
    res.status(500).json({ message: 'AI generation failed' });
  }
});

module.exports = router;
