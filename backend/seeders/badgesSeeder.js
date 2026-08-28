const Badge = require('../models/Badge');

const defaultBadges = [
  // Streak Badges
  { name: 'Ignition', description: 'Maintain a 3-day study streak', category: 'STREAK', icon: 'Flame', tier: 'Bronze', xpReward: 50, conditionType: 'STREAK_DAYS', conditionValue: 3 },
  { name: 'Habit Builder', description: 'Maintain a 7-day study streak', category: 'STREAK', icon: 'Flame', tier: 'Silver', xpReward: 150, conditionType: 'STREAK_DAYS', conditionValue: 7 },
  { name: 'Unstoppable Momentum', description: 'Maintain a 30-day study streak', category: 'STREAK', icon: 'Flame', tier: 'Gold', xpReward: 500, conditionType: 'STREAK_DAYS', conditionValue: 30 },
  { name: 'Centurion of Focus', description: 'Maintain a 100-day study streak', category: 'STREAK', icon: 'Trophy', tier: 'Diamond', xpReward: 2000, conditionType: 'STREAK_DAYS', conditionValue: 100 },

  // Quiz Badges
  { name: 'First Trial', description: 'Complete your first practice quiz', category: 'QUIZ', icon: 'Award', tier: 'Bronze', xpReward: 50, conditionType: 'QUIZZES_COMPLETED', conditionValue: 1 },
  { name: 'Quiz Veteran', description: 'Complete 25 practice quizzes', category: 'QUIZ', icon: 'Star', tier: 'Silver', xpReward: 250, conditionType: 'QUIZZES_COMPLETED', conditionValue: 25 },
  { name: 'Master of Trivia', description: 'Complete 100 practice quizzes', category: 'QUIZ', icon: 'Trophy', tier: 'Gold', xpReward: 1000, conditionType: 'QUIZZES_COMPLETED', conditionValue: 100 },
  { name: 'Flawless Victory', description: 'Score 100% on 10 consecutive quizzes', category: 'QUIZ', icon: 'Crown', tier: 'Diamond', xpReward: 1500, conditionType: 'PERFECT_QUIZZES', conditionValue: 10 },

  // Study Time Badges
  { name: 'Deep Diver', description: 'Log 5 total hours of focused study', category: 'STUDY_TIME', icon: 'Clock', tier: 'Bronze', xpReward: 75, conditionType: 'STUDY_HOURS', conditionValue: 5 },
  { name: 'Marathon Scholar', description: 'Log 25 total hours of focused study', category: 'STUDY_TIME', icon: 'Hourglass', tier: 'Silver', xpReward: 300, conditionType: 'STUDY_HOURS', conditionValue: 25 },
  { name: 'Grandmaster of Lore', description: 'Log 100 total hours of focused study', category: 'STUDY_TIME', icon: 'BookOpen', tier: 'Gold', xpReward: 1200, conditionType: 'STUDY_HOURS', conditionValue: 100 },

  // Flashcards Mastery
  { name: 'Card Sharp', description: 'Review 50 flashcards using spaced repetition', category: 'MASTERY', icon: 'Layers', tier: 'Bronze', xpReward: 60, conditionType: 'FLASHCARDS_REVIEWED', conditionValue: 50 },
  { name: 'Memory Architect', description: 'Review 500 flashcards using spaced repetition', category: 'MASTERY', icon: 'Brain', tier: 'Silver', xpReward: 400, conditionType: 'FLASHCARDS_REVIEWED', conditionValue: 500 },
  { name: 'Photographic Recall', description: 'Review 2000 flashcards', category: 'MASTERY', icon: 'Sparkles', tier: 'Gold', xpReward: 1500, conditionType: 'FLASHCARDS_REVIEWED', conditionValue: 2000 },

  // Milestone Achievements
  { name: 'First Step', description: 'Complete your first study plan milestone', category: 'ACHIEVEMENT', icon: 'Flag', tier: 'Bronze', xpReward: 100, conditionType: 'MILESTONES_COMPLETED', conditionValue: 1 },
  { name: 'Pacing Well', description: 'Complete 3 study plan milestones', category: 'ACHIEVEMENT', icon: 'TrendingUp', tier: 'Silver', xpReward: 300, conditionType: 'MILESTONES_COMPLETED', conditionValue: 3 },
  { name: 'Milestone Master', description: 'Complete 10 study plan milestones', category: 'ACHIEVEMENT', icon: 'CheckCircle', tier: 'Gold', xpReward: 800, conditionType: 'MILESTONES_COMPLETED', conditionValue: 10 },
  { name: 'Platinum Finisher', description: 'Complete 25 study plan milestones', category: 'ACHIEVEMENT', icon: 'Award', tier: 'Platinum', xpReward: 2000, conditionType: 'MILESTONES_COMPLETED', conditionValue: 25 },
];

async function seedBadges() {
  console.log('Seeding achievement badges...');
  for (const badgeData of defaultBadges) {
    await Badge.findOrCreate({
      where: { name: badgeData.name },
      defaults: badgeData,
    });
  }
  console.log(`Successfully verified ${defaultBadges.length} badge definitions.`);
}

module.exports = { seedBadges, defaultBadges };
