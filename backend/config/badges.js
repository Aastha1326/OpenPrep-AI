const BADGES = {
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day study streak',
    icon: 'Flame'
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Achieve a 100% score on a quiz',
    icon: 'Brain'
  },
  CARD_COLLECTOR: {
    id: 'card_collector',
    name: 'Card Collector',
    description: 'Create 50 flashcards',
    icon: 'Book'
  },
  SHARPSHOOTER: {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Complete 3 consecutive quizzes with a score above 85%',
    icon: 'Target'
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log a study session before 7 AM',
    icon: 'Sun'
  },
  CENTURY_CLUB: {
    id: 'century_club',
    name: 'Century Club',
    description: 'Review 100 flashcards in one session',
    icon: '100'
  },
  PYQ_ANALYST: {
    id: 'pyq_analyst',
    name: 'PYQ Analyst',
    description: 'Analyze 5 PYQ PDFs',
    icon: 'Trophy'
  }
};

module.exports = {
  BADGES,
  BADGE_LIST: Object.values(BADGES)
};
