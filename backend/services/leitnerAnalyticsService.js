const Flashcard = require('../models/Flashcard');
const FlashcardDeck = require('../models/FlashcardDeck');

/**
 * Calculates Leitner Box categorization, Ebbinghaus retention decay projections,
 * and overall Deck Health Index for a flashcard deck.
 */

const getLeitnerBoxNumber = (card) => {
  const interval = card.interval || 0;
  const reps = card.repetitions || 0;

  if (reps === 0 || interval <= 1) return 1;
  if (interval <= 3) return 2;
  if (interval <= 7) return 3;
  if (interval <= 14) return 4;
  return 5;
};

const calculateMemoryStability = (card) => {
  const interval = Math.max(1, card.interval || 1);
  const efactor = card.efactor || 2.5;
  // Stability increases with interval and efactor
  return interval * (efactor / 2.5);
};

const getLeitnerAnalytics = async (deckId, userId) => {
  // Query cards matching either subject ID (deckId) or deck ID
  const cards = await Flashcard.findAll({
    where: {
      user: userId,
      subject: deckId,
    },
  });

  const totalCards = cards.length;

  const boxes = {
    box1: { name: 'Box 1: Daily', intervalDays: 1, count: 0, cards: [] },
    box2: { name: 'Box 2: Every 3 Days', intervalDays: 3, count: 0, cards: [] },
    box3: { name: 'Box 3: Weekly', intervalDays: 7, count: 0, cards: [] },
    box4: { name: 'Box 4: Bi-Weekly', intervalDays: 14, count: 0, cards: [] },
    box5: { name: 'Box 5: Mastered / Monthly', intervalDays: 30, count: 0, cards: [] },
  };

  let highRiskCount = 0;
  const now = new Date();

  cards.forEach((card) => {
    const boxNum = getLeitnerBoxNumber(card);
    const boxKey = `box${boxNum}`;
    boxes[boxKey].count += 1;

    // Check if card is overdue or high risk of decay
    const lastReviewed = card.updatedAt ? new Date(card.updatedAt) : now;
    const daysElapsed = Math.max(0, (now - lastReviewed) / (1000 * 60 * 60 * 24));
    const stability = calculateMemoryStability(card);
    const retentionNow = Math.exp(-daysElapsed / stability) * 100;

    if (retentionNow < 70) {
      highRiskCount += 1;
    }
  });

  // Calculate 30-day Ebbinghaus retention decay curve projection
  const retentionCurve = [];
  for (let day = 0; day <= 30; day += 1) {
    if (totalCards === 0) {
      retentionCurve.push({ day, retention: 100 });
      continue;
    }

    let sumRetention = 0;
    cards.forEach((card) => {
      const stability = calculateMemoryStability(card);
      const retention = Math.exp(-day / stability) * 100;
      sumRetention += retention;
    });

    const avgRetention = Math.round((sumRetention / totalCards) * 10);
    retentionCurve.push({
      day,
      retention: avgRetention / 10,
    });
  }

  // Calculate Deck Health Index Score (0 - 100)
  let weightedScore = 0;
  if (totalCards > 0) {
    weightedScore =
      (boxes.box1.count * 1 +
        boxes.box2.count * 2 +
        boxes.box3.count * 3 +
        boxes.box4.count * 4 +
        boxes.box5.count * 5) /
      (totalCards * 5);
  }
  const deckHealthIndex = Math.min(100, Math.round(weightedScore * 100));

  return {
    totalCards,
    boxes: [
      { id: 1, label: 'Box 1 (Daily)', reviewFrequency: 'Daily', count: boxes.box1.count },
      { id: 2, label: 'Box 2 (3 Days)', reviewFrequency: 'Every 3 Days', count: boxes.box2.count },
      { id: 3, label: 'Box 3 (Weekly)', reviewFrequency: 'Weekly', count: boxes.box3.count },
      { id: 4, label: 'Box 4 (Bi-Weekly)', reviewFrequency: 'Bi-Weekly', count: boxes.box4.count },
      { id: 5, label: 'Box 5 (Mastered)', reviewFrequency: 'Monthly', count: boxes.box5.count },
    ],
    deckHealthIndex,
    highRiskCount,
    retentionCurve,
  };
};

module.exports = {
  getLeitnerAnalytics,
  getLeitnerBoxNumber,
  calculateMemoryStability,
};
