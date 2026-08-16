const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const flashcardDeckRoutes = require('../../routes/flashcardDeckRoutes');
const shareRoutes = require('../../routes/shareRoutes');
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
});
