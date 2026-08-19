const { DeckCollaborator, FlashcardDeck, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Invite a collaborator to a deck
// @route   POST /api/flashcard-decks/:deckId/collaborators
// @access  Private
exports.inviteCollaborator = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { email, username, role } = req.body;

    if (!email && !username) {
      return res.status(400).json({ success: false, error: 'Email or username is required' });
    }

    if (!['view', 'edit', 'admin'].includes(role)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid role. Must be view, edit, or admin' });
    }

    // Check if user is deck owner or admin
    const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    // Check if requester has admin rights
    const isAdmin = deck.user === req.user.id;
    const collaboratorAccess = await DeckCollaborator.findOne({
      where: { deckId, userId: req.user.id, role: 'admin', status: 'accepted' },
    });

    if (!isAdmin && !collaboratorAccess) {
      return res
        .status(403)
        .json({ success: false, error: 'Only deck owners or admins can invite collaborators' });
    }

    // Find the user to invite
    const whereClause = email ? { email } : { name: username };
    const targetUser = await User.findOne({ where: whereClause });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot invite yourself' });
    }

    // Check if already invited
    const existing = await DeckCollaborator.findOne({
      where: { deckId, userId: targetUser.id },
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res
          .status(400)
          .json({ success: false, error: 'User already has a pending invitation' });
      }
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, error: 'User is already a collaborator' });
      }
    }

    // Create invitation
    const collaborator = await DeckCollaborator.create({
      deckId,
      userId: targetUser.id,
      role,
      invitedBy: req.user.id,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: collaborator });
  } catch (error) {
    console.error('[deckCollaboratorController.inviteCollaborator] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Accept a collaboration invitation
// @route   PUT /api/flashcard-decks/:deckId/collaborators/accept
// @access  Private
exports.acceptInvitation = async (req, res) => {
  try {
    const { deckId } = req.params;

    const collaborator = await DeckCollaborator.findOne({
      where: { deckId, userId: req.user.id, status: 'pending' },
    });

    if (!collaborator) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    collaborator.status = 'accepted';
    await collaborator.save();

    res.status(200).json({ success: true, data: collaborator });
  } catch (error) {
    console.error('[deckCollaboratorController.acceptInvitation] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get all collaborators for a deck
// @route   GET /api/flashcard-decks/:deckId/collaborators
// @access  Private
exports.getCollaborators = async (req, res) => {
  try {
    const { deckId } = req.params;

    // Check if user has access to deck
    const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    const isOwner = deck.user === req.user.id;
    const collaborator = await DeckCollaborator.findOne({
      where: { deckId, userId: req.user.id, status: 'accepted' },
    });

    if (!isOwner && !collaborator) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const collaborators = await DeckCollaborator.findAll({
      where: { deckId },
      include: [
        { model: User, as: 'userRef', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'invitedByRef', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ success: true, data: collaborators });
  } catch (error) {
    console.error('[deckCollaboratorController.getCollaborators] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update collaborator role
// @route   PUT /api/flashcard-decks/:deckId/collaborators/:collaboratorId
// @access  Private
exports.updateCollaborator = async (req, res) => {
  try {
    const { deckId, collaboratorId } = req.params;
    const { role } = req.body;

    if (!['view', 'edit', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Check if requester is deck owner
    const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    if (deck.user !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, error: 'Only deck owner can update collaborator roles' });
    }

    const collaborator = await DeckCollaborator.findOne({
      where: { id: collaboratorId, deckId },
    });

    if (!collaborator) {
      return res.status(404).json({ success: false, error: 'Collaborator not found' });
    }

    // Cannot change own role
    if (collaborator.userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot change your own role' });
    }

    collaborator.role = role;
    await collaborator.save();

    res.status(200).json({ success: true, data: collaborator });
  } catch (error) {
    console.error('[deckCollaboratorController.updateCollaborator] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Remove a collaborator
// @route   DELETE /api/flashcard-decks/:deckId/collaborators/:collaboratorId
// @access  Private
exports.removeCollaborator = async (req, res) => {
  try {
    const { deckId, collaboratorId } = req.params;

    // Check if requester is deck owner
    const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    if (deck.user !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, error: 'Only deck owner can remove collaborators' });
    }

    const collaborator = await DeckCollaborator.findOne({
      where: { id: collaboratorId, deckId },
    });

    if (!collaborator) {
      return res.status(404).json({ success: false, error: 'Collaborator not found' });
    }

    await collaborator.destroy();

    res.status(200).json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('[deckCollaboratorController.removeCollaborator] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get user's pending invitations
// @route   GET /api/flashcard-decks/collaborators/pending
// @access  Private
exports.getPendingInvitations = async (req, res) => {
  try {
    const invitations = await DeckCollaborator.findAll({
      where: { userId: req.user.id, status: 'pending' },
      include: [
        {
          model: FlashcardDeck,
          as: 'deckRef',
          include: [{ model: User, as: 'userRef', attributes: ['id', 'name'] }],
        },
        { model: User, as: 'invitedByRef', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    console.error('[deckCollaboratorController.getPendingInvitations] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Check if user has access to a deck and their role
// @route   GET /api/flashcard-decks/:deckId/access
// @access  Private
exports.checkDeckAccess = async (req, res) => {
  try {
    const { deckId } = req.params;

    const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }

    // Owner has full access
    if (deck.user === req.user.id) {
      return res.status(200).json({
        success: true,
        data: { hasAccess: true, role: 'owner', canEdit: true, canAdmin: true },
      });
    }

    // Check collaborator access
    const collaborator = await DeckCollaborator.findOne({
      where: { deckId, userId: req.user.id, status: 'accepted' },
    });

    if (!collaborator) {
      return res.status(200).json({
        success: true,
        data: { hasAccess: false, role: null, canEdit: false, canAdmin: false },
      });
    }

    const canEdit = collaborator.role === 'edit' || collaborator.role === 'admin';
    const canAdmin = collaborator.role === 'admin';

    res.status(200).json({
      success: true,
      data: { hasAccess: true, role: collaborator.role, canEdit, canAdmin },
    });
  } catch (error) {
    console.error('[deckCollaboratorController.checkDeckAccess] Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
