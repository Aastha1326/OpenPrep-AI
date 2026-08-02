const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Note = require('../models/Note');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { escapeLikePattern } = require('../utils/likePattern');
const { summarizeNoteText } = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');

// @desc    Upload Note
// @route   POST /api/notes
// @access  Private
exports.uploadNote = async (req, res, next) => {
  try {
    const { title, content, subjectId, topicId, isPublic, category } = req.body;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    let fileUrl = '';
    let fileType = 'text';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const ext = req.file.filename.split('.').pop().toLowerCase();
      fileType = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'docx';
    }

    const note = await Note.create({
      title,
      content,
      subject: subjectId,
      topic: topicId || null,
      fileUrl,
      fileType,
      isPublic: isPublic === 'true' || isPublic === true,
      category: category || 'Lecture Notes',
      user: req.user.id,
    });

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'note_upload',
      description: `Uploaded new study notes: "${note.title}"`,
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    next(error);
  }
};

// @desc    Get all notes (with search, filter, pagination)
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    const { subjectId, category, search, publicOnly } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};

    // Privacy filter
    if (publicOnly === 'true') {
      where.isPublic = true;
    } else {
      // By default show user's own notes, OR public notes
      where[Op.or] = [{ user: req.user.id }, { isPublic: true }];
    }

    if (subjectId) where.subject = subjectId;
    if (category) where.category = category;

    if (search) {
      const searchOp = Op.iLike || Op.like;
      const sanitizedSearch = escapeLikePattern(search);
      const searchCondition = {
        [Op.or]: [
          { title: { [searchOp]: `%${sanitizedSearch}%` } },
          { content: { [searchOp]: `%${sanitizedSearch}%` } },
        ],
      };

      if (where[Op.or]) {
        const existingOr = where[Op.or];
        delete where[Op.or];
        where[Op.and] = [{ [Op.or]: existingOr }, searchCondition];
      } else {
        where[Op.and] = searchCondition;
      }
    }

    const { count: total, rows: notes } = await Note.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: Subject, as: 'subjectRef' },
        { model: Topic, as: 'topicRef' },
        { model: User, as: 'userRef', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    const populatedNotes = notes.map((n) => {
      const json = n.toJSON();
      json.subject = json.subjectRef;
      json.topic = json.topicRef;
      if (json.userRef) {
        json.user = {
          _id: json.userRef.id,
          id: json.userRef.id,
          name: json.userRef.name,
          email: json.userRef.email,
        };
      }
      return json;
    });

    res.status(200).json({
      success: true,
      count: populatedNotes.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: populatedNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download / Increment note download count
// @route   PUT /api/notes/:id/download
// @access  Private
exports.downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const isOwner = note.user === req.user.id;
    if (!isOwner && !note.isPublic) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    note.downloadsCount += 1;
    await note.save();

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    // Path traversal guard — the afterDestroy hook on the model handles actual file deletion
    if (note.fileUrl) {
      const uploadsDir = path.resolve(path.join(__dirname, '../uploads'));
      const filePath = path.resolve(path.join(__dirname, '..', note.fileUrl));
      const relative = path.relative(uploadsDir, filePath);
      const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

      if (!isInside) {
        return res.status(400).json({ success: false, error: 'Invalid file path' });
      }
    }

    await note.destroy();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Summarize a note using AI (Gemini) and cache the result
// @route   POST /api/notes/:id/summarize
// @access  Private
exports.summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      where: { id: req.params.id, user: req.user.id },
      include: [{ model: Subject, as: 'subjectRef', attributes: ['name'] }],
    });

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    if (!note.content || note.content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note has no text content to summarize',
      });
    }

    const forceRefresh = req.body.forceRefresh === true;

    // Return cached summary if available and not forcing refresh
    if (note.aiSummary && !forceRefresh) {
      return res.status(200).json({ success: true, data: note.aiSummary, cached: true });
    }

    const subjectName = note.subjectRef?.name || 'the subject';
    const aiSummary = await summarizeNoteText(note.content, subjectName, forceRefresh);

    // Cache AI summary on the note record
    note.aiSummary = aiSummary;
    await note.save();

    res.status(200).json({ success: true, data: aiSummary, cached: false });
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
