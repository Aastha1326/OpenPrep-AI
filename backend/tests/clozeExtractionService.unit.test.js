const { extractClozeFlashcards, heuristicClozeExtraction, MASK_DENSITY_MAP } = require('../services/clozeExtractionService');

describe('Cloze Extraction Service', () => {
  test('heuristicClozeExtraction formats entities into Anki cloze syntax', () => {
    const text = 'Mitochondria produce ATP in 1957 through cellular respiration.';
    const cards = heuristicClozeExtraction(text, 'Medium');

    expect(cards.length).toBeGreaterThan(0);
    const card = cards[0];
    expect(card.clozeText).toMatch(/\{\{c[1-9]::.+?\}\}/);
    expect(card.clozeDeletions.length).toBeGreaterThan(0);
  });

  test('MASK_DENSITY_MAP contains Light, Medium, and Dense configurations', () => {
    expect(MASK_DENSITY_MAP).toHaveProperty('Light');
    expect(MASK_DENSITY_MAP).toHaveProperty('Medium');
    expect(MASK_DENSITY_MAP).toHaveProperty('Dense');
    expect(MASK_DENSITY_MAP.Light.targetClozesPerCard).toBe(1);
    expect(MASK_DENSITY_MAP.Medium.targetClozesPerCard).toBe(2);
    expect(MASK_DENSITY_MAP.Dense.targetClozesPerCard).toBe(3);
  });

  test('extractClozeFlashcards returns cards array with specified maskDensity', async () => {
    const payload = {
      text: 'The velocity of light in vacuum is 299792458 meters per second. Einstein published special relativity in 1905.',
      maskDensity: 'Dense',
      maxCards: 5,
      subject: 'Physics'
    };

    const result = await extractClozeFlashcards(payload);
    expect(result.success).toBe(true);
    expect(result.maskDensity).toBe('Dense');
    expect(Array.isArray(result.cards)).toBe(true);
    expect(result.cards.length).toBeGreaterThan(0);
  });
});
