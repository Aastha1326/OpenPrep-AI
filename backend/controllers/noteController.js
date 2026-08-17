const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const sanitizeHtml = require('sanitize-html');
const { Op } = require('sequelize');
const Note = require('../models/Note');const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { escapeLikePattern } = require('../utils/likePattern');
const { summarizeNoteText, transcribeAndSummarizeAudio } = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');
const { extractTextFromImage } = require('../services/ocrService');

// Helper to escape regex special characters if regex search is used anywhere
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Export all of the authenticated user's notes as JSON or a Markdown ZIP
// @route   GET /api/notes/export
// @access  Private
exports.exportNotes = async (req, res, next) => {
  try {
    const format = req.query.format === 'zip' ? 'zip' : 'json';

    const notes = await Note.findAll({
      where: { user: req.user.id },
      include: [{ model: Subject, as: 'subjectRef', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    if (format === 'json') {
      const data = notes.map((n) => ({
        title: n.title,
        content: n.content,
        subject: n.subjectRef?.name || null,
        category: n.category,
        createdAt: n.createdAt,
      }));
      res.setHeader('Content-Disposition', 'attachment; filename="openprep-notes.json"');
      return res.status(200).json({ success: true, data });
    }

    // ZIP export — one .md file per note with a small metadata header
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="openprep-notes.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => next(err));
    archive.pipe(res);

    notes.forEach((note, index) => {
      const safeTitle = note.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || `note-${index + 1}`;
      const frontMatter = [
        '---',
        `title: ${note.title}`,
        `subject: ${note.subjectRef?.name || ''}`,
        `category: ${note.category}`,
        `createdAt: ${note.createdAt.toISOString()}`,
        '---',
        '',
      ].join('\n');
      archive.append(`${frontMatter}${note.content || ''}`, { name: `${safeTitle}.md` });
    });

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

// @desc    Import one or more Markdown files as new notes
// @route   POST /api/notes/import
// @access  Private
exports.importNotes = async (req, res, next) => {
  try {
    const { subjectId, topicId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one .md file' });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const createdNotes = [];

    for (const file of req.files) {
      const rawText = file.buffer.toString('utf8');
      const headingMatch = rawText.match(/^#\s+(.+)$/m);
      const title = (headingMatch ? headingMatch[1] : path.parse(file.originalname).name).slice(0, 100);

      // Strip any HTML/script payloads hiding inside the imported Markdown
      const safeContent = sanitizeHtml(rawText, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
        allowedAttributes: {},
      });

      const note = await Note.create({
        title: title || 'Imported Note',
        content: safeContent,
        subject: subjectId,
        topic: topicId || null,
        fileType: 'text',
        category: 'Other',
        user: req.user.id,
      });

      createdNotes.push(note);
    }

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'note_upload',
      description: `Imported ${createdNotes.length} note(s) from Markdown`,
    });

    res.status(201).json({ success: true, count: createdNotes.length, data: createdNotes });
  } catch (error) {
    next(error);
  }
};

// @desc    Summarize a note using AI (Gemini) and cache the result
// @route   POST /api/notes/:id/summarize
// @access  Private

exports.uploadNote = async (req, res, next) => {
  try {
    const { title, content, subjectId, topicId, isPublic, category, tags } = req.body;

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
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []),
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

// @desc    Extract text from an uploaded image via OCR
// @route   POST /api/notes/ocr-upload
// @access  Private
exports.uploadOcrNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const validExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const invalidExts = ['.gif', '.bmp'];

    if (invalidExts.includes(ext)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Unsupported format: GIF and BMP are not allowed for OCR.' });
    }

    if (!validExts.includes(ext)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Please upload a valid image file (.png, .jpg, .jpeg, .webp).' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Process OCR
    const { extractedText, confidence, wordCount } = await extractTextFromImage(fileBuffer);
    
    // Sanitize extracted text
    const sanitizedText = sanitizeHtml(extractedText, {
      allowedTags: [], // Strip all HTML from OCR
      allowedAttributes: {}
    });

    // Optionally cleanup the uploaded file if we don't want to store raw image beyond this endpoint,
    // but the issue allows storing as Note later. The prompt says "Do not store unnecessary OCR worker data or raw image data beyond the project's existing upload/storage flow."
    // We will keep the file in /uploads and let the frontend use its URL to create a Note.

    res.status(200).json({
      success: true,
      data: {
        extractedText: sanitizedText,
        confidence,
        wordCount,
        fileUrl: `/uploads/${req.file.filename}`,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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
    if (req.query.tag) {
      where.tags = { [Op.contains]: [req.query.tag] };
    }

    if (search) {
      // Sanitize search string to prevent regex or LIKE injection/errors
      const sanitizedQuery = escapeRegex(search);
      const searchOp = Op.iLike || Op.like;
      const sanitizedSearch = escapeLikePattern(sanitizedQuery);
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

// @desc    Upload & Process Voice Note
// @route   POST /api/notes/voice
// @access  Private
exports.uploadVoiceNote = async (req, res, next) => {
  try {
    const { title, subjectId, topicId, isPublic } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an audio file' });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = req.file.mimetype;

    // Transcribe and summarize voice note via Gemini API
    const audioResult = await transcribeAndSummarizeAudio(fileBuffer, mimeType, subject.name);

    const note = await Note.create({
      title,
      content: audioResult.transcription || 'No transcription generated',
      subject: subjectId,
      topic: topicId || null,
      fileUrl,
      fileType: 'audio',
      isPublic: isPublic === 'true' || isPublic === true,
      category: 'Summary',
      aiSummary: {
        summary: audioResult.summary || '',
        keyConcepts: audioResult.keyConcepts || [],
        examTips: audioResult.examTips || [],
      },
      user: req.user.id,
    });

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'note_upload',
      description: `Uploaded and summarized voice note: "${note.title}"`,
    });

    res.status(201).json({ success: true, data: note });
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

// @desc    Update Note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content, isPublic, category, tags } = req.body;
    const note = await Note.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found or access denied' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (isPublic !== undefined) note.isPublic = isPublic === 'true' || isPublic === true;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);

    await note.save();
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invite link for collaboration
// @route   POST /api/notes/:id/share
// @access  Private
exports.shareCollaboration = async (req, res, next) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    note.isCollaborative = true;
    await note.save();

    const inviteLink = `/notes/collaborative/${note.id}`;

    res.status(200).json({
      success: true,
      data: {
        isCollaborative: true,
        inviteLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note details
// @route   GET /api/notes/:id
// @access  Private
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findByPk(req.params.id, {
      include: [{ model: Subject, as: 'subjectRef', attributes: ['name'] }],
    });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const isOwner = note.user === req.user.id;
    if (!isOwner && !note.isCollaborative && !note.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied to this note' });
    }

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};
