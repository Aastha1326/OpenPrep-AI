const { Op } = require('sequelize');
const MilestoneReward = require('../models/MilestoneReward');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');

/** Default milestone definitions for new users. */
const MILESTONE_TEMPLATES = [
  { milestoneType: 'quiz_count', title: 'Quiz Beginner', description: 'Complete your first quiz', targetValue: 1, unit: 'quizzes', rewardType: 'xp', rewardValue: 50, rewardLabel: '50 XP', icon: '📝', tier: 'bronze' },
  { milestoneType: 'quiz_count', title: 'Quiz Enthusiast', description: 'Complete 10 quizzes', targetValue: 10, unit: 'quizzes', rewardType: 'badge', rewardValue: 100, rewardLabel: 'Quiz Enthusiast Badge', icon: '🏅', tier: 'silver' },
  { milestoneType: 'quiz_count', title: 'Quiz Master', description: 'Complete 50 quizzes', targetValue: 50, unit: 'quizzes', rewardType: 'badge', rewardValue: 500, rewardLabel: 'Quiz Master Badge', icon: '👑', tier: 'gold' },
  { milestoneType: 'quiz_count', title: 'Quiz Legend', description: 'Complete 100 quizzes', targetValue: 100, unit: 'quizzes', rewardType: 'title', rewardValue: 1000, rewardLabel: 'Quiz Legend Title', icon: '🌟', tier: 'platinum' },
  { milestoneType: 'study_hours', title: 'First Hour', description: 'Study for 1 hour total', targetValue: 1, unit: 'hours', rewardType: 'xp', rewardValue: 25, rewardLabel: '25 XP', icon: '⏱️', tier: 'bronze' },
  { milestoneType: 'study_hours', title: 'Dedicated Learner', description: 'Study for 10 hours total', targetValue: 10, unit: 'hours', rewardType: 'xp', rewardValue: 200, rewardLabel: '200 XP', icon: '📖', tier: 'silver' },
  { milestoneType: 'study_hours', title: 'Study Warrior', description: 'Study for 50 hours total', targetValue: 50, unit: 'hours', rewardType: 'badge', rewardValue: 500, rewardLabel: 'Study Warrior Badge', icon: '⚔️', tier: 'gold' },
  { milestoneType: 'study_hours', title: 'Study Champion', description: 'Study for 100 hours total', targetValue: 100, unit: 'hours', rewardType: 'title', rewardValue: 1000, rewardLabel: 'Study Champion Title', icon: '🏆', tier: 'platinum' },
  { milestoneType: 'streak', title: '7-Day Warrior', description: 'Maintain a 7-day study streak', targetValue: 7, unit: 'days', rewardType: 'streak_freeze', rewardValue: 1, rewardLabel: '1 Streak Freeze', icon: '🔥', tier: 'bronze' },
  { milestoneType: 'streak', title: '30-Day Champion', description: 'Maintain a 30-day study streak', targetValue: 30, unit: 'days', rewardType: 'badge', rewardValue: 300, rewardLabel: '30-Day Champion Badge', icon: '💎', tier: 'gold' },
  { milestoneType: 'topic_mastery', title: 'Topic Starter', description: 'Complete 5 topics', targetValue: 5, unit: 'topics', rewardType: 'xp', rewardValue: 100, rewardLabel: '100 XP', icon: '📚', tier: 'bronze' },
  { milestoneType: 'topic_mastery', title: 'Subject Explorer', description: 'Complete 20 topics', targetValue: 20, unit: 'topics', rewardType: 'badge', rewardValue: 400, rewardLabel: 'Subject Explorer Badge', icon: '🧭', tier: 'silver' },
  { milestoneType: 'score_achievement', title: 'Score 90+', description: 'Achieve 90%+ on any quiz', targetValue: 90, unit: '%', rewardType: 'xp', rewardValue: 150, rewardLabel: '150 XP', icon: '🎯', tier: 'silver' },
  { milestoneType: 'score_achievement', title: 'Perfect Score', description: 'Achieve 100% on any quiz', targetValue: 100, unit: '%', rewardType: 'badge', rewardValue: 500, rewardLabel: 'Perfect Score Badge', icon: '💯', tier: 'gold' },
];

