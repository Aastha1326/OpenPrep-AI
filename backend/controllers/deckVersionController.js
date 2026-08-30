const deckVersionService = require('../services/deckVersionService');
const DeckFork = require('../models/DeckFork');
const DeckSuggestion = require('../models/DeckSuggestion');

/**
 * @desc    Submit a suggested improvement / PR to a flashcard deck
 * @route   POST /api/deck-versioning/:deckId/suggest
 * @access  Private
 */
exports.submitSuggestion = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { title, description, baseCards = [], proposedCards = [] } = req.body;

    const diffReport = deckVersionService.computeCardDiffs(baseCards, proposedCards);

    const suggestion = await DeckSuggestion.create({
      deckId,
      authorUserId: req.user.id,
      title: title || 'Suggested card revisions',
      description,
      status: 'PENDING',
      diffReport,
    });

    return res.status(201).json({ success: true, data: suggestion });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get suggestions for a deck
 * @route   GET /api/deck-versioning/:deckId/suggestions
 * @access  Private
 */
exports.getDeckSuggestions = async (req, res) => {
  try {
    const { deckId } = req.params;
    const suggestions = await DeckSuggestion.findAll({
      where: { deckId },
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: suggestions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Approve or reject a suggestion
 * @route   PATCH /api/deck-versioning/suggestions/:id/status
 * @access  Private
 */
exports.updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const suggestion = await DeckSuggestion.findByPk(id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    suggestion.status = status;
    await suggestion.save();

    return res.json({ success: true, data: suggestion });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
