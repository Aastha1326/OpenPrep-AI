const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { sequelize } = require('../config/db');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const ActivityLog = require('../models/ActivityLog');
const Progress = require('../models/Progress');
const QuizTelemetryEvent = require('../models/QuizTelemetryEvent');
const QuizBookmark = require('../models/QuizBookmark');const geminiService = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');
const { runCalibration } = require('../services/difficultyCalibrator');
const { calculateTopicProficiency, getDifficultyLevel } = require('../services/proficiencyService');

// Window (ms) during which duplicate quiz submissions for the same quiz are ignored.
// Prevents double-click on "Submit Quiz" from creating duplicate attempt records.
const DUPLICATE_SUBMIT_WINDOW_MS = 5000;

// Extract the questions the student answered incorrectly from a loaded quiz
// attempt, together with the attempt's quiz topic/subject metadata.
function extractMistookQuestions(attempt) {
  const quizRef = attempt && attempt.quizRef;
  if (!quizRef) return [];

  const quizQuestions = quizRef.questions || [];
  const userAnswers = attempt.answers || [];

  return quizQuestions
    .filter((q) => {
      const ans = userAnswers.find((a) => String(a.questionId) === String(q._id || q.id));
      return ans && !ans.isCorrect;
    })
    .map((q) => {
      const userAns = userAnswers.find((a) => String(a.questionId) === String(q._id || q.id));
      return {
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        userSelectedAnswer: userAns ? userAns.selectedAnswer : -1,
      };
    });
}

