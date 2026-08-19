'use strict';
/**
 * Demo data seeder for local development.
 *
 * Seeds a demo student account (demo@openprep.ai / password123) together
 * with realistic sample exams, subjects, topics, notes, and flashcard decks
 * so `docker-compose up` (or `npx sequelize-cli db:seed:all`) gives a fully
 * populated, explorable development database on first boot.
 *
 * ⚠️ DEVELOPMENT ONLY — these credentials and records must never be used in
 * production. The demo account is a plain-text, low-entropy password.
 */
const bcrypt = require('bcryptjs');

const DEMO_USER_ID = '333e4567-e89b-12d3-a456-426614174000';
const DEMO_EXAM_ID = '444e4567-e89b-12d3-a456-426614174000';
const SUBJECT_CALC_ID = '555e4567-e89b-12d3-a456-426614174000';
const SUBJECT_ALG_ID = '555e4567-e89b-12d3-a456-426614174001';
const TOPIC_LIMITS_ID = '666e4567-e89b-12d3-a456-426614174000';
const TOPIC_DERIVS_ID = '666e4567-e89b-12d3-a456-426614174001';
const NOTE_CHEAT_ID = '777e4567-e89b-12d3-a456-426614174000';
const NOTE_GUIDE_ID = '777e4567-e89b-12d3-a456-426614174001';
const DECK_CALC_ID = '888e4567-e89b-12d3-a456-426614174000';
const FLASHCARD_1_ID = '999e4567-e89b-12d3-a456-426614174000';
const FLASHCARD_2_ID = '999e4567-e89b-12d3-a456-426614174001';

