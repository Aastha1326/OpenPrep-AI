/**
 * @fileoverview Controller for managing Oral Viva sessions and evaluations.
 */
const { VivaSession, Subject } = require('../models');
const vivaService = require('../services/geminiVivaService');

/**
 * Starts a new viva session by generating an initial question.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.startSession = async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Valid topic string is required (min 3 characters).'
      });
    }

    const initialQuestion = await vivaService.generateInitialQuestion(topic.trim());

    // Save session to database
    const session = await VivaSession.create({
      userId: req.user.id,
      subjectId: null, // Using topic-based approach instead of subjectId
      topic: topic.trim(),
      turns: [],
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        topic: topic.trim(),
        currentQuestion: initialQuestion,
        conversationHistory: [],
      },
    });
  } catch (error) {
    console.error('Error starting viva session:', error);
    next(error);
  }
};

/**
 * Evaluates a user's answer and returns feedback + next question.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.respondSession = async (req, res, next) => {
  try {
    const { sessionId, currentQuestion, userAnswer } = req.body;

    if (!sessionId || !currentQuestion || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, currentQuestion, or userAnswer.'
      });
    }

    if (userAnswer.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Answer is too short to evaluate.'
      });
    }

    const session = await VivaSession.findOne({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Viva session not found.'
      });
    }

    const evaluation = await vivaService.evaluateVivaResponse(
      currentQuestion,
      userAnswer,
      session.topic
    );

    // Update conversation history
    const updatedHistory = [
      ...session.turns,
      {
        speaker: 'student',
        text: userAnswer,
        score: evaluation.score,
        feedback: evaluation.feedback,
      },
      {
        speaker: 'AI',
        text: evaluation.nextQuestion,
      }
    ];

    session.turns = updatedHistory;
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        evaluation,
        conversationHistory: updatedHistory,
        nextQuestion: evaluation.nextQuestion,
      },
    });
  } catch (error) {
    console.error('Error evaluating viva answer:', error);
    next(error);
  }
};

/**
 * Evaluates the entire viva session and generates a final scorecard.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.evaluateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Provide sessionId.'
      });
    }

    const session = await VivaSession.findOne({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Viva session not found.'
      });
    }

    const scorecard = await vivaService.generateFinalScorecard(session.topic, session.turns);

    session.score = scorecard.score;
    session.feedback = scorecard;
    await session.save();

    res.status(200).json({
      success: true,
      data: scorecard,
    });
  } catch (error) {
    console.error('Error evaluating viva session:', error);
    next(error);
  }
};
