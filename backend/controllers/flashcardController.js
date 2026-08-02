const { Op } = require('sequelize');
const fs = require('fs');
const Flashcard = require('../models/Flashcard');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const ActivityLog = require('../models/ActivityLog');
const Progress = require('../models/Progress');
const geminiService = require('../services/geminiService');
const { GeminiRateLimitError, GeminiServerError } = require('../services/geminiService');
const { default: Exporter } = require('anki-apkg-export');

// @desc    Generate AI Flashcards
// @route   POST /api/flashcards/generate-ai
// @access  Private
exports.generateAIFlashcards = async (req, res, next) => {
  try {
    const { subjectId, topicId, count } = req.body;

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    let topicName = 'General overview';
    if (topicId) {
      const topicObj = await Topic.findByPk(topicId);
      if (topicObj) topicName = topicObj.name;
    }

    // Load notes for context (prioritize topic-specific notes if topicId provided, fallback to subject notes)
    const noteFilter = { subject: subjectId, user: req.user.id };
    if (topicId) {
      noteFilter.topic = topicId;
    }
    let notes = await Note.findAll({ where: noteFilter });
    if ((!notes || notes.length === 0) && topicId) {
      notes = await Note.findAll({ where: { subject: subjectId, user: req.user.id } });
    }
    let notesText = '';
    if (notes && notes.length > 0) {
      notesText = notes
        .map((n) => n.content || '')
        .join('\n');
    }

    // Call Gemini
    const cardsList = await geminiService.generateFlashcards(
      subject.name,
      topicName,
      notesText,
      count || 6
    );

    const cardsToInsert = cardsList.map((card) => ({
      user: req.user.id,
      subject: subjectId,
      topic: topicId || null,
      front: card.front,
      back: card.back,
    }));
    const createdCards = await Flashcard.bulkCreate(cardsToInsert);

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'flashcard_review',
      description: `Generated ${createdCards.length} AI flashcards for ${topicName}`,
    });

    res.status(201).json({ success: true, count: createdCards.length, data: createdCards });
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

