const { sequelize } = require('../config/db');
const {
  User,
  Exam,
  Subject,
  Topic,
  Quiz,
  QuizAttempt,
  ActivityLog,
} = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const EXAMS_LIST = ['JEE', 'NEET', 'GATE', 'UPSC', 'GRE', 'SAT', 'CAT', 'MCAT', 'LSAT', 'GMAT', 'TOEFL', 'IELTS', 'NDA', 'CDS', 'CLAT', 'USMLE', 'NCLEX', 'AFCAT', 'IBPS', 'SBI PO'];

const SUBJECTS_MAP = {
  JEE: ['Mathematics', 'Physics', 'Chemistry'],
  NEET: ['Biology', 'Physics', 'Chemistry'],
  GATE: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'],
  UPSC: ['History', 'Geography', 'Polity', 'Economics'],
  GRE: ['Quantitative Reasoning', 'Verbal Reasoning', 'Analytical Writing'],
  SAT: ['Evidence-Based Reading', 'Writing and Language', 'Math'],
};

const TOPICS_MAP = {
  Mathematics: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Probability'],
  Physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'],
  Biology: ['Genetics', 'Cell Biology', 'Human Physiology', 'Ecology'],
  History: ['Ancient India', 'Medieval India', 'Modern History', 'World History'],
  Geography: ['Physical Geography', 'Human Geography', 'Indian Geography'],
  Polity: ['Constitution', 'Parliament', 'Judiciary', 'Local Self Government'],
  Economics: ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Budgeting'],
  'Quantitative Reasoning': ['Arithmetic', 'Algebra', 'Geometry', 'Data Analysis'],
  'Verbal Reasoning': ['Reading Comprehension', 'Sentence Equivalence', 'Text Completion'],
};

// Generic MCQs template with LaTeX formulas
const MCQ_TEMPLATES = [
  {
    questionText: 'Find the limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x}$',
    options: ['0', '1', '$\\infty$', 'Undefined'],
    correctAnswer: 1,
    explanation: 'By L\'Hopital\'s rule or standard trigonometric limit theorem, $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.'
  },
  {
    questionText: 'What is the derivative of $f(x) = e^{2x}$?',
    options: ['$e^{2x}$', '$2e^{2x}$', '$\\frac{1}{2}e^{2x}$', '$2xe^{2x}$'],
    correctAnswer: 1,
    explanation: 'Using the chain rule, $\\frac{d}{dx}[e^{2x}] = e^{2x} \\cdot \\frac{d}{dx}[2x] = 2e^{2x}$.'
  },
  {
    questionText: 'Calculate the integral: $\\int_{0}^{1} x^2 \\, dx$',
    options: ['1', '$\\frac{1}{2}$', '$\\frac{1}{3}$', '$\\frac{1}{4}$'],
    correctAnswer: 2,
    explanation: '$\\int x^2 \\, dx = \\frac{x^3}{3}$. Evaluating from 0 to 1 yields $\\frac{1^3}{3} - 0 = \\frac{1}{3}$.'
  },
  {
    questionText: 'Identify the value of $\\log_2 8$:',
    options: ['2', '3', '4', '8'],
    correctAnswer: 1,
    explanation: 'Since $2^3 = 8$, the logarithm base 2 of 8 is 3.'
  }
];

