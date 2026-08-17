const { FlashcardDeck, DeckCollaborator, Flashcard, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Real-time collaboration for flashcard decks.
 * Handles card CRUD operations, presence, and typing indicators.
 */

const TYPING_DEBOUNCE_MS = 1000;
const TYPING_TIMEOUT_MS = 3000;

/** deckId -> { participants: Map<socketId, {userId, name, role, typing, lastTyping}> } */
const deckRooms = new Map();

/** cardId -> { lastEdit: timestamp, editorUserId, editorSocketId } */
const cardLocks = new Map();

function getDeckRoom(deckId) {
  if (!deckRooms.has(deckId)) {
    deckRooms.set(deckId, {
      participants: new Map(),
      cardStates: new Map(),
    });
  }
  return deckRooms.get(deckId);
}

function releaseDeckRoom(deckId, socketId) {
  const room = deckRooms.get(deckId);
  if (!room) return;

  room.participants.delete(socketId);
  if (room.participants.size === 0) {
    deckRooms.delete(deckId);
  }
}

/**
 * Check if user has access to deck with required permission level
 */
async function checkDeckAccess(deckId, userId, requiredRole = 'view') {
  const deck = await FlashcardDeck.findOne({ where: { id: deckId } });
  if (!deck) return { hasAccess: false, reason: 'Deck not found' };

  // Owner has full access
  if (deck.user === userId) {
    return { hasAccess: true, role: 'owner' };
  }

  // Check collaborator access
  const collaborator = await DeckCollaborator.findOne({
    where: { deckId, userId, status: 'accepted' },
  });

  if (!collaborator) {
    return { hasAccess: false, reason: 'Not a collaborator' };
  }

  // Role hierarchy: admin > edit > view
  const roleHierarchy = { admin: 3, edit: 2, view: 1 };
  if (roleHierarchy[collaborator.role] < roleHierarchy[requiredRole]) {
    return { hasAccess: false, reason: 'Insufficient permissions' };
  }

  return { hasAccess: true, role: collaborator.role };
}

/**
 * Conflict resolution: Last-write-wins with version checking
 */
async function resolveCardEdit(cardId, newFront, newBack, userId) {
  const card = await Flashcard.findByPk(cardId);
  if (!card) return { success: false, error: 'Card not found' };

  const lock = cardLocks.get(cardId);
  const now = Date.now();

  // Release stale locks (older than 5 seconds)
  if (lock && now - lock.lastEdit > 5000) {
    cardLocks.delete(cardId);
  }

  // Check if card is being edited by someone else
  if (lock && lock.editorUserId !== userId) {
    // Return current state for client to resolve
    return {
      success: false,
      conflict: true,
      currentData: { front: card.front, back: card.back },
      editor: lock.editorUserId,
    };
  }

  // Acquire lock
  cardLocks.set(cardId, {
    lastEdit: now,
    editorUserId: userId,
  });

  // Apply changes
  card.front = newFront;
  card.back = newBack;
  await card.save();

  // Release lock after save
  cardLocks.delete(cardId);

  return { success: true, data: card };
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userName = socket.user?.name;

    if (!userId) return;

    // Join deck collaboration room
    socket.on('deck:join', async ({ deckId }) => {
      if (!deckId) return;

      try {
        const access = await checkDeckAccess(deckId, userId, 'view');
        if (!access.hasAccess) {
          socket.emit('deck:error', { message: access.reason });
          return;
        }

        const room = getDeckRoom(deckId);
        socket.join(`deck:${deckId}`);

        room.participants.set(socket.id, {
          userId,
          name: userName,
          role: access.role,
          typing: false,
          lastTyping: 0,
        });

        // Broadcast participant list
        const participants = Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          typing: p.typing,
        }));

        io.to(`deck:${deckId}`).emit('deck:participants', { participants });

        // Send current deck state
        const cards = await Flashcard.findAll({
          where: { deckId },
          order: [['createdAt', 'ASC']],
        });

        socket.emit('deck:sync', { cards, role: access.role });
      } catch (error) {
        logger.error('Error joining deck room:', error);
        socket.emit('deck:error', { message: 'Failed to join deck' });
      }
    });

    // Leave deck collaboration room
    socket.on('deck:leave', ({ deckId }) => {
      if (!deckId) return;

      socket.leave(`deck:${deckId}`);
      releaseDeckRoom(deckId, socket.id);

      const room = deckRooms.get(deckId);
      if (room) {
        const participants = Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          typing: p.typing,
        }));
        io.to(`deck:${deckId}`).emit('deck:participants', { participants });
      }
    });

    // Create card
    socket.on('deck:card:create', async ({ deckId, cardData }) => {
      if (!deckId || !cardData) return;

      try {
        const access = await checkDeckAccess(deckId, userId, 'edit');
        if (!access.hasAccess) {
          socket.emit('deck:error', { message: 'No edit permission' });
          return;
        }

        const card = await Flashcard.create({
          user: userId,
          deckId,
          front: cardData.front,
          back: cardData.back,
          subject: cardData.subject || null,
          topic: cardData.topic || null,
          tags: cardData.tags || [],
          difficulty: cardData.difficulty || null,
        });

        io.to(`deck:${deckId}`).emit('deck:card:created', { card });
      } catch (error) {
        logger.error('Error creating card:', error);
        socket.emit('deck:error', { message: 'Failed to create card' });
      }
    });

    // Update card
    socket.on('deck:card:update', async ({ deckId, cardId, cardData }) => {
      if (!deckId || !cardId || !cardData) return;

      try {
        const access = await checkDeckAccess(deckId, userId, 'edit');
        if (!access.hasAccess) {
          socket.emit('deck:error', { message: 'No edit permission' });
          return;
        }

        const result = await resolveCardEdit(cardId, cardData.front, cardData.back, userId);

        if (!result.success) {
          if (result.conflict) {
            socket.emit('deck:card:conflict', {
              cardId,
              currentData: result.currentData,
            });
          } else {
            socket.emit('deck:error', { message: result.error || 'Failed to update card' });
          }
          return;
        }

        io.to(`deck:${deckId}`).emit('deck:card:updated', { card: result.data });
      } catch (error) {
        logger.error('Error updating card:', error);
        socket.emit('deck:error', { message: 'Failed to update card' });
      }
    });

    // Delete card
    socket.on('deck:card:delete', async ({ deckId, cardId }) => {
      if (!deckId || !cardId) return;

      try {
        const access = await checkDeckAccess(deckId, userId, 'edit');
        if (!access.hasAccess) {
          socket.emit('deck:error', { message: 'No edit permission' });
          return;
        }

        const card = await Flashcard.findOne({ where: { id: cardId, deckId } });
        if (!card) {
          socket.emit('deck:error', { message: 'Card not found' });
          return;
        }

        await card.destroy();
        io.to(`deck:${deckId}`).emit('deck:card:deleted', { cardId });
      } catch (error) {
        logger.error('Error deleting card:', error);
        socket.emit('deck:error', { message: 'Failed to delete card' });
      }
    });

    // Typing indicator
    socket.on('deck:typing', ({ deckId, isTyping }) => {
      if (!deckId) return;

      const room = deckRooms.get(deckId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      participant.typing = isTyping;
      participant.lastTyping = Date.now();

      // Broadcast typing status (excluding sender)
      socket.to(`deck:${deckId}`).emit('deck:typing', {
        userId,
        name: userName,
        isTyping,
      });

      // Auto-clear typing after timeout
      if (isTyping) {
        setTimeout(() => {
          const currentRoom = deckRooms.get(deckId);
          const currentParticipant = currentRoom?.participants.get(socket.id);
          if (
            currentParticipant &&
            Date.now() - currentParticipant.lastTyping >= TYPING_TIMEOUT_MS
          ) {
            currentParticipant.typing = false;
            socket.to(`deck:${deckId}`).emit('deck:typing', {
              userId,
              name: userName,
              isTyping: false,
            });
          }
        }, TYPING_TIMEOUT_MS);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [deckId, room] of deckRooms.entries()) {
        if (room.participants.has(socket.id)) {
          releaseDeckRoom(deckId, socket.id);

          const participants = Array.from(room.participants.values()).map((p) => ({
            userId: p.userId,
            name: p.name,
            role: p.role,
            typing: p.typing,
          }));
          io.to(`deck:${deckId}`).emit('deck:participants', { participants });
        }
      }
    });
  });
};

// Export for testing
module.exports.deckRooms = deckRooms;
module.exports.cardLocks = cardLocks;
module.exports.checkDeckAccess = checkDeckAccess;
