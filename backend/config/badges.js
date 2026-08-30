const BADGES = {
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day daily study streak',
    icon: 'Flame',
    category: 'streak',
    criteriaType: 'streak_days',
    criteriaThreshold: 7,
    pointsValue: 150,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Achieve a 100% score on any quiz',
    icon: 'Brain',
    category: 'quiz',
    criteriaType: 'perfect_quizzes',
    criteriaThreshold: 1,
    pointsValue: 100,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`
  },
  INTERVIEW_ACE: {
    id: 'interview_ace',
    name: 'Interview Ace',
    description: 'Score 85%+ in a live collaborative interview room session',
    icon: 'Award',
    category: 'interview',
    criteriaType: 'high_interview_score',
    criteriaThreshold: 85,
    pointsValue: 200,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`
  },
  CARD_COLLECTOR: {
    id: 'card_collector',
    name: 'Card Collector',
    description: 'Create 50 or more custom flashcards',
    icon: 'Book',
    category: 'flashcard',
    criteriaType: 'flashcards_created',
    criteriaThreshold: 50,
    pointsValue: 120,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  },
  SHARPSHOOTER: {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Complete 5 quizzes with score > 80%',
    icon: 'Target',
    category: 'quiz',
    criteriaType: 'quizzes_completed',
    criteriaThreshold: 5,
    pointsValue: 180,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log 30+ minutes of focus time in morning sessions',
    icon: 'Sun',
    category: 'study',
    criteriaType: 'focus_minutes',
    criteriaThreshold: 30,
    pointsValue: 90,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
  },
  CENTURY_CLUB: {
    id: 'century_club',
    name: 'Century Club',
    description: 'Review 100 flashcards across your decks',
    icon: 'CheckSquare',
    category: 'flashcard',
    criteriaType: 'flashcards_reviewed',
    criteriaThreshold: 100,
    pointsValue: 150,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 60+ minutes of focus time in late study sessions',
    icon: 'Moon',
    category: 'study',
    criteriaType: 'focus_minutes',
    criteriaThreshold: 60,
    pointsValue: 110,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
  },
  STUDY_MARATHON: {
    id: 'study_marathon',
    name: 'Study Marathon',
    description: 'Accumulate 300+ total minutes of study focus time',
    icon: 'Clock',
    category: 'study',
    criteriaType: 'focus_minutes',
    criteriaThreshold: 300,
    pointsValue: 250,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  },
  GRANDMASTER: {
    id: 'grandmaster',
    name: 'Grandmaster',
    description: 'Earn 1000+ total gamification points',
    icon: 'Crown',
    category: 'achievement',
    criteriaType: 'total_points',
    criteriaThreshold: 1000,
    pointsValue: 500,
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>`
  }
};

module.exports = {
  BADGES,
  BADGE_LIST: Object.values(BADGES)
};