// @desc    Create manual Flashcard
// @route   POST /api/flashcards
// @access  Private
exports.createFlashcard = async (req, res, next) => {
  try {
    const { subjectId, topicId, front, back } = req.body;
    const card = await Flashcard.create({
      user: req.user.id,
      subject: subjectId,
      topic: topicId || null,
      front,
      back,
    });
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

// @desc    Get flashcards for review (due cards)
// @route   GET /api/flashcards
// @access  Private
exports.getFlashcards = async (req, res, next) => {
  try {
    const { subjectId, dueOnly } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const filter = { user: req.user.id };

    if (subjectId) filter.subject = subjectId;
    if (dueOnly === 'true') {
      filter.nextReviewDate = { [Op.lte]: new Date() };
    }

    const { count: total, rows: cards } = await Flashcard.findAndCountAll({
      where: filter,
      distinct: true,
      include: [
        { model: Subject, as: 'subjectRef' },
        { model: Topic, as: 'topicRef' },
      ],
      order: [
        ['nextReviewDate', 'ASC'],
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      offset,
      limit,
      subQuery: false,
    });

    const populatedCards = cards.map((c) => {
      const json = c.toJSON();
      json.subject = json.subjectRef;
      json.topic = json.topicRef;
      return json;
    });

    res.status(200).json({
      success: true,
      count: populatedCards.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: populatedCards,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a Flashcard (Update SM-2 variables)
// @route   PUT /api/flashcards/:id/review
// @access  Private
exports.reviewFlashcard = async (req, res, next) => {
  try {
    const { quality } = req.body; // quality rating: 0 to 5
    if (quality === undefined || quality < 0 || quality > 5) {
      return res
        .status(400)
        .json({ success: false, error: 'Provide a quality score between 0 and 5' });
    }

    const card = await Flashcard.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!card) {
      return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }

    // SuperMemo SM-2 Algorithm
    let { interval, repetitions, efactor } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    // Adjust E-Factor
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    card.interval = interval;
    card.repetitions = repetitions;
    card.efactor = efactor;

    // Set next review date from now
    card.nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    await card.save();

    // If card is mastered (quality >= 4), increment mastered count in progress
    // NOTE: progress entries are tracked both for topic-level flashcards (topic: id)
    //       AND subject-level flashcards (topic: null) — we no longer skip the latter.
    //       Progress row is atomically upserted via findOrCreate so rows are created
    //       dynamically even if user reviews cards before ever taking a quiz.
    if (quality >= 4) {
      const progressTopic = card.topic || null;
      const [progress] = await Progress.findOrCreate({
        where: {
          user: req.user.id,
          subject: card.subject,
          topic: progressTopic,
        },
        defaults: {
          user: req.user.id,
          subject: card.subject,
          topic: progressTopic,
          flashcardsMastered: 0,
          completionPercentage: 0,
          studyHours: 0,
        },
      });
      progress.flashcardsMastered += 1;
      await progress.save();
    }

    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private
exports.deleteFlashcard = async (req, res, next) => {
  try {
    const card = await Flashcard.findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!card) {
      return res.status(404).json({ success: false, error: 'Flashcard not found' });
    }
    await card.destroy();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

/**
 * Escape a CSV field value: wrap in quotes if it contains comma, quote, or newline.
 * @param {string|null|undefined} val
 * @returns {string}
 */
function csvField(val) {
  const str = val == null ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

// @desc    Export flashcards as JSON or CSV
// @route   GET /api/flashcards/export?subjectId=...&format=json|csv
// @access  Private
exports.exportFlashcards = async (req, res, next) => {
  try {
    const { subjectId, format = 'json' } = req.query;

    if (!['json', 'csv', 'apkg'].includes(format)) {
      return res.status(400).json({ success: false, error: 'format must be "json", "csv", or "apkg"' });
    }

    const filter = { user: req.user.id };
    if (subjectId) filter.subject = subjectId;

    const cards = await Flashcard.findAll({
      where: filter,
      include: [
        { model: Subject, as: 'subjectRef', attributes: ['name'] },
        { model: Topic, as: 'topicRef', attributes: ['name'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    const payload = cards.map((c) => ({
      front: c.front,
      back: c.back,
      subject: c.subjectRef ? c.subjectRef.name : null,
      topic: c.topicRef ? c.topicRef.name : null,
    }));

    if (format === 'csv') {
      const header = 'front,back,subject,topic';
      const rows = payload.map(
        (p) => `${csvField(p.front)},${csvField(p.back)},${csvField(p.subject)},${csvField(p.topic)}`
      );
      const csv = [header, ...rows].join('\r\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flashcards.csv"');
      return res.status(200).send(csv);
    }

    if (format === 'apkg') {
      const exporter = new Exporter('OpenPrep Flashcards');
      
      payload.forEach(c => {
        const tags = [];
        if (c.subject) tags.push(c.subject.replace(/\s+/g, '_'));
        if (c.topic) tags.push(c.topic.replace(/\s+/g, '_'));
        
        // Add basic HTML formatting for cards
        const frontHtml = `<div style="text-align:center;font-size:24px;">${c.front}</div>`;
        const backHtml = `<div style="text-align:center;font-size:20px;">${c.back}</div>`;
        
        exporter.addCard(frontHtml, backHtml, { tags });
      });

      const zipBuffer = await exporter.save();
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="flashcards.apkg"');
      return res.status(200).send(zipBuffer);
    }

    // JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="flashcards.json"');
    return res.status(200).json({ success: true, count: payload.length, data: payload });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Parse a minimal RFC 4180 CSV into an array of objects with keys from the
 * header row.  Handles quoted fields and escaped double-quotes.
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  function splitLine(line) {
    const fields = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuote = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuote = true;
        } else if (ch === ',') {
          fields.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
    }
    fields.push(cur);
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    records.push(obj);
  }

  return records;
}

// @desc    Import flashcards from CSV/JSON file or raw JSON body
// @route   POST /api/flashcards/import
// @access  Private
exports.importFlashcards = async (req, res, next) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'subjectId query parameter is required' });
    }

    const subject = await Subject.findOne({
      where: { id: subjectId, user: req.user.id },
    });
    if (!subject) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    let records = [];

    if (req.file) {
      // File upload path
      const raw = fs.readFileSync(req.file.path, 'utf8');
      fs.unlinkSync(req.file.path); // clean up immediately

      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return res.status(400).json({ success: false, error: 'Invalid JSON file' });
        }
        records = Array.isArray(parsed) ? parsed : parsed.data || [];
      } else {
        // CSV
        records = parseCSV(raw);
      }
    } else if (req.body && Array.isArray(req.body.cards)) {
      // Raw JSON body fallback
      records = req.body.cards;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide a CSV/JSON file via multipart upload or a JSON body with a "cards" array',
      });
    }

    // Validate and normalise records
    const valid = [];
    const invalid = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const front = typeof r.front === 'string' ? r.front.trim() : '';
      const back = typeof r.back === 'string' ? r.back.trim() : '';

      if (!front || !back) {
        invalid.push({ index: i, reason: 'front and back are required' });
        continue;
      }
      if (front.length > 5000 || back.length > 5000) {
        invalid.push({ index: i, reason: 'front/back must be at most 5000 characters' });
        continue;
      }

      valid.push({
        user: req.user.id,
        subject: subject.id,
        topic: null,
        front,
        back,
      });
    }

    if (valid.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid flashcard records found in the provided data',
        invalid,
      });
    }

    const created = await Flashcard.bulkCreate(valid);

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'flashcard_review',
      description: `Imported ${created.length} flashcard(s) into subject "${subject.name}"`,
    });

    return res.status(201).json({
      success: true,
      imported: created.length,
      skipped: invalid.length,
      invalid,
      data: created,
    });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    next(error);
  }
};