module.exports = {
  up: async (queryInterface) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const now = new Date();

    // 1. Demo student
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          id: DEMO_USER_ID,
          name: 'Demo Student',
          email: 'demo@openprep.ai',
          password: hashedPassword,
          role: 'student',
          provider: 'local',
          authProvider: 'local',
          streakCount: 5,
          studyHours: 15.5,
          avatar: '',
          isEmailVerified: true,
          receiveWeeklyDigest: true,
          dailyReminderTime: '09:00',
          examCountdownPreferences: JSON.stringify({
            targetExamDate: null,
            targetScore: null,
            milestones: [],
          }),
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // 2. Exams
    await queryInterface.bulkInsert(
      'Exams',
      [
        {
          id: DEMO_EXAM_ID,
          name: 'AP Calculus BC',
          description: 'Advanced Placement Calculus BC exam preparation track',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          user: DEMO_USER_ID,
          isBundle: false,
          targetExamType: 'AP',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // 3. Subjects
    await queryInterface.bulkInsert(
      'Subjects',
      [
        {
          id: SUBJECT_CALC_ID,
          name: 'Calculus',
          description: 'Differential and Integral Calculus, series and polar equations',
          exam: DEMO_EXAM_ID,
          user: DEMO_USER_ID,
          weightage: 100,
          isPublic: false,
          cloneCount: 0,
          rating: 0.0,
          ratingsCount: 0,
          ratingCount: 0,
          starCount: 0,
          tags: 'calculus,math',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: SUBJECT_ALG_ID,
          name: 'Algebra',
          description: 'Linear equations, functions, and problem solving',
          exam: DEMO_EXAM_ID,
          user: DEMO_USER_ID,
          weightage: 50,
          isPublic: false,
          cloneCount: 0,
          rating: 0.0,
          ratingsCount: 0,
          ratingCount: 0,
          starCount: 0,
          tags: 'algebra,math',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // 4. Topics
    await queryInterface.bulkInsert(
      'Topics',
      [
        {
          id: TOPIC_LIMITS_ID,
          name: 'Limits & Continuity',
          description: 'Understanding limits graphically, analytically, and continuity definitions',
          subject: SUBJECT_CALC_ID,
          status: 'Medium',
          weightage: 15,
          user: DEMO_USER_ID,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: TOPIC_DERIVS_ID,
          name: 'Derivatives',
          description: 'Definition of derivative, differentiation rules, chain rule, implicit differentiation',
          subject: SUBJECT_CALC_ID,
          status: 'Weak',
          weightage: 30,
          user: DEMO_USER_ID,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // 5. Notes
    await queryInterface.bulkInsert(
      'Notes',
      [
        {
          id: NOTE_CHEAT_ID,
          title: 'Limits & Continuity Summary Cheat Sheet',
          content:
            "Important rules:\n1. Direct substitution first.\n2. If indeterminate form 0/0, factor, rationalize, or use L'Hopital's rule.\n3. Continuous means limit exists and equals f(c).\n4. Intermediate Value Theorem: If f is continuous on [a, b], it takes all values between f(a) and f(b).",
          subject: SUBJECT_CALC_ID,
          topic: TOPIC_LIMITS_ID,
          isPublic: true,
          category: 'Cheat Sheet',
          downloadsCount: 0,
          user: DEMO_USER_ID,
          tags: ['limits', 'continuity'],
          isCollaborative: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: NOTE_GUIDE_ID,
          title: 'Common Derivative Shortcuts',
          content:
            "Standard formulas:\n- d/dx [x^n] = n*x^(n-1)\n- d/dx [sin x] = cos x\n- d/dx [cos x] = -sin x\n- d/dx [tan x] = sec^2 x\n- d/dx [ln x] = 1/x\n- Product rule: u'v + uv'\n- Quotient rule: (u'v - uv') / v^2",
          subject: SUBJECT_CALC_ID,
          topic: TOPIC_DERIVS_ID,
          isPublic: true,
          category: 'Study Guide',
          downloadsCount: 0,
          user: DEMO_USER_ID,
          tags: ['derivatives'],
          isCollaborative: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    // 6. Flashcard deck + flashcards
    await queryInterface.bulkInsert(
      'FlashcardDecks',
      [
        {
          id: DECK_CALC_ID,
          name: 'AP Calculus Essentials',
          subject: SUBJECT_CALC_ID,
          user: DEMO_USER_ID,
          isPublic: true,
          cloneCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'Flashcards',
      [
        {
          id: FLASHCARD_1_ID,
          user: DEMO_USER_ID,
          subject: SUBJECT_CALC_ID,
          topic: TOPIC_LIMITS_ID,
          deckId: DECK_CALC_ID,
          front: 'What is the definition of continuity at a point x = c?',
          back: 'A function f(x) is continuous at x = c if and only if f(c) is defined, the limit of f(x) as x approaches c exists, and the limit of f(x) as x approaches c equals f(c).',
          interval: 3,
          repetitions: 2,
          efactor: 2.6,
          nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          tags: ['continuity'],
          difficulty: 'Medium',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: FLASHCARD_2_ID,
          user: DEMO_USER_ID,
          subject: SUBJECT_CALC_ID,
          topic: TOPIC_DERIVS_ID,
          deckId: DECK_CALC_ID,
          front: 'What is the derivative of e^(x)?',
          back: 'e^(x) (The derivative of the natural exponential function is itself)',
          interval: 1,
          repetitions: 1,
          efactor: 2.5,
          nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          tags: ['derivatives'],
          difficulty: 'Easy',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    const ids = [
      FLASHCARD_1_ID,
      FLASHCARD_2_ID,
      DECK_CALC_ID,
      NOTE_CHEAT_ID,
      NOTE_GUIDE_ID,
      TOPIC_LIMITS_ID,
      TOPIC_DERIVS_ID,
      SUBJECT_CALC_ID,
      SUBJECT_ALG_ID,
      DEMO_EXAM_ID,
      DEMO_USER_ID,
    ];

    await queryInterface.bulkDelete('Flashcards', { id: [FLASHCARD_1_ID, FLASHCARD_2_ID] }, {});
    await queryInterface.bulkDelete('FlashcardDecks', { id: DECK_CALC_ID }, {});
    await queryInterface.bulkDelete('Notes', { id: [NOTE_CHEAT_ID, NOTE_GUIDE_ID] }, {});
    await queryInterface.bulkDelete('Topics', { id: [TOPIC_LIMITS_ID, TOPIC_DERIVS_ID] }, {});
    await queryInterface.bulkDelete('Subjects', { id: [SUBJECT_CALC_ID, SUBJECT_ALG_ID] }, {});
    await queryInterface.bulkDelete('Exams', { id: DEMO_EXAM_ID }, {});
    await queryInterface.bulkDelete('Users', { id: DEMO_USER_ID }, {});
    return ids;
  },
};
