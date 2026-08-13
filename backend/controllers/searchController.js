const { Op } = require('sequelize');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Flashcard = require('../models/Flashcard');
const Syllabus = require('../models/Syllabus');

exports.universalSearch = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { q, category = 'all', page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, error: 'Search query parameter "q" is required' });
    }

    const searchTerm = `%${q.trim()}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchLimit = parseInt(limit);

    let notes = [], pyqs = [], flashcards = [], syllabi = [];

    // Run parallel queries based on category filter
    const promises = [];

    if (category === 'all' || category === 'notes') {
      promises.push(
        Note.findAll({
          where: { [Op.or]: [{ title: { [Op.iLike]: searchTerm } }, { content: { [Op.iLike]: searchTerm } }] },
          limit: searchLimit,
          offset,
        }).then((res) => { notes = res.map(item => ({ id: item.id, title: item.title, snippet: item.content, type: 'notes' })); })
      );
    }

    if (category === 'all' || category === 'pyqs') {
      promises.push(
        PYQ.findAll({
          where: { [Op.or]: [{ question: { [Op.iLike]: searchTerm } }, { solution: { [Op.iLike]: searchTerm } }] },
          limit: searchLimit,
          offset,
        }).then((res) => { pyqs = res.map(item => ({ id: item.id, title: item.question, snippet: item.solution, type: 'pyqs' })); })
      );
    }

    if (category === 'all' || category === 'flashcards') {
      promises.push(
        Flashcard.findAll({
          where: { [Op.or]: [{ front: { [Op.iLike]: searchTerm } }, { back: { [Op.iLike]: searchTerm } }] },
          limit: searchLimit,
          offset,
        }).then((res) => { flashcards = res.map(item => ({ id: item.id, title: item.front, snippet: item.back, type: 'flashcards' })); })
      );
    }

    if (category === 'all' || category === 'syllabi') {
      promises.push(
        Syllabus.findAll({
          where: { [Op.or]: [{ topic: { [Op.iLike]: searchTerm } }, { description: { [Op.iLike]: searchTerm } }] },
          limit: searchLimit,
          offset,
        }).then((res) => { syllabi = res.map(item => ({ id: item.id, title: item.topic, snippet: item.description, type: 'syllabi' })); })
      );
    }

    await Promise.all(promises);

    const combinedResults = [...notes, ...pyqs, ...flashcards, ...syllabi];
    const executionTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      query: q,
      executionTimeMs: executionTime,
      count: combinedResults.length,
      data: {
        notes,
        pyqs,
        flashcards,
        syllabi,
        all: combinedResults,
      },
    });
  } catch (error) {
    next(error);
  }
};
