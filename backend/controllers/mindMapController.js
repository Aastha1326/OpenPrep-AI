const MindMap = require('../models/MindMap');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const geminiService = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');

// @desc    Generate AI Mind Map Graph Structure
// @route   POST /api/ai/mind-map/generate
// @access  Private
exports.generateMindMap = async (req, res, next) => {
  try {
    const { noteId, subjectId, topicId, textContext } = req.body;

    let targetText = textContext || '';
    let subjectName = 'General Subject';
    let topicName = 'Main Topic';

    if (subjectId) {
      const sub = await Subject.findByPk(subjectId);
      if (sub) subjectName = sub.name;
    }

    if (topicId) {
      const top = await Topic.findByPk(topicId);
      if (top) topicName = top.name;
    }

    if (noteId) {
      const note = await Note.findOne({ where: { id: noteId, user: req.user.id } });
      if (note) {
        targetText = (note.title ? `Title: ${note.title}\n\n` : '') + (note.content || '');
        if (!topicId && note.topic) {
          const top = await Topic.findByPk(note.topic);
          if (top) topicName = top.name;
        }
      }
    }

    if (!targetText && !subjectId && !topicId) {
      targetText = `${subjectName} - ${topicName} overview concepts`;
    }

    // Call Gemini service to generate graph hierarchy
    const graphData = await geminiService.generateMindMapStructure(
      targetText,
      subjectName,
      topicName,
      req.query.refresh === 'true'
    );

    // Save MindMap in PostgreSQL
    const mindMap = await MindMap.create({
      user: req.user.id,
      subject: subjectId || null,
      note: noteId || null,
      title: graphData.title || `${topicName} Concept Mind Map`,
      nodesData: graphData,
    });

    res.status(201).json({
      success: true,
      data: mindMap,
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

// @desc    Get saved Mind Map graph by ID
// @route   GET /api/ai/mind-map/:id
// @access  Private
exports.getMindMapById = async (req, res, next) => {
  try {
    const mindMap = await MindMap.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!mindMap) {
      return res.status(404).json({ success: false, error: 'Mind Map not found' });
    }

    res.status(200).json({ success: true, data: mindMap });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved Mind Maps for current user
// @route   GET /api/ai/mind-map
// @access  Private
exports.getUserMindMaps = async (req, res, next) => {
  try {
    const mindMaps = await MindMap.findAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.status(200).json({
      success: true,
      count: mindMaps.length,
      data: mindMaps,
    });
  } catch (error) {
    next(error);
  }
};