async function seed() {
  console.log('🚀 Starting Synthetic Data Seeding Pipeline...');
  const startTime = Date.now();

  try {
    // 1. Sync / clean up tables (in-order to avoid foreign key conflicts)
    await sequelize.query('TRUNCATE TABLE "ActivityLogs", "QuizAttempts", "Quizzes", "Topics", "Subjects", "Exams", "Users" CASCADE;');
    console.log('✅ Cleaned up old relational tables.');

    // 2. Generate 500+ Users (1 Admin, 20 Educators/Contributors, 480 Students)
    console.log('👥 Generating 500+ user records...');
    const hashedPassword = await bcrypt.hash('password123', 8);
    const usersData = [];
    
    // Admin
    usersData.push({
      id: crypto.randomUUID(),
      name: 'Admin Master',
      email: 'admin@openprep.ai',
      password: hashedPassword,
      role: 'admin',
    });

    // Contributors
    for (let i = 1; i <= 20; i++) {
      usersData.push({
        id: crypto.randomUUID(),
        name: `Educator ${i}`,
        email: `educator${i}@openprep.ai`,
        password: hashedPassword,
        role: 'contributor',
      });
    }

    // Students
    for (let i = 1; i <= 480; i++) {
      usersData.push({
        id: crypto.randomUUID(),
        name: `Student ${i}`,
        email: `student${i}@openprep.ai`,
        password: hashedPassword,
        role: 'student',
      });
    }

    const users = await User.bulkCreate(usersData);
    console.log(`✅ Bulk created ${users.length} Users.`);

    const studentUsers = users.filter(u => u.role === 'student');
    const contributorUsers = users.filter(u => u.role === 'contributor');
    const adminUser = users.find(u => u.role === 'admin');

    // 3. Generate 20 Exam Curricula
    console.log('📚 Generating 20 complete Exam curricula...');
    const examsData = [];
    for (let i = 0; i < EXAMS_LIST.length; i++) {
      examsData.push({
        id: crypto.randomUUID(),
        name: EXAMS_LIST[i],
        description: `Official preparation syllabus for ${EXAMS_LIST[i]} examinations.`,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
        user: adminUser.id,
      });
    }
    const exams = await Exam.bulkCreate(examsData);
    console.log(`✅ Bulk created ${exams.length} Exams.`);

    // 4. Generate Subjects and Topics
    console.log('📂 Mapping Subjects and Topics...');
    const subjectsData = [];
    const topicsData = [];

    for (const exam of exams) {
      const subjectNames = SUBJECTS_MAP[exam.name] || ['General Knowledge', 'Aptitude'];
      for (const subName of subjectNames) {
        const subjectId = crypto.randomUUID();
        subjectsData.push({
          id: subjectId,
          name: subName,
          description: `Syllabus topics for ${subName} under ${exam.name}`,
          exam: exam.id,
          user: adminUser.id,
        });

        const topicNames = TOPICS_MAP[subName] || ['Introduction', 'Advanced Applications'];
        for (const topicName of topicNames) {
          topicsData.push({
            id: crypto.randomUUID(),
            name: topicName,
            description: `Core concepts of ${topicName}`,
            subject: subjectId,
            user: adminUser.id,
          });
        }
      }
    }

    const subjects = await Subject.bulkCreate(subjectsData);
    const topics = await Topic.bulkCreate(topicsData);
    console.log(`✅ Bulk created ${subjects.length} Subjects.`);
    console.log(`✅ Bulk created ${topics.length} Topics.`);

    // 5. Generate 5,000+ MCQs in Quizzes
    // We will create 250 quizzes, each with 20 MCQs = 5,000 MCQs total!
    console.log('📝 Generating 5,000+ realistic MCQs...');
    const quizzesData = [];

    for (let i = 1; i <= 250; i++) {
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Generate 20 MCQs for this quiz
      const questions = [];
      for (let q = 1; q <= 20; q++) {
        const template = MCQ_TEMPLATES[q % MCQ_TEMPLATES.length];
        questions.push({
          id: crypto.randomUUID(),
          questionText: `[Q-${i}-${q}] ${template.questionText}`,
          options: template.options,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation,
        });
      }

      const creator = contributorUsers[i % contributorUsers.length];

      quizzesData.push({
        id: crypto.randomUUID(),
        title: `Mock Quiz Set #${i}`,
        description: `Comprehensive practice set covering syllabus concepts.`,
        subject: randomTopic.subject,
        topic: randomTopic.id,
        createdBy: creator.id,
        questions,
      });
    }

    const quizzes = await Quiz.bulkCreate(quizzesData);
    console.log(`✅ Bulk created ${quizzes.length} Quizzes (representing 5,000+ MCQs).`);

    // 6. Generate 10,000+ historical Quiz Attempts
    console.log('📊 Simulating 10,000+ historical quiz attempts...');
    const attemptsData = [];
    const activityLogsData = [];

    for (let i = 1; i <= 10000; i++) {
      const student = studentUsers[i % studentUsers.length];
      const quiz = quizzes[i % quizzes.length];
      const score = Math.floor(Math.random() * 41) + 60; // score between 60% and 100%

      attemptsData.push({
        id: crypto.randomUUID(),
        user: student.id,
        quiz: quiz.id,
        score,
        completed: true,
        answers: { summary: 'all questions answered' },
        timeSpentSeconds: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)), // up to 10 days ago
      });

      // Log student activity for 20% of attempts to keep logs realistic but small
      if (i % 5 === 0) {
        activityLogsData.push({
          id: crypto.randomUUID(),
          user: student.id,
          activityType: 'quiz_attempt',
          description: `Completed Mock Quiz Set #${quiz.title.split('#')[1]} scoring ${score}%`,
          timestamp: new Date(),
        });
      }
    }

    const attempts = await QuizAttempt.bulkCreate(attemptsData);
    const logs = await ActivityLog.bulkCreate(activityLogsData);
    console.log(`✅ Bulk created ${attempts.length} Quiz Attempts.`);
    console.log(`✅ Bulk created ${logs.length} Activity Logs.`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Seeding completed successfully in ${duration} seconds!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with critical error:', err);
    process.exit(1);
  }
}

// Run seeder if executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;
