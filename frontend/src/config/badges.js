import { Flame, Brain, Book, Target, Sun, Trophy, Award } from 'lucide-react';

export const BADGE_ICONS = {
  Flame,
  Brain,
  Book,
  Target,
  Sun,
  '100': Award, // Can't easily use a lucide icon for 100, so we use Award
  Trophy
};

export const BADGE_LIST = [
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day study streak',
    icon: 'Flame'
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Achieve a 100% score on a quiz',
    icon: 'Brain'
  },
  {
    id: 'card_collector',
    name: 'Card Collector',
    description: 'Create 50 flashcards',
    icon: 'Book'
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Complete 3 consecutive quizzes with a score above 85%',
    icon: 'Target'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log a study session before 7 AM',
    icon: 'Sun'
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Review 100 flashcards in one session',
    icon: '100'
  },
  {
    id: 'pyq_analyst',
    name: 'PYQ Analyst',
    description: 'Analyze 5 PYQ PDFs',
    icon: 'Trophy'
  }
];
