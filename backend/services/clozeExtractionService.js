/**
 * @fileoverview AI-Powered Flashcard Cloze Deletion (Fill-in-the-Blank) Auto-Extractor.
 * Parses study text, identifies key facts, numbers, formulas, dates, and technical terms,
 * and formats them into Anki-style cloze deletion syntax: {{c1::keyword::hint}}.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client if API key exists
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Mask density presets specifying cloze deletion count target per sentence/paragraph
const MASK_DENSITY_MAP = {
  Light: { targetClozesPerCard: 1, label: 'Light (1 key term per card)' },
  Medium: { targetClozesPerCard: 2, label: 'Medium (2 key terms per card)' },
  Dense: { targetClozesPerCard: 3, label: 'Dense (3+ key terms per card for intense retrieval)' }
};

/**
 * Heuristic Cloze Extraction fallback using regex for numbers, formulas, dates, and key terms.
 * @param {string} text - Input text paragraph
 * @param {string} density - 'Light' | 'Medium' | 'Dense'
 */
function heuristicClozeExtraction(text, density = 'Medium') {
  const targetCount = MASK_DENSITY_MAP[density]?.targetClozesPerCard || 2;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const clozeCards = [];

  sentences.forEach((sentence, idx) => {
    // Match potential targets: numbers/units, dates, capitalized technical terms, formula tokens
    const entityRegex = /\b(\d+(?:\.\d+)?%?|\b[A-Z][a-z]{3,}\b|\b[A-Z]{2,}\b|\b\d{4}\b)/g;
    let match;
    const matches = [];

    while ((match = entityRegex.exec(sentence)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }

    if (matches.length === 0) return;

    // Pick top N matches according to mask density
    const selectedMatches = matches.slice(0, Math.min(matches.length, targetCount));
    let clozeText = sentence;
    const clozeDeletions = [];

    selectedMatches.forEach((term, cIdx) => {
      const clozeNum = cIdx + 1;
      const clozeTag = `{{c${clozeNum}::${term}}}`;
      clozeText = clozeText.replace(new RegExp(`\\b${term}\\b`, 'g'), clozeTag);
      clozeDeletions.push({
        clozeNumber: clozeNum,
        answer: term,
        hint: 'key term'
      });
    });

    clozeCards.push({
      id: `cloze-auto-${idx + 1}`,
      originalText: sentence,
      clozeText,
      clozeDeletions,
      type: 'cloze',
      maskDensity: density,
      tags: ['auto-cloze']
    });
  });

  return clozeCards;
}

/**
 * Main Cloze Extraction Pipeline using Gemini API with fallback heuristics.
 * @param {Object} payload - { text, maskDensity, maxCards, subject }
 */
async function extractClozeFlashcards({ text, maskDensity = 'Medium', maxCards = 10, subject = '' }) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid input text for cloze extraction.');
  }

  const normalizedDensity = ['Light', 'Medium', 'Dense'].includes(maskDensity) ? maskDensity : 'Medium';
  const limit = Math.min(Math.max(1, parseInt(maxCards, 10) || 10), 30);

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
You are an expert Anki flashcard creator specializing in Cloze Deletion (fill-in-the-blank) extraction.
Ingest the following study text and generate high-yield Anki-style Cloze Deletion flashcards.

Input Text:
"${text}"

Parameters:
- Mask Density: ${normalizedDensity} (${MASK_DENSITY_MAP[normalizedDensity].label})
- Max Cards: ${limit}
- Subject/Context: "${subject || 'General Study Notes'}"

Formatting Rules:
1. Format all cloze deletions using standard Anki syntax: {{c1::keyword::hint}} or {{c1::keyword}}.
2. For Light density, place 1 cloze deletion per card. For Medium density, place 2 cloze deletions per card. For Dense density, place 3+ cloze deletions per card.
3. Automatically target critical dates, numbers, formulas, technical terminology, proper nouns, and core definitions.
4. Ensure the sentence retains context when blanks are hidden.

Return a JSON object in this exact schema:
{
  "clozeCards": [
    {
      "id": "cloze-1",
      "originalText": "Full un-masked original sentence",
      "clozeText": "Sentence with {{c1::cloze term::optional hint}} embedded.",
      "clozeDeletions": [
        { "clozeNumber": 1, "answer": "cloze term", "hint": "optional hint" }
      ],
      "tags": ["topic", "keyword"],
      "maskDensity": "${normalizedDensity}"
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const rawResponse = result.response.text();
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.clozeCards) && parsed.clozeCards.length > 0) {
          return {
            success: true,
            totalCards: parsed.clozeCards.length,
            maskDensity: normalizedDensity,
            cards: parsed.clozeCards.slice(0, limit)
          };
        }
      }
    } catch (aiErr) {
      console.warn('Gemini Cloze Extraction fallback:', aiErr.message);
    }
  }

  // Fallback to Regex Heuristic Cloze Extraction if Gemini API fails or is unconfigured
  const fallbackCards = heuristicClozeExtraction(text, normalizedDensity).slice(0, limit);

  return {
    success: true,
    totalCards: fallbackCards.length,
    maskDensity: normalizedDensity,
    cards: fallbackCards,
    isFallback: true
  };
}

module.exports = {
  extractClozeFlashcards,
  heuristicClozeExtraction,
  MASK_DENSITY_MAP
};
