const fs = require('fs');
const path = require('path');
const { HandwrittenSubmission } = require('../models');
const { transcribeHandwriting } = require('../services/handwritingOcrService');
const { evaluateAnswerAgainstRubric } = require('../services/rubricGradingService');

/**
 * Uploads handwritten answer sheet photos and triggers transcription + rubric grading evaluation.
 */
async function uploadHandwrittenSubmission(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }

    const { modelAnswer, rubricDescription, examId } = req.body;
    if (!modelAnswer || !rubricDescription) {
      return res.status(400).json({ success: false, error: 'modelAnswer and rubricDescription are required.' });
    }

    const photoUrls = req.files.map(file => `/uploads/${file.filename}`);

    // 1. Create a pending submission record
    const submission = await HandwrittenSubmission.create({
      userId: req.user.id,
      examId: examId || null,
      photoUrls,
      modelAnswer,
      rubricDescription,
      status: 'pending',
    });

    // 2. Perform out-of-band processing (transcription + grading) but wait for it to complete or run inline
    // Running inline is simpler for demo/tests, but we can do it and respond immediately or await it.
    // Let's await it to return the completed evaluation immediately, which is nice and synchronous for the client!
    try {
      const transcriptions = [];
      for (const file of req.files) {
        const fileBuffer = await fs.promises.readFile(file.path);
        const result = await transcribeHandwriting(fileBuffer, file.mimetype);
        transcriptions.push(result.transcription);
      }

      const combinedTranscription = transcriptions.join('\n\n');
      const evaluation = await evaluateAnswerAgainstRubric(
        combinedTranscription,
        modelAnswer,
        rubricDescription
      );

      submission.transcription = combinedTranscription;
      submission.evaluation = evaluation;
      submission.status = 'completed';
      await submission.save();

      res.status(201).json({
        success: true,
        data: submission,
      });
    } catch (processErr) {
      console.error('[HandwrittenSubmissionController] Processing failed:', processErr.message);
      submission.status = 'failed';
      await submission.save();
      return res.status(500).json({
        success: false,
        error: `Processing failed: ${processErr.message}`,
        data: submission,
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Returns transcribed text, rubric score, and feedback annotations.
 */
async function getEvaluation(req, res, next) {
  try {
    const { id } = req.params;
    const submission = await HandwrittenSubmission.findOne({
      where: { id, userId: req.user.id }
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadHandwrittenSubmission,
  getEvaluation,
};
