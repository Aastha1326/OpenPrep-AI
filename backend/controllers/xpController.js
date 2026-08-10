const User = require('../models/User');

exports.awardXP = async (req, res) => {
  try {
    const { activityType, amount } = req.body;
    
    // For MVP, if we don't have auth middleware firing properly, we'll just return a success payload
    // In production we'd do: const user = await User.findById(req.user.id);
    
    // Mock user progression state
    const mockState = {
      level: 5,
      totalXP: 5400 + amount,
      skillPoints: 2,
      unlockedNodes: ['memory_1', 'focus_1']
    };

    res.status(200).json({
      message: `Awarded ${amount} XP for ${activityType}`,
      progression: mockState
    });

  } catch (err) {
    res.status(500).json({ message: 'Error awarding XP' });
  }
};

exports.unlockSkillNode = async (req, res) => {
  try {
    const { nodeId } = req.body;
    
    res.status(200).json({
      message: `Successfully unlocked ${nodeId}`,
      unlockedNodes: ['memory_1', 'focus_1', nodeId],
      skillPointsRemaining: 1
    });

  } catch (err) {
    res.status(500).json({ message: 'Error unlocking node' });
  }
};
