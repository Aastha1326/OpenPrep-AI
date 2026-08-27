const adaptivePlannerService = require('../services/adaptivePlannerService');
const StudyPlan = require('../models/StudyPlan');

exports.getAdaptiveAdjustments = async (req, res) => {
  try {
    const { planId } = req.params;
    const data = await adaptivePlannerService.computeAdaptiveAdjustments(req.user.id, planId || null);
    if (!data.plan) return res.status(404).json({ success: false, message: 'No active study plan found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error computing adaptive adjustments:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to compute adjustments' });
  }
};

exports.generateAdaptivePlan = async (req, res) => {
  try {
    const { examDate, dailyHours, subjectIds } = req.body;
    if (!examDate || !dailyHours) {
      return res.status(400).json({ success: false, message: 'examDate and dailyHours are required' });
    }
    const planData = await adaptivePlannerService.generateAdaptivePlan(req.user.id, examDate, dailyHours, subjectIds || []);

    // Create or update study plan
    let plan = await StudyPlan.findOne({ where: { user: req.user.id, status: 'active' } });
    if (plan) {
      plan.dailyGoals = planData.dailyGoals;
      plan.endDate = new Date(examDate);
      await plan.save();
    } else {
      plan = await StudyPlan.create({
        exam: subjectIds?.[0] || '00000000-0000-0000-0000-000000000000',
        user: req.user.id,
        startDate: new Date(),
        endDate: new Date(examDate),
        dailyGoals: planData.dailyGoals,
        status: 'active',
      });
    }

    res.status(201).json({
      success: true,
      data: { planId: plan.id, totalDays: planData.totalDays, strategy: planData.strategy, dailyGoals: planData.dailyGoals },
    });
  } catch (error) {
    console.error('Error generating adaptive plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate plan' });
  }
};

exports.getTodayTasks = async (req, res) => {
  try {
    const data = await adaptivePlannerService.getTodayTasks(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch today tasks' });
  }
};

exports.getPlanStats = async (req, res) => {
  try {
    const data = await adaptivePlannerService.getPlanStats(req.user.id);
    if (!data) return res.status(404).json({ success: false, message: 'No active study plan found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching plan stats:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch plan stats' });
  }
};
