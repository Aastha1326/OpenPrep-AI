const fs = require('fs');
const path = require('path');
const { transcribeAndSummarizeAudioStructured } = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');
const Subject = require('../models/Subject');

// @desc    Transcribe & Summarize Audio without saving
// @route   POST /api/notes/transcribe-and-summarize
// @access  Private
exports.transcribeAndSummarize = async (req, res, next) => {
  try {
    const { subjectId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an audio file' });
    }

    let subjectName = 'General Study';
    if (subjectId && subjectId !== 'undefined' && subjectId !== 'null') {
      const subject = await Subject.findByPk(subjectId);
      if (subject) {
        subjectName = subject.name;
      }
    }

    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = req.file.mimetype;

    // Call Gemini Service to get structured summary
    const audioResult = await transcribeAndSummarizeAudioStructured(fileBuffer, mimeType, subjectName);

    // Keep the audio file in /uploads for playback/saving
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        fileUrl,
        transcription: audioResult.transcription || 'No transcription generated',
        title: audioResult.title || 'Untitled Voice Note',
        keyTakeaways: audioResult.keyTakeaways || [],
        formulas: audioResult.formulas || [],
        examWarnings: audioResult.examWarnings || [],
        actionItems: audioResult.actionItems || []
      }
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

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