// @desc    Generate AI Quiz
// @route   POST /api/quizzes/generate-ai
// @access  Private
exports.generateAIQuiz = async (req, res, next) => {
  try {
    const { subjectId, topicId, count, language } = req.body;
    const normalizedLanguage = normalizeQuizLanguage(language);

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    let topicName = 'General Overview';
    let topicObj = null;
    if (topicId) {
      topicObj = await Topic.findByPk(topicId);
      if (topicObj) topicName = topicObj.name;
    }

    // Try to find notes to feed context to Gemini API
    const notes = await Note.findAll({ where: { subject: subjectId, user: req.user.id } });
    let notesText = '';
    if (notes && notes.length > 0) {
      notesText = notes
        .map((n) => n.content || '')
        .join('\n');
    }

    // Adaptive difficulty calculation
    const proficiency = await calculateTopicProficiency(req.user.id, subjectId, topicId);
    const difficultyLevel = getDifficultyLevel(proficiency);

    // Call Gemini Service
    const aiQuiz = await geminiService.generateQuiz(
      subject.name,
      topicName,
      notesText,
      count || 5,
      req.query.refresh === 'true',
      normalizedLanguage,
      difficultyLevel
    );

    // Assign unique question IDs (similar to Mongoose subdocument ids)
    const questionsWithIds = aiQuiz.questions.map((q) => ({
      _id: uuidv4(),
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
    }));

    const quiz = await Quiz.create({
      title: aiQuiz.title || `${topicName} AI Practice Quiz`,
      subject: subjectId,
      topic: topicId || null,
      questions: questionsWithIds,
      type: 'AI_Generated',
      language: normalizedLanguage,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    // Handle Gemini API rate limit errors
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    // Handle Gemini API server errors
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// @desc    Get quizzes for a subject
// @route   GET /api/quizzes
// @access  Private
exports.getQuizzes = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const filter = { createdBy: req.user.id };
    if (subjectId) filter.subject = subjectId;

    const { count: total, rows: quizzes } = await Quiz.findAndCountAll({
      where: filter,
      distinct: true,
      include: [
        { model: Subject, as: 'subjectRef' },
        { model: Topic, as: 'topicRef' },
      ],
      offset,
      limit,
    });

    const populatedQuizzes = quizzes.map((q) => {
      const json = q.toJSON();
      json.subject = json.subjectRef;
      json.topic = json.topicRef;
      return json;
    });

    res.status(200).json({
      success: true,
      count: populatedQuizzes.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: populatedQuizzes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz details (including questions)
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuizDetails = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        { model: Subject, as: 'subjectRef' },
        { model: Topic, as: 'topicRef' },
      ],
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const json = quiz.toJSON();
    json.subject = json.subjectRef;
    json.topic = json.topicRef;

    res.status(200).json({ success: true, data: json });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { answers, timeSpent } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Answers must be provided as an array' });
    }

    const quiz = await Quiz.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const questionsList = quiz.questions || [];

    // Validate that all questions are answered
    if (answers.length !== questionsList.length) {
      return res.status(400).json({ 
        success: false, 
        error: `Incomplete submission: expected ${questionsList.length} answers but received ${answers.length}` 
      });
    }

    // Validate that all submitted questionIds actually belong to this quiz
    const quizQuestionIds = questionsList.map(q => String(q._id || q.id));
    const invalidAnswers = answers.filter(ans => !quizQuestionIds.includes(String(ans.questionId)));
    if (invalidAnswers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid questionId(s) submitted that do not belong to this quiz' 
      });
    }

    // Atomically check for duplicate submissions and persist the attempt.
    // READ COMMITTED is required so that, after waiting for the row lock, the
    // duplicate check sees the committed attempt of a concurrent request.
    const result = await sequelize.transaction(
      { isolationLevel: 'READ COMMITTED' },
      async (transaction) => {
      const lockedQuiz = await Quiz.findOne({
        where: { id: quiz.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!lockedQuiz) {
        return { error: 'Quiz not found' };
      }

      // Ignore duplicate submissions for the same quiz within the 5-second window
      const existingAttempt = await QuizAttempt.findOne({
        where: {
          user: req.user.id,
          quiz: quiz.id,
          createdAt: { [Op.gte]: new Date(Date.now() - DUPLICATE_SUBMIT_WINDOW_MS) },
        },
        transaction,
      });
      if (existingAttempt) {
        return { attempt: existingAttempt, duplicate: true };
      }

      // Evaluate answers
      let correctCount = 0;
      const evaluatedAnswers = questionsList.map((q) => {
        const userAns = answers.find((ans) => String(ans.questionId) === String(q._id || q.id));
        const selected = userAns && userAns.selectedAnswer !== undefined ? userAns.selectedAnswer : -1;
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) correctCount++;

        return {
          questionId: q._id || q.id,
          selectedAnswer: selected,
          isCorrect,
        };
      });

      const totalQuestions = questionsList.length;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      // Determine weak vs strong areas based on score (<50% Weak, 50-80% Medium, >80% Strong)
      const weakTopics = [];
      const strongTopics = [];
      if (quiz.topic) {
        const topicObj = await Topic.findByPk(quiz.topic, { transaction });
        if (topicObj) {
          if (score < 50) {
            weakTopics.push(quiz.topic);
            topicObj.status = 'Weak';
          } else if (score > 80) {
            strongTopics.push(quiz.topic);
            topicObj.status = 'Strong';
          } else {
            topicObj.status = 'Medium';
          }
          await topicObj.save({ transaction });
        }
      }

      // Save Attempt
      const attempt = await QuizAttempt.create(
        {
          user: req.user.id,
          quiz: quiz.id,
          score,
          totalQuestions,
          answers: evaluatedAnswers,
          timeSpent: timeSpent || 0,
          weakTopics,
          strongTopics,
        },
        { transaction }
      );

      return { attempt, duplicate: false, score };
      }
    );

    if (result.error) {
      return res.status(404).json({ success: false, error: result.error });
    }

    const { attempt, duplicate, score } = result;

    // Duplicate submission detected — return the original attempt without
    // re-running side effects (progress, activity log, weakness aggregation).
    if (duplicate) {
      return res.status(200).json({ success: true, data: attempt, duplicate: true });
    }

    // Trigger AI weakness aggregation and adaptive planner rescheduling in background
    const weaknessAggregatorService = require('../services/weaknessAggregatorService');
    weaknessAggregatorService.aggregateUserWeakness(req.user.id)
      .then(() => weaknessAggregatorService.rescheduleAdaptivePlanner(req.user.id))
      .catch((err) => console.error('Background weakness aggregation error:', err));

    // Update Progress (supports both topic-level and subject-level quizzes)
    const progressWhere = {
      user: req.user.id,
      subject: quiz.subject,
    };
    if (quiz.topic) {
      progressWhere.topic = quiz.topic;
    }

    let progress = await Progress.findOne({ where: progressWhere });

    if (progress) {
      const quizScores = [...progress.quizScores];
      quizScores.push({ attempt: attempt.id, score, date: new Date() });
      progress.quizScores = quizScores;

      if (score > progress.completionPercentage) {
        progress.completionPercentage = Math.min(score, 100);
      }
      await progress.save();
    } else {
      await Progress.create({
        user: req.user.id,
        subject: quiz.subject,
        topic: quiz.topic || null,
        completionPercentage: score,
        quizScores: [{ attempt: attempt.id, score, date: new Date() }],
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'quiz_attempt',
      description: `Completed practice quiz: "${quiz.title}" with score ${score}%`,
    });

    // Award XP and check gamification badges/streaks
    const gamificationService = require('../services/gamificationService');
    const progression = await gamificationService.awardXP(req.user.id, 100, 'quiz_complete');

    const timezoneOffset = Number(req.headers['x-timezone-offset']) || 0;
    await gamificationService.updateStreak(req.user.id, timezoneOffset);

    const user = await User.findByPk(req.user.id);
    const newBadges = await gamificationService.checkAndUnlockBadges(user, 'quiz_complete', {
      timezoneOffsetMinutes: timezoneOffset
    });
    progression.newBadges = newBadges;

    res.status(201).json({
      success: true,
      data: attempt,
      progression,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz attempt history & performance reports
// @route   GET /api/quizzes/attempts/history
// @access  Private
exports.getAttemptHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count: total, rows: attempts } = await QuizAttempt.findAndCountAll({
      where: { user: req.user.id },
      distinct: true,
      include: [
        {
          model: Quiz,
          as: 'quizRef',
          include: [
            { model: Subject, as: 'subjectRef' },
            { model: Topic, as: 'topicRef' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    const populatedAttempts = attempts.map((att) => {
      const json = att.toJSON();
      if (json.quizRef) {
        json.quiz = json.quizRef;
        json.quiz.subject = json.quizRef.subjectRef;
        json.quiz.topic = json.quizRef.topicRef;
      }
      return json;
    });

    res.status(200).json({
      success: true,
      count: populatedAttempts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: populatedAttempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI Revision Sheet for weak concepts from quiz history
// @route   POST /api/quizzes/generate-revision-sheet or POST /api/quiz/generate-revision-sheet
// @access  Private
exports.generateRevisionSheet = async (req, res, next) => {
  try {
    const { quizAttemptId, mistookQuestions: payloadQuestions, subjectId, topicId, saveToNotes = true } = req.body;

    let mistookQuestions = payloadQuestions || [];
    let targetSubjectName = 'General Subject';
    let targetTopicName = 'Weak Topics';
    let matchedSubjectId = subjectId || null;
    let matchedTopicId = topicId || null;

    if (quizAttemptId) {
      const attempt = await QuizAttempt.findOne({
        where: { id: quizAttemptId, user: req.user.id },
        include: [
          {
            model: Quiz,
            as: 'quizRef',
            include: [
              { model: Subject, as: 'subjectRef' },
              { model: Topic, as: 'topicRef' },
            ],
          },
        ],
      });

      if (attempt) {
        if (attempt.quizRef) {
          matchedSubjectId = matchedSubjectId || attempt.quizRef.subject;
          matchedTopicId = matchedTopicId || attempt.quizRef.topic;

          if (attempt.quizRef.subjectRef) targetSubjectName = attempt.quizRef.subjectRef.name;
          if (attempt.quizRef.topicRef) targetTopicName = attempt.quizRef.topicRef.name;

          mistookQuestions = extractMistookQuestions(attempt);
        }
      }
    }

    if (subjectId && targetSubjectName === 'General Subject') {
      const sub = await Subject.findByPk(subjectId);
      if (sub) targetSubjectName = sub.name;
    }

    if (topicId && targetTopicName === 'Weak Topics') {
      const top = await Topic.findByPk(topicId);
      if (top) targetTopicName = top.name;
    }

    // Call Gemini Service
    const revisionSheet = await geminiService.generateRevisionSheet(
      mistookQuestions,
      targetSubjectName,
      targetTopicName,
      req.query.refresh === 'true'
    );

    let savedNote = null;
    if (saveToNotes && matchedSubjectId) {
      savedNote = await Note.create({
        title: revisionSheet.title || `AI Revision Sheet: ${targetTopicName}`,
        content: revisionSheet.summaryMarkdown,
        subject: matchedSubjectId,
        topic: matchedTopicId,
        category: 'Summary',
        user: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        title: revisionSheet.title,
        summaryMarkdown: revisionSheet.summaryMarkdown,
        savedNote,
      },
    });
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// @desc    Generate AI Remediation Plan for weak concepts from failed quiz questions
// @route   POST /api/quizzes/generate-remediation-plan
// @access  Private
exports.generateRemediationPlan = async (req, res, next) => {
  try {
    const { quizAttemptId, saveToNotes = true } = req.body;

    let mistookQuestions = req.body.mistookQuestions || [];
    let targetSubjectName = 'General Subject';
    let targetTopicName = 'Weak Concepts';
    let matchedSubjectId = req.body.subjectId || null;
    let matchedTopicId = req.body.topicId || null;

    if (quizAttemptId) {
      const attempt = await QuizAttempt.findOne({
        where: { id: quizAttemptId, user: req.user.id },
        include: [
          {
            model: Quiz,
            as: 'quizRef',
            include: [
              { model: Subject, as: 'subjectRef' },
              { model: Topic, as: 'topicRef' },
            ],
          },
        ],
      });

      if (attempt && attempt.quizRef) {
        matchedSubjectId = matchedSubjectId || attempt.quizRef.subject;
        matchedTopicId = matchedTopicId || attempt.quizRef.topic;

        if (attempt.quizRef.subjectRef) targetSubjectName = attempt.quizRef.subjectRef.name;
        if (attempt.quizRef.topicRef) targetTopicName = attempt.quizRef.topicRef.name;

        mistookQuestions = extractMistookQuestions(attempt);
      }
    }

    if (req.body.subjectId && targetSubjectName === 'General Subject') {
      const sub = await Subject.findByPk(req.body.subjectId);
      if (sub) targetSubjectName = sub.name;
    }

    if (req.body.topicId && targetTopicName === 'Weak Concepts') {
      const top = await Topic.findByPk(req.body.topicId);
      if (top) targetTopicName = top.name;
    }

    if (mistookQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No failed questions found. Generate a remediation plan after reviewing a quiz with mistakes.',
      });
    }

    // Call Gemini Service to structure the 3-day remediation micro-modules
    const remediationPlan = await geminiService.generateRemediationPlan(
      mistookQuestions,
      targetSubjectName,
      targetTopicName,
      req.body.weakTopics || [],
      req.query.refresh === 'true'
    );

    let savedNote = null;
    if (saveToNotes && matchedSubjectId) {
      savedNote = await Note.create({
        title: remediationPlan.title || `3-Day AI Remediation Plan: ${targetTopicName}`,
        content: remediationPlan.summaryMarkdown,
        subject: matchedSubjectId,
        topic: matchedTopicId,
        category: 'Summary',
        user: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        title: remediationPlan.title,
        summaryMarkdown: remediationPlan.summaryMarkdown,
        plan: remediationPlan.plan,
        savedNote,
      },
    });
  } catch (error) {
    if (error instanceof GeminiRateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    if (error instanceof GeminiServerError) {
      return res.status(503).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

// @desc    Run difficulty calibration report
// @route   GET /api/quizzes/admin/calibration-report
// @access  Private/Admin
exports.getCalibrationReport = async (req, res, next) => {
  try {
    // Check if user is admin if role exists
    if (req.user && req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized as admin' });
    }

const report = await runCalibration();
    
    if (report.success) {
      res.status(200).json({ success: true, data: report });
    } else {
      res.status(500).json({ success: false, error: report.error });
    }
  } catch (error) {
    next(error);
  }
};

const TELEMETRY_EVENT_TYPES = ['question_view', 'option_select', 'flag_toggle', 'quiz_submit', 'quiz_exit'];
const MAX_TELEMETRY_EVENTS_PER_BATCH = 200;

// @desc    Ingest a batch of client-buffered quiz telemetry events (question
//          views, option selections, flag toggles) in a single request,
//          instead of one HTTP call per interaction.
// @route   POST /api/quiz/telemetry/batch
// @access  Private (Bearer header, or body.token for sendBeacon calls)
exports.submitTelemetryBatch = async (req, res, next) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'events must be a non-empty array' });
    }

    const records = events.slice(0, MAX_TELEMETRY_EVENTS_PER_BATCH).reduce((acc, evt) => {
      if (!evt || !TELEMETRY_EVENT_TYPES.includes(evt.eventType)) return acc;
      acc.push({
        user: req.user.id,
        quiz: evt.quizId || null,
        eventType: evt.eventType,
        questionIndex: Number.isInteger(evt.questionIndex) ? evt.questionIndex : null,
        payload: {
          questionId: evt.questionId || null,
          selectedOption: evt.selectedOption ?? null,
          timeSpentMs: evt.timeSpentMs ?? null,
        },
        clientTimestamp: evt.clientTimestamp ? new Date(evt.clientTimestamp) : new Date(),
      });
      return acc;
    }, []);

    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid telemetry events found in the batch' });
    }

    await QuizTelemetryEvent.bulkCreate(records);

    // One log line per HTTP request covering many buffered client events —
    // confirms batching is reducing per-interaction network traffic.
    console.log(`[Quiz Telemetry] Batched ${records.length} event(s) from user ${req.user.id} in a single request`);

    res.status(201).json({ success: true, received: records.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the current user's bookmarked question IDs for a quiz
// @route   GET /api/quizzes/:id/bookmarks
// @access  Private
exports.getQuizBookmarks = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const bookmarks = await QuizBookmark.findAll({
      where: { user: req.user.id, quiz: quiz.id },
      attributes: ['questionId'],
    });

    res.status(200).json({ success: true, data: bookmarks.map((b) => b.questionId) });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark on a single quiz question (used by Review Mode)
// @route   POST /api/quizzes/:id/bookmarks/toggle
// @access  Private
exports.toggleQuizBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.body;

    const quiz = await Quiz.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const questionExists = (quiz.questions || []).some((q) => String(q._id || q.id) === String(questionId));
    if (!questionExists) {
      return res.status(400).json({ success: false, error: 'Question not found in this quiz' });
    }

    const existing = await QuizBookmark.findOne({
      where: { user: req.user.id, quiz: quiz.id, questionId },
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({ success: true, bookmarked: false });
    }

    await QuizBookmark.create({ user: req.user.id, quiz: quiz.id, questionId });
    res.status(201).json({ success: true, bookmarked: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed quiz performance report card as PDF
// @route   GET /api/quizzes/attempts/:attemptId/pdf
// @access  Private
exports.getQuizAttemptReportPDF = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findOne({
      where: { id: req.params.attemptId, user: req.user.id },
    });
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Quiz attempt not found' });
    }

    const quiz = await Quiz.findByPk(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    const subject = await Subject.findByPk(quiz.subject);

    // Calculate topic breakdown
    const topicBreakdown = {};
    const questionsList = quiz.questions || [];
    for (const q of questionsList) {
      const userAns = (attempt.answers || []).find(
        (ans) => String(ans.questionId) === String(q._id || q.id)
      );
      const isCorrect = userAns ? userAns.isCorrect : false;
      const tName = q.topicName || 'General';
      if (!topicBreakdown[tName]) {
        topicBreakdown[tName] = { total: 0, correct: 0 };
      }
      topicBreakdown[tName].total++;
      if (isCorrect) {
        topicBreakdown[tName].correct++;
      }
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `quiz_report_${attempt.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // 1. Header Banner
    doc.rect(0, 0, 595.28, 120).fill('#1a365d'); // Dark Navy

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text('Quiz Performance Report', 50, 40);
    doc.font('Helvetica').fontSize(11).text('OpenPrep AI • Smart Diagnostic System', 50, 70);

    // Metadata Block (Right aligned in banner)
    doc.fillColor('#ffffff').fontSize(10);
    doc.text(`Attempt ID: ${attempt.id.substring(0, 8)}...`, 380, 40, { align: 'right', width: 165 });
    doc.text(`Date: ${new Date(attempt.createdAt).toLocaleDateString()}`, 380, 55, { align: 'right', width: 165 });
    doc.text(`Time Spent: ${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`, 380, 70, { align: 'right', width: 165 });

    doc.y = 150;

    // 2. Stats Dashboard Cards
    // Score Card
    doc.rect(50, 150, 150, 80).fill('#edf2f7');
    doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(28).text(`${attempt.score}%`, 50, 175, { width: 150, align: 'center' });
    doc.fillColor('#718096').font('Helvetica').fontSize(9).text('SCORE PERCENTAGE', 50, 160, { width: 150, align: 'center' });

    // Accuracy Card
    doc.rect(222, 150, 150, 80).fill('#edf2f7');
    const correctCount = (attempt.answers || []).filter((a) => a.isCorrect).length;
    doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(28).text(`${correctCount}/${attempt.totalQuestions}`, 222, 175, { width: 150, align: 'center' });
    doc.fillColor('#718096').font('Helvetica').fontSize(9).text('QUESTIONS CORRECT', 222, 160, { width: 150, align: 'center' });

    // Accuracy Gauge Box
    doc.rect(395, 150, 150, 80).fill('#edf2f7');
    doc.fillColor('#718096').font('Helvetica').fontSize(9).text('PERFORMANCE STATUS', 395, 160, { width: 150, align: 'center' });
    const statusStr = attempt.score >= 80 ? 'EXCELLENT' : (attempt.score >= 50 ? 'MEDIUM' : 'REQUIRES FOCUS');
    const statusColor = attempt.score >= 80 ? '#38a169' : (attempt.score >= 50 ? '#dd6b20' : '#e53e3e');
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(14).text(statusStr, 395, 175, { width: 150, align: 'center' });
    
    // Draw horizontal progress indicator bar
    doc.fillColor('#e2e8f0').rect(420, 200, 100, 8).fill();
    doc.fillColor(statusColor).rect(420, 200, (attempt.score / 100) * 100, 8).fill();

    // 3. Subject and Topic Title
    doc.y = 260;
    doc.fillColor('#1a365d').font('Helvetica-Bold').fontSize(16).text(quiz.title, 50, doc.y);
    if (subject) {
      doc.fillColor('#4a5568').font('Helvetica').fontSize(11).text(`Subject: ${subject.name}`, 50, doc.y + 20);
      doc.y += 35;
    } else {
      doc.y += 20;
    }

    // 4. Topic Breakdown Table
    doc.fillColor('#1a365d').font('Helvetica-Bold').fontSize(12).text('Topic Breakdown & Analytics', 50, doc.y, { underline: true });
    doc.moveDown(0.4);

    const tableStartY = doc.y;
    doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(9);
    doc.text('Topic Name', 50, tableStartY, { width: 220 });
    doc.text('Questions', 280, tableStartY, { width: 80, align: 'center' });
    doc.text('Correct', 370, tableStartY, { width: 80, align: 'center' });
    doc.text('Accuracy', 460, tableStartY, { width: 85, align: 'center' });
    doc.moveDown(0.3);
    
    doc.strokeColor('#cbd5e0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.4);

    doc.font('Helvetica').fontSize(9).fillColor('#4a5568');
    Object.entries(topicBreakdown).forEach(([topicName, data]) => {
      const rowY = doc.y;
      const acc = Math.round((data.correct / data.total) * 100);
      doc.text(topicName, 50, rowY, { width: 220 });
      doc.text(String(data.total), 280, rowY, { width: 80, align: 'center' });
      doc.text(String(data.correct), 370, rowY, { width: 80, align: 'center' });
      doc.text(`${acc}%`, 460, rowY, { width: 85, align: 'center' });
      doc.moveDown(0.4);
    });

    doc.moveDown(1.5);

    // 5. Question Analysis Section
    doc.fillColor('#1a365d').font('Helvetica-Bold').fontSize(12).text('Question-by-Question Diagnostic Review', { underline: true });
    doc.moveDown(0.6);

    questionsList.forEach((q, idx) => {
      if (doc.y > 600) {
        doc.addPage();
      }

      const qNum = idx + 1;
      const userAns = (attempt.answers || []).find(
        (ans) => String(ans.questionId) === String(q._id || q.id)
      );
      const isCorrect = userAns ? userAns.isCorrect : false;

      const cardStartY = doc.y;
      
      // Draw status line indicator
      const barColor = isCorrect ? '#38a169' : '#e53e3e';
      doc.save().rect(50, cardStartY, 4, 80).fill(barColor).restore();

      // Question Title
      doc.fillColor(isCorrect ? '#2f855a' : '#c53030').font('Helvetica-Bold').fontSize(10);
      doc.text(`Question ${qNum} • ${isCorrect ? 'Correct' : 'Incorrect'}`, 65, cardStartY + 8);
      
      doc.fillColor('#2d3748').font('Helvetica').fontSize(9);
      doc.text(q.questionText || '', 65, doc.y + 6, { width: 460 });
      doc.moveDown(0.4);

      const options = q.options || [];
      options.forEach((optStr, optIdx) => {
        const isUserSelection = userAns && userAns.selectedAnswer === optIdx;
        const isCorrectOption = q.correctAnswer === optIdx;
        
        let prefix = '   [ ] ';
        let optionColor = '#4a5568';
        let optionFont = 'Helvetica';

        if (isCorrectOption) {
          prefix = '   [✓] ';
          optionColor = '#38a169';
          optionFont = 'Helvetica-Bold';
        } else if (isUserSelection && !isCorrect) {
          prefix = '   [✗] ';
          optionColor = '#e53e3e';
          optionFont = 'Helvetica-Bold';
        }

        doc.fillColor(optionColor).font(optionFont).fontSize(8.5);
        doc.text(`${prefix}${optStr}`, 65, doc.y, { width: 460 });
        doc.moveDown(0.25);
      });

      if (q.explanation) {
        doc.moveDown(0.3);
        doc.fillColor('#718096').font('Helvetica-Oblique').fontSize(8);
        doc.text(`Explanation: ${q.explanation}`, 65, doc.y, { width: 460 });
      }

      doc.moveDown(1.5);
    });

    // Footer
    doc.fillColor('#a0aec0').font('Helvetica').fontSize(8).text('Generated by OpenPrep AI Analytical Diagnostic Engine', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};