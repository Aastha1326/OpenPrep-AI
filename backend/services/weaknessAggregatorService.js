const { Op, fn, col } = require('sequelize');
const Topic = require('../models/Topic');
const Progress = require('../models/Progress');
const QuizAttempt = require('../models/QuizAttempt');
const StudyPlan = require('../models/StudyPlan');
const geminiService = require('./geminiService');

/**
 * Aggregates quiz performance metrics for a user and updates topic mastery status.
 * Categories:
 * - 'Weak':   average score < 50%
 * - 'Medium': average score 50% - 80%
 * - 'Strong': average score > 80%
 */
exports.aggregateUserWeakness = async (userId) => {
  try {
    // 1. Fetch user's topics
    const userTopics = await Topic.findAll({ where: { user: userId } });
    if (!userTopics || userTopics.length === 0) {
      return { updatedCount: 0, weakTopics: [] };
    }

    const weakTopicsList = [];
    const topicAccuracyMap = {};

    for (const topic of userTopics) {
      // Find progress / quiz attempts associated with this topic
      const progressList = await Progress.findAll({
        where: { user: userId, topic: topic.id }
      });

      let totalScoreSum = 0;
      let scoreCount = 0;

      progressList.forEach((p) => {
        if (Array.isArray(p.quizScores)) {
          p.quizScores.forEach((qs) => {
            if (typeof qs.score === 'number') {
              totalScoreSum += qs.score;
              scoreCount++;
            }
          });
        }
      });

      if (scoreCount > 0) {
        const avgScore = Math.round(totalScoreSum / scoreCount);
        topicAccuracyMap[topic.id] = { name: topic.name, avgScore };

        let newStatus = 'Medium';
        if (avgScore < 50) {
          newStatus = 'Weak';
          weakTopicsList.push(topic);
        } else if (avgScore > 80) {
          newStatus = 'Strong';
        } else {
          newStatus = 'Medium';
        }

        if (topic.status !== newStatus) {
          topic.status = newStatus;
          await topic.save();
        }
      } else if (topic.status === 'Weak') {
        weakTopicsList.push(topic);
      }
    }

    return {
      updatedCount: Object.keys(topicAccuracyMap).length,
      weakTopics: weakTopicsList,
      topicAccuracyMap,
    };
  } catch (error) {
    console.error('Error in aggregateUserWeakness:', error);
    throw error;
  }
};

/**
 * Calls LLM Gemini API to get actionable recommendations based on weak topics & performance.
 */
exports.getLLMWeaknessAnalysis = async (userId) => {
  try {
    const { weakTopics, topicAccuracyMap } = await exports.aggregateUserWeakness(userId);
    
    // Fetch recent quiz attempts summary
    const recentAttempts = await QuizAttempt.findAll({
      where: { user: userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const attemptsSummary = {
      weakTopicNames: weakTopics.map((t) => t.name),
      topicAccuracy: topicAccuracyMap,
      attemptScores: recentAttempts.map((a) => a.score),
    };

    const aiAnalysis = await geminiService.analyzePerformanceAndRecommend(attemptsSummary);
    return {
      weakTopics: weakTopics.map((t) => ({ id: t.id, name: t.name, status: t.status })),
      aiAnalysis,
    };
  } catch (error) {
    console.error('Error in getLLMWeaknessAnalysis:', error);
    throw error;
  }
};

/**
 * Reschedules active study plan by boosting allocated daily study hours/duration (+50%)
 * for daily tasks associated with 'Weak' topics.
 */
exports.rescheduleAdaptivePlanner = async (userId) => {
  try {
    const activePlan = await StudyPlan.findOne({
      where: { user: userId, status: 'active' }
    });

    if (!activePlan) return null;

    const weakTopics = await Topic.findAll({
      where: { user: userId, status: 'Weak' }
    });

    const weakTopicIds = new Set(weakTopics.map((t) => t.id));
    const weakTopicNames = new Set(weakTopics.map((t) => t.name.toLowerCase().trim()));

    let updatedCount = 0;
    const dailyGoals = JSON.parse(JSON.stringify(activePlan.dailyGoals || []));

    for (const goal of dailyGoals) {
      if (Array.isArray(goal.tasks)) {
        for (const task of goal.tasks) {
          const isWeakById = task.topic && weakTopicIds.has(task.topic);
          const isWeakByName = task.title && Array.from(weakTopicNames).some(name => task.title.toLowerCase().includes(name));

          if (isWeakById || isWeakByName) {
            // Boost duration by 50% (e.g. 60m -> 90m) for weak topics
            const originalDuration = task.duration || 60;
            task.duration = Math.round(originalDuration * 1.5);
            task.isWeaknessBoosted = true;
            updatedCount++;
          }
        }
      }
    }

    if (updatedCount > 0) {
      activePlan.dailyGoals = dailyGoals;
      await activePlan.save();
    }

    return {
      rescheduledPlanId: activePlan.id,
      boostedTasksCount: updatedCount,
    };
  } catch (error) {
    console.error('Error in rescheduleAdaptivePlanner:', error);
    throw error;
  }
};
