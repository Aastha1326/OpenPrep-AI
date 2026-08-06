const cron = require('node-cron');
const { sequelize } = require('../config/db');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// Define thresholds
const HARD_THRESHOLD = 0.40;
const MEDIUM_THRESHOLD = 0.70; // above 70 is Easy

// Function to run calibration manually or via cron
const runCalibration = async () => {
  try {
    console.log('[Difficulty Calibrator] Starting calibration job...');

    // 1. Fetch all quiz attempts
    const attempts = await QuizAttempt.findAll();

    // 2. Aggregate accuracy stats per questionId
    const questionStats = {}; // questionId -> { total: 0, correct: 0, quizId: uuid }

    for (const attempt of attempts) {
      if (!attempt.answers || !Array.isArray(attempt.answers)) continue;

      for (const ans of attempt.answers) {
        const qId = ans.questionId;
        if (!qId) continue;

        if (!questionStats[qId]) {
          questionStats[qId] = { total: 0, correct: 0, quizId: attempt.quiz };
        }
        
        questionStats[qId].total += 1;
        if (ans.isCorrect) {
          questionStats[qId].correct += 1;
        }
      }
    }

    // 3. Calculate difficulty for each question
    const updatesByQuiz = {}; // quizId -> { qId: difficulty }

    for (const [qId, stats] of Object.entries(questionStats)) {
      if (stats.total === 0) continue;

      const accuracy = stats.correct / stats.total;
      let newDifficulty = 'Medium';
      if (accuracy < HARD_THRESHOLD) {
        newDifficulty = 'Hard';
      } else if (accuracy > MEDIUM_THRESHOLD) {
        newDifficulty = 'Easy';
      }

      if (!updatesByQuiz[stats.quizId]) {
        updatesByQuiz[stats.quizId] = {};
      }
      updatesByQuiz[stats.quizId][qId] = {
        difficulty: newDifficulty,
        accuracy: (accuracy * 100).toFixed(2)
      };
    }

    // 4. Update the Quiz models in the database
    let updatedCount = 0;
    for (const [quizId, updates] of Object.entries(updatesByQuiz)) {
      const quiz = await Quiz.findByPk(quizId);
      if (!quiz || !quiz.questions) continue;

      let changed = false;
      const updatedQuestions = quiz.questions.map(q => {
        const qId = q._id || q.id;
        if (qId && updates[qId]) {
          if (q.difficulty !== updates[qId].difficulty || q.accuracy !== updates[qId].accuracy) {
            changed = true;
          }
          return { ...q, difficulty: updates[qId].difficulty, accuracy: updates[qId].accuracy };
        }
        return q;
      });

      if (changed) {
        // We use sequelize to update the JSONB column
        await Quiz.update({ questions: updatedQuestions }, { where: { id: quizId } });
        updatedCount += Object.keys(updates).length;
      }
    }

    console.log(`[Difficulty Calibrator] Calibration complete. Updated ${updatedCount} questions.`);
    return { success: true, updatedCount, questionStats };

  } catch (error) {
    console.error('[Difficulty Calibrator] Error during calibration:', error);
    return { success: false, error: error.message };
  }
};

const initDifficultyCalibratorCron = () => {
  // Run every night at midnight
  cron.schedule('0 0 * * *', async () => {
    await runCalibration();
  });
  console.log('Difficulty Calibrator cron job initialized.');
};

module.exports = {
  runCalibration,
  initDifficultyCalibratorCron
};
