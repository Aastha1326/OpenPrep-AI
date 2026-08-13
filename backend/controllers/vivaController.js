const { VivaSession, Subject } = require('../models');
const { generateFirstQuestion, generateFollowUp, generateFinalScorecard } = require('../services/vivaService');

exports.startSession = async (req, res, next) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) {
      return res.status(400).json({ success: false, error: 'Please select a subject.' });
    }

    const subject = await Subject.findByPk(subjectId);
    const subjectName = subject ? subject.name : 'General Studies';

    const firstQuestion = await generateFirstQuestion(subjectName);

    const session = await VivaSession.create({
      userId: req.user.id,
      subjectId,
      turns: [{ speaker: 'AI', text: firstQuestion }],
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        turns: session.turns,
        nextQuestion: firstQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.respondSession = async (req, res, next) => {
  try {
    const { sessionId, studentAnswer } = req.body;
    if (!sessionId || !studentAnswer) {
      return res.status(400).json({ success: false, error: 'Provide sessionId and studentAnswer.' });
    }

    const session = await VivaSession.findOne({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Viva session not found.' });
    }

    const subject = await Subject.findByPk(session.subjectId);
    const subjectName = subject ? subject.name : 'General Studies';

    // 1. Append student response
    const currentTurns = [...session.turns, { speaker: 'student', text: studentAnswer }];

    // 2. Generate next question
    const nextQuestion = await generateFollowUp(subjectName, currentTurns, studentAnswer);

    // 3. Append examiner follow-up question
    const updatedTurns = [...currentTurns, { speaker: 'AI', text: nextQuestion }];

    session.turns = updatedTurns;
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        turns: updatedTurns,
        nextQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.evaluateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Provide sessionId.' });
    }

    const session = await VivaSession.findOne({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Viva session not found.' });
    }

    const subject = await Subject.findByPk(session.subjectId);
    const subjectName = subject ? subject.name : 'General Studies';

    const scorecard = await generateFinalScorecard(subjectName, session.turns);

    session.score = scorecard.score;
    session.feedback = scorecard;
    await session.save();

    res.status(200).json({
      success: true,
      data: scorecard,
    });
  } catch (error) {
    next(error);
  }
};
