const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const gamificationService = require('../services/gamificationService');

// @desc    Get all milestones across active study plans with optional status filtering
// @route   GET /api/milestones
// @access  Private
exports.getMilestones = async (req, res, next) => {
  try {
    const { status } = req.query;

    const plans = await StudyPlan.findAll({
      where: { user: req.user.id, status: 'active' },
      attributes: ['id', 'exam', 'milestones'],
    });

    let allMilestones = [];
    plans.forEach(plan => {
      if (Array.isArray(plan.milestones)) {
        plan.milestones.forEach(m => {
          allMilestones.push({
            ...m,
            studyPlanId: plan.id,
            examId: plan.exam
          });
        });
      }
    });

    // Sort chronologically
    allMilestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Status filtering
    if (status) {
      allMilestones = allMilestones.filter(m => m.status === status);
    }

    res.status(200).json({ success: true, count: allMilestones.length, data: allMilestones });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim reward for a completed milestone
// @route   PUT /api/milestones/:id/claim
// @access  Private
exports.claimMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plans = await StudyPlan.findAll({
      where: { user: req.user.id, status: 'active' }
    });

    let targetPlan = null;
    let targetMilestone = null;
    let milestoneIndex = -1;

    for (const plan of plans) {
      if (Array.isArray(plan.milestones)) {
        milestoneIndex = plan.milestones.findIndex(m => m.id === id);
        if (milestoneIndex !== -1) {
          targetPlan = plan;
          targetMilestone = plan.milestones[milestoneIndex];
          break;
        }
      }
    }

    if (!targetPlan || !targetMilestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found in active plans' });
    }

    if (targetMilestone.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Milestone already claimed' });
    }

    // Mark as completed
    const updatedMilestones = JSON.parse(JSON.stringify(targetPlan.milestones));
    updatedMilestones[milestoneIndex].status = 'completed';
    targetPlan.milestones = updatedMilestones;
    await targetPlan.save();

    // Calculate total claimed milestones for badge metric
    let claimedCount = 0;
    for (const plan of plans) {
      if (Array.isArray(plan.milestones)) {
        claimedCount += plan.milestones.filter(m => m.status === 'completed').length;
      }
    }
    
    // The just-updated milestone was also modified in targetPlan.milestones
    // We already updated targetPlan.milestones in memory.
    // So the count includes the one we just claimed!

    // Gamification
    const progression = await gamificationService.addXP(req.user.id, 100);

    // Check for badges
    const newBadges = await gamificationService.checkAndAwardBadges(req.user.id, 'MILESTONES_COMPLETED', claimedCount);

    if (progression) {
      progression.newBadges = newBadges;
    }

    res.status(200).json({
      success: true,
      message: 'Milestone claimed successfully',
      progression,
      data: updatedMilestones[milestoneIndex]
    });
  } catch (error) {
    next(error);
  }
};
