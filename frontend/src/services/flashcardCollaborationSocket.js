import { io } from 'socket.io-client';

class FlashcardCollaborationSocket {
  constructor() {
    this.socket = null;
    this.currentDeckId = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return this.socket;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupDefaultListeners();
    return this.socket;
  }

  disconnect() {
    if (this.currentDeckId) {
      this.leaveDeck(this.currentDeckId);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  setupDefaultListeners() {
    this.socket.on('deck:error', (data) => {
      this.emit('error', data);
    });

    this.socket.on('deck:card:conflict', (data) => {
      this.emit('card:conflict', data);
    });
  }

  joinDeck(deckId) {
    if (!this.socket) return;

    if (this.currentDeckId && this.currentDeckId !== deckId) {
      this.leaveDeck(this.currentDeckId);
    }

    this.currentDeckId = deckId;
    this.socket.emit('deck:join', { deckId });
  }

  leaveDeck(deckId) {
    if (!this.socket) return;

    this.socket.emit('deck:leave', { deckId });
    if (this.currentDeckId === deckId) {
      this.currentDeckId = null;
    }
  }

  createCard(deckId, cardData) {
    if (!this.socket) return;
    this.socket.emit('deck:card:create', { deckId, cardData });
  }

  updateCard(deckId, cardId, cardData) {
    if (!this.socket) return;
    this.socket.emit('deck:card:update', { deckId, cardId, cardData });
  }

  deleteCard(deckId, cardId) {
    if (!this.socket) return;
    this.socket.emit('deck:card:delete', { deckId, cardId });
  }

  setTyping(deckId, isTyping) {
    if (!this.socket) return;
    this.socket.emit('deck:typing', { deckId, isTyping });
  }

  on(event, callback) {
    if (!this.socket) return;

    this.listeners.set(event, callback);

    this.socket.on(`deck:${event}`, (data) => {
      const listener = this.listeners.get(event);
      if (listener) listener(data);
    });
  }

  off(event) {
    if (!this.socket) return;

    this.listeners.delete(event);
    this.socket.off(`deck:${event}`);
  }

  emit(event, data) {
    const listener = this.listeners.get(event);
    if (listener) listener(data);
  }
}

export const flashcardCollaborationSocket = new FlashcardCollaborationSocket();
