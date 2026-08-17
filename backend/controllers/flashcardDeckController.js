const { FlashcardDeck, Flashcard, Subject, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new flashcard deck
// @route   POST /api/flashcard-decks
// @access  Private
exports.createDeck = async (req, res) => {
  try {
    const { name, subject } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Deck name is required' });
    }

    const deck = await FlashcardDeck.create({
      name,
      subject: subject || null,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    console.error('[flashcardDeckController.createDeck] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get user's flashcard decks
// @route   GET /api/flashcard-decks
// @access  Private
exports.getDecks = async (req, res) => {
  try {
    const decks = await FlashcardDeck.findAll({
      where: { user: req.user.id },
      include: [
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Add card counts for each deck
    const data = await Promise.all(
      decks.map(async (deck) => {
        const cardCount = await Flashcard.count({ where: { deckId: deck.id } });
        return {
          ...deck.toJSON(),
          cardCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[flashcardDeckController.getDecks] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get specific flashcard deck and its cards
// @route   GET /api/flashcard-decks/:id
// @access  Private
exports.getDeckById = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      where: { id: req.params.id, user: req.user.id },
      include: [
        { model: Subject, as: 'subjectRef', attributes: ['id', 'name'] },
      ],
    });

    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    const cards = await Flashcard.findAll({
      where: { deckId: deck.id },
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        deck,
        cards,
      },
    });
  } catch (error) {
    console.error('[flashcardDeckController.getDeckById] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete a flashcard deck
// @route   DELETE /api/flashcard-decks/:id
// @access  Private
exports.deleteDeck = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    await deck.destroy();

    res.status(200).json({
      success: true,
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    console.error('[flashcardDeckController.deleteDeck] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Share a flashcard deck publicly
// @route   POST /api/flashcard-decks/:id/share
// @access  Private
exports.shareDeck = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    // Check if cards exist in the deck
    const cardCount = await Flashcard.count({ where: { deckId: deck.id } });
    if (cardCount === 0) {
      return res.status(400).json({ success: false, error: 'Cannot share an empty deck' });
    }

    if (!deck.shareToken) {
      deck.shareToken = uuidv4();
    }
    deck.isPublic = true;
    await deck.save();

    res.status(200).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    console.error('[flashcardDeckController.shareDeck] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get shared deck metadata and card list (Public)
// @route   GET /api/share/:shareToken
// @access  Public
exports.getSharedDeck = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      where: { shareToken: req.params.shareToken, isPublic: true },
      include: [
        { model: User, as: 'userRef', attributes: ['name'] },
      ],
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard deck not found, or it is no longer public',
      });
    }

    const cards = await Flashcard.findAll({
      where: { deckId: deck.id },
      attributes: ['id', 'front', 'back', 'hint', 'tags'],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        deck: {
          id: deck.id,
          name: deck.name,
          cloneCount: deck.cloneCount,
          createdAt: deck.createdAt,
          ownerName: deck.userRef ? deck.userRef.name : 'Peer Student',
        },
        cards,
      },
    });
  } catch (error) {
    console.error('[flashcardDeckController.getSharedDeck] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Clone shared deck into logged-in user's library
// @route   POST /api/share/:shareToken/clone
// @access  Private
exports.cloneSharedDeck = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findOne({
      where: { shareToken: req.params.shareToken, isPublic: true },
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard deck not found, or it is no longer public',
      });
    }

    if (deck.user === req.user.id) {
      return res.status(400).json({ success: false, error: 'You already own this deck.' });
    }

    // Duplicate deck
    const clonedDeck = await FlashcardDeck.create({
      name: `${deck.name} (Cloned)`,
      subject: deck.subject,
      user: req.user.id,
      isPublic: false,
      shareToken: null,
      cloneCount: 0,
    });

    // Duplicate all cards
    const originalCards = await Flashcard.findAll({ where: { deckId: deck.id } });
    if (originalCards && originalCards.length > 0) {
      const clonedCards = originalCards.map((c) => ({
        user: req.user.id,
        subject: c.subject,
        topic: c.topic || null,
        front: c.front,
        back: c.back,
        hint: c.hint,
        tags: c.tags,
        deckId: clonedDeck.id,
        interval: 1,
        repetitions: 0,
        efactor: 2.5,
        nextReviewDate: new Date(),
      }));
      await Flashcard.bulkCreate(clonedCards);
    }

    // Increment clone count on original deck
    deck.cloneCount = (deck.cloneCount || 0) + 1;
    await deck.save();

    res.status(201).json({
      success: true,
      data: clonedDeck,
    });
  } catch (error) {
    console.error('[flashcardDeckController.cloneSharedDeck] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
