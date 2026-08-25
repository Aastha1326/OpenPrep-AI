const express = require('express');
const {
  createDeck,
  getDecks,
  getDeckById,
  deleteDeck,
  shareDeck,
  getPublicDeckById,
  updateDeckVisibility,
  getLeitnerStats,
} = require('../controllers/flashcardDeckController');
const {
  inviteCollaborator,
  acceptInvitation,
  getCollaborators,
  updateCollaborator,
  removeCollaborator,
  getPendingInvitations,
  checkDeckAccess,
} = require('../controllers/deckCollaboratorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createDeck)
  .get(protect, getDecks);

router.route('/:id')
  .get(protect, getDeckById)
  .delete(protect, deleteDeck);

router.get('/:id/leitner-stats', protect, getLeitnerStats);
router.post('/:id/share', protect, shareDeck);
router.patch('/:id/visibility', protect, updateDeckVisibility);

// Collaborator routes
router.route('/:deckId/collaborators')
  .post(protect, inviteCollaborator)
  .get(protect, getCollaborators);

router.put('/:deckId/collaborators/accept', protect, acceptInvitation);

router.route('/:deckId/collaborators/:collaboratorId')
  .put(protect, updateCollaborator)
  .delete(protect, removeCollaborator);

router.get('/collaborators/pending', protect, getPendingInvitations);
router.get('/:deckId/access', protect, checkDeckAccess);

module.exports = router;
