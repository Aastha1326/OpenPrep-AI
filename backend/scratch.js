const fs = require('fs');

const path = 'controllers/quizController.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add sequelize import
if (!content.includes('../config/db')) {
  content = content.replace(
    "const geminiService = require('../services/geminiService');",
    "const geminiService = require('../services/geminiService');\nconst { sequelize } = require('../config/db');"
  );
}

// 2. Add executeWithRetry helper
const retryHelper = `
const executeWithRetry = async (fn, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      const isLockError = err.name === 'SequelizeTimeoutError' || 
                          (err.message && (err.message.includes('deadlock') || err.message.includes('database is locked')));
      attempt++;
      if (attempt >= maxRetries || !isLockError) throw err;
      const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
`;
if (!content.includes('executeWithRetry')) {
  content = content.replace(
    "// @desc    Generate AI Quiz",
    retryHelper + "\n// @desc    Generate AI Quiz"
  );
}

// 3. Rewrite submitQuizAttempt
const originalSubmitStart = `exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findOne({ where: { id: req.params.id, createdBy: req.user.id } });`;

const newSubmitStart = `exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { answers, timeSpent } = req.body;

    const attempt = await executeWithRetry(async () => {
      return await sequelize.transaction(async (t) => {
        const quiz = await Quiz.findOne({ 
          where: { id: req.params.id, createdBy: req.user.id },
          transaction: t 
        });`;

const submitEndOriginal = `    res.status(201).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};`;

const submitEndNew = `        return attemptRecord;
      });
    });

    res.status(201).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};`;

content = content.replace(originalSubmitStart, newSubmitStart);

// Now we need to pass { transaction: t } to all operations inside submitQuizAttempt.
// Let's just do a big regex replacement for the body of submitQuizAttempt.
const bodyRegex = /(const quiz = await Quiz\.findOne\(\{[\s\S]+?)(\s+res\.status\(201\)\.json\(\{)/;
const match = content.match(bodyRegex);

if (match) {
  let body = match[1];
  body = body.replace(/const attempt = await QuizAttempt\.create\(\{/g, 'const attemptRecord = await QuizAttempt.create({');
  body = body.replace(/QuizAttempt\.create\(\{([\s\S]+?)\}\);/g, 'QuizAttempt.create({$1}, { transaction: t });');
  body = body.replace(/Topic\.findByPk\(quiz\.topic\);/g, 'Topic.findByPk(quiz.topic, { transaction: t });');
  body = body.replace(/await topicObj\.save\(\);/g, 'await topicObj.save({ transaction: t });');
  body = body.replace(/Progress\.findOne\(\{([\s\S]+?)\}\);/g, 'Progress.findOne({$1, transaction: t});');
  body = body.replace(/await progress\.save\(\);/g, 'await progress.save({ transaction: t });');
  body = body.replace(/Progress\.create\(\{([\s\S]+?)\}\);/g, 'Progress.create({$1}, { transaction: t });');
  body = body.replace(/ActivityLog\.create\(\{([\s\S]+?)\}\);/g, 'ActivityLog.create({$1}, { transaction: t });');
  body = body.replace(/attempt\.id/g, 'attemptRecord.id');
  
  content = content.replace(match[1], body);
}

content = content.replace(submitEndOriginal, submitEndNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Modified quizController.js successfully');
