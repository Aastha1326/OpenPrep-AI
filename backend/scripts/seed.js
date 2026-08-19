const path = require('path');
// Configure dotenv to find the .env file in the backend folder regardless of CWD
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  sequelize,
  User,
  Exam,
  Subject,
  Topic,
  PYQ,
  StudyPlan,
  Quiz,
  QuizAttempt,
  Note,
  Flashcard,
  Progress,
  Feedback,
  ActivityLog,
} = require('../models');

async function seed() {
  // Prevent running in production environment
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL WARNING: Seeding aborted! NODE_ENV is set to production.');
    process.exit(1);
  }

  console.log('Initiating database seeding process...');

  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully.');

    // Check for clean seed command line argument
    const clean = process.argv.includes('--clean') || process.argv.includes('-c');
    if (clean) {
      console.log('Dropping and recreating all database tables (--clean flag detected)...');
      await sequelize.sync({ force: true });
      console.log('All tables recreated successfully.');
    } else {
      console.log('Syncing database schema...');
      await sequelize.sync({ alter: true });
      console.log('Database schema synced successfully.');
    }

    // 1. Create Default Users
    console.log('Seeding Users...');
    const student = await User.create({
      name: 'Demo Student',
      email: 'demo@openprep.ai',
      password: 'password123',
      role: 'student',
      streakCount: 5,
      studyHours: 15.5,
      isEmailVerified: true,
    });

    const admin = await User.create({
      name: 'Demo Admin',
      email: 'admin@openprep.ai',
      password: 'Password123',
      role: 'admin',
      isEmailVerified: true,
    });

    const contributor = await User.create({
      name: 'Demo Contributor',
      email: 'contributor@openprep.ai',
      password: 'Password123',
      role: 'contributor',
      isEmailVerified: true,
    });
    console.log(
      `Created users: student (${student.id}), admin (${admin.id}), contributor (${contributor.id})`
    );

    // 2. Create Exams
    console.log('Seeding Exams...');
    const apCalcExam = await Exam.create({
      name: 'AP Calculus BC',
      description: 'Advanced Placement Calculus BC exam preparation track',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      user: student.id,
    });

    const satExam = await Exam.create({
      name: 'SAT General Prep',
      description: 'Scholastic Assessment Test general preparation course',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      user: student.id,
    });
    console.log('Exams seeded successfully.');

    // 3. Create Subjects
    console.log('Seeding Subjects...');
    const mathSubject = await Subject.create({
      name: 'Calculus',
      description: 'Differential and Integral Calculus, series and polar equations',
      exam: apCalcExam.id,
      user: student.id,
    });

    const satMathSubject = await Subject.create({
      name: 'SAT Math',
      description: 'Algebra, Problem Solving and Data Analysis, Advanced Math, Geometry and Trig',
      exam: satExam.id,
      user: student.id,
    });

    const satVerbalSubject = await Subject.create({
      name: 'SAT Reading & Writing',
      description: 'Command of Evidence, Words in Context, Analysis, Standard English Conventions',
      exam: satExam.id,
      user: student.id,
    });
    console.log('Subjects seeded successfully.');

    // 4. Create Topics
    console.log('Seeding Topics...');
    const topicLimits = await Topic.create({
      name: 'Limits & Continuity',
      description: 'Understanding limits graphically, analytically, and continuity definitions',
      subject: mathSubject.id,
      status: 'Medium',
      weightage: 15,
      user: student.id,
    });

    const topicDerivatives = await Topic.create({
      name: 'Derivatives',
      description:
        'Definition of derivative, differentiation rules, chain rule, implicit differentiation',
      subject: mathSubject.id,
      status: 'Weak',
      weightage: 30,
      user: student.id,
    });

    const topicIntegrals = await Topic.create({
      name: 'Integrals',
      description: 'Riemann sums, definite/indefinite integrals, integration techniques, FTC',
      subject: mathSubject.id,
      status: 'Strong',
      weightage: 35,
      user: student.id,
    });

    const topicAlgebra = await Topic.create({
      name: 'Heart of Algebra',
      description: 'Linear equations, systems of linear equations, and linear functions',
      subject: satMathSubject.id,
      status: 'Strong',
      weightage: 40,
      user: student.id,
    });

    const topicRhetoric = await Topic.create({
      name: 'Rhetoric',
      description: 'Analyzing text structure, purpose, point of view, and arguments',
      subject: satVerbalSubject.id,
      status: 'Weak',
      weightage: 50,
      user: student.id,
    });
    console.log('Topics seeded successfully.');

    // 5. Create Flashcards
    console.log('Seeding Flashcards...');
    await Flashcard.bulkCreate([
      {
        user: student.id,
        subject: mathSubject.id,
        topic: topicLimits.id,
        front: 'What is the definition of continuity at a point x = c?',
        back: 'A function f(x) is continuous at x = c if and only if f(c) is defined, the limit of f(x) as x approaches c exists, and the limit of f(x) as x approaches c equals f(c).',
        interval: 3,
        repetitions: 2,
        efactor: 2.6,
        nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        user: student.id,
        subject: mathSubject.id,
        topic: topicLimits.id,
        front: 'What is the Squeeze Theorem?',
        back: 'If f(x) <= g(x) <= h(x) for all x in an open interval containing c (except possibly at c itself) and the limits of f(x) and h(x) as x approaches c are both equal to L, then the limit of g(x) as x approaches c is also L.',
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
        nextReviewDate: new Date(),
      },
      {
        user: student.id,
        subject: mathSubject.id,
        topic: topicDerivatives.id,
        front: 'What is the Chain Rule for differentiation?',
        back: "d/dx [f(g(x))] = f'(g(x)) * g'(x)",
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
        nextReviewDate: new Date(),
      },
      {
        user: student.id,
        subject: mathSubject.id,
        topic: topicDerivatives.id,
        front: 'What is the derivative of e^(x)?',
        back: 'e^(x) (The derivative of the natural exponential function is itself)',
        interval: 1,
        repetitions: 1,
        efactor: 2.5,
        nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        user: student.id,
        subject: mathSubject.id,
        topic: topicIntegrals.id,
        front: 'State the Fundamental Theorem of Calculus (Part 1).',
        back: "If f is continuous on [a, b] and F(x) = integral of f(t)dt from a to x, then F'(x) = f(x).",
        interval: 5,
        repetitions: 3,
        efactor: 2.7,
        nextReviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log('Flashcards seeded successfully.');

    // 6. Create Notes
    console.log('Seeding Notes...');
    const noteLimits = await Note.create({
      title: 'Limits & Continuity Summary Cheat Sheet',
      content:
        "Important rules:\n1. Direct substitution first.\n2. If indeterminate form 0/0, factor, rationalize, or use L'Hopital's rule.\n3. Continuous means limit exists and equals f(c).\n4. Intermediate Value Theorem: If f is continuous on [a, b], it takes all values between f(a) and f(b).",
      subject: mathSubject.id,
      topic: topicLimits.id,
      isPublic: true,
      category: 'Cheat Sheet',
      user: student.id,
    });

    const noteDerivatives = await Note.create({
      title: 'Common Derivative Shortcuts',
      content:
        "Standard formulas:\n- d/dx [x^n] = n*x^(n-1)\n- d/dx [sin x] = cos x\n- d/dx [cos x] = -sin x\n- d/dx [tan x] = sec^2 x\n- d/dx [ln x] = 1/x\n- Product rule: u'v + uv'\n- Quotient rule: (u'v - uv') / v^2",
      subject: mathSubject.id,
      topic: topicDerivatives.id,
      isPublic: true,
      category: 'Study Guide',
      user: student.id,
    });
    console.log('Notes seeded successfully.');

    // 7. Create Quizzes
    console.log('Seeding Quizzes...');
    const quizLimits = await Quiz.create({
      title: 'Limits & Continuity Practice Quiz',
      subject: mathSubject.id,
      topic: topicLimits.id,
      type: 'AI_Generated',
      createdBy: student.id,
      questions: [
        {
          _id: 'q-limits-1',
          questionText: 'Evaluate the limit of (x^2 - 4)/(x - 2) as x approaches 2.',
          options: ['0', '2', '4', 'Undefined'],
          correctAnswer: 2, // Index 2 ('4')
          explanation:
            'Factor the numerator: (x-2)(x+2)/(x-2) = x+2. As x approaches 2, x+2 approaches 4.',
        },
        {
          _id: 'q-limits-2',
          questionText:
            'If a function f(x) is continuous at x = 3, which of the following MUST be true?',
          options: [
            "f'(3) exists",
            'f(3) is defined and the limit of f(x) as x approaches 3 equals f(3)',
            'f(x) has a horizontal tangent line at x = 3',
            'f(x) is a polynomial function',
          ],
          correctAnswer: 1, // Index 1
          explanation:
            'By definition, continuity at x=c requires the function to be defined at c, the limit to exist at c, and the limit to equal the function value f(c).',
        },
      ],
    });

    const quizDerivatives = await Quiz.create({
      title: 'Derivatives Fundamentals Quiz',
      subject: mathSubject.id,
      topic: topicDerivatives.id,
      type: 'Manual',
      createdBy: student.id,
      questions: [
        {
          _id: 'q-deriv-1',
          questionText: 'Find the derivative of f(x) = sin(x^2).',
          options: ['2x * cos(x^2)', 'cos(x^2)', '2 * sin(x)', '-2x * cos(x^2)'],
          correctAnswer: 0, // Index 0
          explanation:
            'Using the chain rule: d/dx[sin(u)] = cos(u) * du/dx. Here, u = x^2, so du/dx = 2x. Thus, the derivative is cos(x^2) * 2x.',
        },
      ],
    });
    console.log('Quizzes seeded successfully.');

    // 8. Create QuizAttempts
    console.log('Seeding Quiz Attempts...');
    const attemptLimits = await QuizAttempt.create({
      user: student.id,
      quiz: quizLimits.id,
      score: 100,
      totalQuestions: 2,
      timeSpent: 45,
      answers: [
        { questionId: 'q-limits-1', selectedAnswer: 2, isCorrect: true },
        { questionId: 'q-limits-2', selectedAnswer: 1, isCorrect: true },
      ],
      strongTopics: [topicLimits.id],
      weakTopics: [],
    });

    const attemptDerivatives = await QuizAttempt.create({
      user: student.id,
      quiz: quizDerivatives.id,
      score: 0,
      totalQuestions: 1,
      timeSpent: 30,
      answers: [{ questionId: 'q-deriv-1', selectedAnswer: 1, isCorrect: false }],
      strongTopics: [],
      weakTopics: [topicDerivatives.id],
    });
    console.log('Quiz attempts seeded successfully.');

    // 9. Create Progress Entries
    console.log('Seeding Progress records...');
    await Progress.create({
      user: student.id,
      subject: mathSubject.id,
      topic: topicLimits.id,
      completionPercentage: 100,
      studyHours: 4.5,
      quizScores: [
        { attempt: attemptLimits.id, score: 100, date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      ],
      flashcardsMastered: 2,
    });

    await Progress.create({
      user: student.id,
      subject: mathSubject.id,
      topic: topicDerivatives.id,
      completionPercentage: 20,
      studyHours: 1.5,
      quizScores: [{ attempt: attemptDerivatives.id, score: 0, date: new Date() }],
      flashcardsMastered: 0,
    });

    await Progress.create({
      user: student.id,
      subject: mathSubject.id,
      topic: topicIntegrals.id,
      completionPercentage: 0,
      studyHours: 0,
      quizScores: [],
      flashcardsMastered: 0,
    });
    console.log('Progress records seeded successfully.');

    // 10. Create Activity Logs
    console.log('Seeding Activity Logs...');
    await ActivityLog.bulkCreate([
      {
        user: student.id,
        activityType: 'study_plan_create',
        description: 'Generated a new customized study plan for AP Calculus BC',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        user: student.id,
        activityType: 'note_upload',
        description: 'Uploaded note: "Limits & Continuity Summary Cheat Sheet"',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        user: student.id,
        activityType: 'quiz_attempt',
        description: 'Completed practice quiz: "Limits & Continuity Practice Quiz" with score 100%',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        user: student.id,
        activityType: 'quiz_attempt',
        description: 'Completed practice quiz: "Derivatives Fundamentals Quiz" with score 0%',
        createdAt: new Date(),
      },
    ]);
    console.log('Activity logs seeded successfully.');

    // 11. Create Study Plans
    console.log('Seeding Study Plan...');
    const studyPlanStart = new Date();
    const studyPlanEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Build a mock list of daily goals for 5 days
    const dailyGoals = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      let tasks = [];
      if (i === 0) {
        tasks = [
          {
            title: 'Read Limits & Continuity Cheat Sheet',
            completed: true,
            topic: topicLimits.id,
            duration: 30,
          },
          {
            title: 'Attempt Limits & Continuity Quiz',
            completed: true,
            topic: topicLimits.id,
            duration: 15,
          },
        ];
      } else if (i === 1) {
        tasks = [
          {
            title: 'Review derivatives notes',
            completed: false,
            topic: topicDerivatives.id,
            duration: 40,
          },
          {
            title: 'Attempt derivatives quiz',
            completed: false,
            topic: topicDerivatives.id,
            duration: 20,
          },
        ];
      } else if (i === 2) {
        tasks = [
          {
            title: 'Learn derivative chain rule and implicit differentiation',
            completed: false,
            topic: topicDerivatives.id,
            duration: 60,
          },
        ];
      } else {
        tasks = [
          {
            title: 'Introduction to Integrals & Riemann Sums',
            completed: false,
            topic: topicIntegrals.id,
            duration: 50,
          },
        ];
      }

      dailyGoals.push({
        date: date.toISOString().split('T')[0],
        tasks,
      });
    }

    await StudyPlan.create({
      exam: apCalcExam.id,
      user: student.id,
      startDate: studyPlanStart,
      endDate: studyPlanEnd,
      dailyGoals,
      status: 'active',
    });
    console.log('Study Plan seeded successfully.');

    // 12. Create Feedback
    console.log('Seeding Feedback...');
    await Feedback.create({
      title: 'Dark Mode UI issue on Quiz page',
      description:
        'The background of options becomes light gray, making white text unreadable when dark mode is enabled on screen resolutions below 768px.',
      type: 'bug',
      status: 'open',
      upvotes: [student.id, contributor.id],
      user: student.id,
    });

    await Feedback.create({
      title: 'Export flashcards as Anki deck',
      description:
        'It would be amazing if we could export our spaced repetition flashcards as an .apkg file so that we can study them inside Anki.',
      type: 'feature_request',
      status: 'planned',
      upvotes: [contributor.id],
      user: contributor.id,
    });
    console.log('Feedback seeded successfully.');

    console.log('\n=========================================');
    console.log('Database seeding completed successfully!');
    console.log('=========================================');
    console.log('Demo Login Credentials (DEVELOPMENT ONLY):');
    console.log('  - Student:     demo@openprep.ai     / password123');
    console.log('  - Admin:       admin@openprep.ai     / Password123');
    console.log('  - Contributor: contributor@openprep.ai / Password123');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

seed();