/** Compute current values for each milestone type from user data. */
async function computeCurrentValues(userId) {
  const quizIds = (await Quiz.findAll({ attributes: ['id'] })).map((q) => q.id);
  const quizCount = await QuizAttempt.count({ where: { user: userId, quiz: { [Op.in]: quizIds.length ? quizIds : ['0'] } } });
  const bestScore = (await QuizAttempt.max('score', { where: { user: userId, quiz: { [Op.in]: quizIds.length ? quizIds : ['0'] } } })) || 0;

  const plan = await StudyPlan.findOne({ where: { user: userId, status: 'active' } });
  let studyHours = 0;
  if (plan?.dailyGoals) {
    const tasks = plan.dailyGoals.flatMap((g) => g.tasks || []);
    studyHours = Math.round(tasks.filter((t) => t.completed).reduce((s, t) => s + (t.duration || 60), 0) / 60 * 10) / 10;
  }

  const user = await User.findByPk(userId);
  const streak = user?.streakCount || user?.currentStreak || 0;

  const { sequelize } = require('../config/db');
  const [topicResult] = await sequelize.query(
    `SELECT COUNT(DISTINCT "topic") as cnt FROM "Progresses" WHERE "user" = :userId AND "completionPercentage" = 100 AND "topic" IS NOT NULL`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );
  const topicsCompleted = parseInt(topicResult?.cnt || '0', 10);

  return { quizCount, studyHours, streak, topicsCompleted, bestScore };
}

/** Initialize milestone rewards for a user if they don't exist yet. */
async function initMilestones(userId) {
  const existing = await MilestoneReward.findAll({ where: { user: userId } });
  if (existing.length > 0) return existing;

  const milestones = MILESTONE_TEMPLATES.map((t) => ({
    user: userId,
    milestoneType: t.milestoneType,
    title: t.title,
    description: t.description,
    targetValue: t.targetValue,
    currentValue: 0,
    unit: t.unit,
    rewardType: t.rewardType,
    rewardValue: t.rewardValue,
    rewardLabel: t.rewardLabel,
    status: 'locked',
    icon: t.icon,
    tier: t.tier,
  }));
  return MilestoneReward.bulkCreate(milestones);
}

/** Evaluate and update milestone progress for a user. Returns newly earned milestones. */
async function evaluateMilestones(userId) {
  await initMilestones(userId);
  const vals = await computeCurrentValues(userId);
  const milestones = await MilestoneReward.findAll({ where: { user: userId, status: { [Op.in]: ['locked', 'in_progress'] } } });
  const newlyEarned = [];

  for (const m of milestones) {
    let current = 0;
    switch (m.milestoneType) {
      case 'quiz_count': current = vals.quizCount; break;
      case 'study_hours': current = vals.studyHours; break;
      case 'streak': current = vals.streak; break;
      case 'topic_mastery': current = vals.topicsCompleted; break;
      case 'score_achievement': current = vals.bestScore; break;
      default: current = m.currentValue;
    }
    m.currentValue = current;

    if (current >= m.targetValue && m.status !== 'earned' && m.status !== 'claimed') {
      m.status = 'earned';
      m.earnedAt = new Date();
      newlyEarned.push(m);
    } else if (current > 0 && m.status === 'locked') {
      m.status = 'in_progress';
    }
    await m.save();
  }

  return { milestones: await MilestoneReward.findAll({ where: { user: userId }, order: [['targetValue', 'ASC']] }), newlyEarned };
}

/** Get all milestones for a user. */
async function getAllMilestones(userId) {
  return MilestoneReward.findAll({ where: { user: userId }, order: [['milestoneType', 'ASC'], ['targetValue', 'ASC']] });
}

/** Claim a reward. */
async function claimReward(userId, milestoneId) {
  const m = await MilestoneReward.findOne({ where: { id: milestoneId, user: userId } });
  if (!m || m.status !== 'earned') return null;
  m.status = 'claimed';
  m.claimedAt = new Date();
  await m.save();
  // Award XP if applicable
  if (m.rewardType === 'xp' && m.rewardValue > 0) {
    const user = await User.findByPk(userId);
    if (user) { user.xp = (user.xp || 0) + m.rewardValue; await user.save(); }
  }
  return m;
}

/** Get summary stats. */
async function getRewardStats(userId) {
  const all = await MilestoneReward.findAll({ where: { user: userId } });
  return {
    total: all.length,
    earned: all.filter((m) => m.status === 'earned').length,
    claimed: all.filter((m) => m.status === 'claimed').length,
    inProgress: all.filter((m) => m.status === 'in_progress').length,
    locked: all.filter((m) => m.status === 'locked').length,
    totalXpEarned: all.filter((m) => m.status === 'claimed' && m.rewardType === 'xp').reduce((s, m) => s + m.rewardValue, 0),
    byTier: {
      bronze: all.filter((m) => m.tier === 'bronze' && (m.status === 'earned' || m.status === 'claimed')).length,
      silver: all.filter((m) => m.tier === 'silver' && (m.status === 'earned' || m.status === 'claimed')).length,
      gold: all.filter((m) => m.tier === 'gold' && (m.status === 'earned' || m.status === 'claimed')).length,
      platinum: all.filter((m) => m.tier === 'platinum' && (m.status === 'earned' || m.status === 'claimed')).length,
    },
  };
}

module.exports = { initMilestones, evaluateMilestones, getAllMilestones, claimReward, getRewardStats, MILESTONE_TEMPLATES };
