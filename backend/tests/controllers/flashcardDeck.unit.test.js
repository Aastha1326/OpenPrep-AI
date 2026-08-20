const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const flashcardDeckRoutes = require('../../routes/flashcardDeckRoutes');
const shareRoutes = require('../../routes/shareRoutes');
const publicDeckRoutes = require('../../routes/publicDeckRoutes');
const errorHandler = require('../../middleware/error');
const User = require('../../models/User');
const Subject = require('../../models/Subject');
const Exam = require('../../models/Exam');
const FlashcardDeck = require('../../models/FlashcardDeck');
const Flashcard = require('../../models/Flashcard');

const app = express();
app.use(express.json());
app.use('/api/flashcard-decks', flashcardDeckRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/decks', publicDeckRoutes);
app.use(errorHandler);

describe('Flashcard Deck Sharing & Cloning API', () => {
  let testUser;
  let peerUser;
  let authToken;
  let peerToken;
  let testSubject;
  let testExam;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_flashcard_decks';

    testUser = await User.create({
      name: 'Deck Creator',
      email: 'creator@example.com',
      password: 'password123',
    });

    peerUser = await User.create({
      name: 'Cloner User',
      email: 'cloner@example.com',
      password: 'password123',
    });

    authToken = jwt.sign({ id: testUser.id, type: 'access' }, process.env.JWT_SECRET);
    peerToken = jwt.sign({ id: peerUser.id, type: 'access' }, process.env.JWT_SECRET);

    testExam = await Exam.create({
      name: 'Creator Exam',
      user: testUser.id,
      date: new Date(),
    });

    // Peer needs an active exam to place cloned decks under
    await Exam.create({
      name: 'Cloner Exam',
      user: peerUser.id,
      date: new Date(),
    });

    testSubject = await Subject.create({
      name: 'Science Subject',
      exam: testExam.id,
      user: testUser.id,
    });
  });

  afterAll(async () => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await Flashcard.destroy({ where: {} });
    await FlashcardDeck.destroy({ where: {} });
  });

  it('should create a new deck, share it, access public URL, clone it, and verify cards in DB', async () => {
    // 1. Create a deck
    const createRes = await request(app)
      .post('/api/flashcard-decks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Science Chemistry', subject: testSubject.id });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const deckId = createRes.body.data.id;

    // Add cards to the deck
    const card1 = await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'H2O',
      back: 'Water',
      deckId,
    });

    const card2 = await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'CO2',
      back: 'Carbon Dioxide',
      deckId,
    });

    // 2. Share it
    const shareRes = await request(app)
      .post(`/api/flashcard-decks/${deckId}/share`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(shareRes.status).toBe(200);
    expect(shareRes.body.success).toBe(true);
    expect(shareRes.body.data.isPublic).toBe(true);
    expect(shareRes.body.data.shareToken).toBeDefined();
    const token = shareRes.body.data.shareToken;

    // 3. Access public URL (No auth)
    const publicRes = await request(app)
      .get(`/api/share/${token}`);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body.success).toBe(true);
    expect(publicRes.body.data.deck.name).toContain('Science Chemistry');
    expect(publicRes.body.data.cards).toHaveLength(2);
    expect(publicRes.body.data.cards[0].front).toBe('H2O');

    // 4. Clone it (using peerToken)
    const cloneRes = await request(app)
      .post(`/api/share/${token}/clone`)
      .set('Authorization', `Bearer ${peerToken}`);

    expect(cloneRes.status).toBe(201);
    expect(cloneRes.body.success).toBe(true);
    const clonedDeckId = cloneRes.body.data.id;

    // 5. Verify cards in DB under cloner user and clonedDeckId
    const clonedCards = await Flashcard.findAll({ where: { deckId: clonedDeckId } });
    expect(clonedCards).toHaveLength(2);
    expect(clonedCards[0].user).toBe(peerUser.id);
    expect(clonedCards[0].front).toBe('H2O');

    // 6. Verify clone count incremented
    const updatedOriginal = await FlashcardDeck.findByPk(deckId);
    expect(updatedOriginal.cloneCount).toBe(1);
  });

  it('should return error when user tries to clone their own deck', async () => {
    // Create and share a deck
    const deck = await FlashcardDeck.create({
      name: 'Owner Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: true,
      shareToken: '123e4567-e89b-12d3-a456-426614174000',
    });

    await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'Q',
      back: 'A',
      deckId: deck.id,
    });

    const res = await request(app)
      .post(`/api/share/${deck.shareToken}/clone`)
      .set('Authorization', `Bearer ${authToken}`); // Owner trying to clone

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already own this deck.');
  });

  it('should return 404 with clear message when shared link is requested for a deleted deck', async () => {
    const res = await request(app)
      .get('/api/share/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should allow owner to update deck visibility to public', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Test Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: false,
    });

    await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'Q',
      back: 'A',
      deckId: deck.id,
    });

    const res = await request(app)
      .patch(`/api/flashcard-decks/${deck.id}/visibility`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isPublic: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPublic).toBe(true);
    expect(res.body.data.shareToken).toBeDefined();
  });

  it('should allow owner to update deck visibility to private', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Test Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: true,
      shareToken: '123e4567-e89b-12d3-a456-426614174000',
    });

    const res = await request(app)
      .patch(`/api/flashcard-decks/${deck.id}/visibility`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isPublic: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPublic).toBe(false);
  });

  it('should reject visibility update from non-owner', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Test Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: false,
    });

    const res = await request(app)
      .patch(`/api/flashcard-decks/${deck.id}/visibility`)
      .set('Authorization', `Bearer ${peerToken}`)
      .send({ isPublic: true });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should get public deck by deck ID without authentication', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Public Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: true,
      shareToken: '123e4567-e89b-12d3-a456-426614174000',
    });

    await Flashcard.create({
      user: testUser.id,
      subject: testSubject.id,
      front: 'Public Q',
      back: 'Public A',
      deckId: deck.id,
    });

    const res = await request(app)
      .get(`/api/decks/shared/${deck.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deck.id).toBe(deck.id);
    expect(res.body.data.deck.name).toBe('Public Deck');
    expect(res.body.data.cards).toHaveLength(1);
    expect(res.body.data.cards[0].front).toBe('Public Q');
  });

  it('should return 404 when accessing private deck by deck ID', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Private Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: false,
    });

    const res = await request(app)
      .get(`/api/decks/shared/${deck.id}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not publicly accessible');
  });

  it('should return 404 when accessing non-existent deck by deck ID', async () => {
    const res = await request(app)
      .get('/api/decks/shared/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not found');
  });

  it('should prevent making empty deck public', async () => {
    const deck = await FlashcardDeck.create({
      name: 'Empty Deck',
      subject: testSubject.id,
      user: testUser.id,
      isPublic: false,
    });

    const res = await request(app)
      .patch(`/api/flashcard-decks/${deck.id}/visibility`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isPublic: true });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('empty deck');
  });
});
