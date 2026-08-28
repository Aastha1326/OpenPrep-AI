const conjugationService = require('../services/conjugationService');
const grammarTreeService = require('../services/grammarTreeService');
const ConjugationDrill = require('../models/ConjugationDrill');

/**
 * @desc    Get conjugation matrix for a verb
 * @route   GET /api/language/conjugate
 * @access  Private
 */
exports.getConjugations = (req, res) => {
  try {
    const { language = 'spanish', verb = 'hablar', tense = 'present' } = req.query;
    const matrix = conjugationService.getConjugation(language, verb, tense);
    return res.json({ success: true, data: { language, verb, tense, matrix } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Parse sentence into POS syntax tree
 * @route   POST /api/language/parse-grammar
 * @access  Private
 */
exports.parseGrammarTree = (req, res) => {
  try {
    const { sentence, language = 'spanish' } = req.body;
    const tree = grammarTreeService.parseSentenceStructure(sentence, language);
    return res.json({ success: true, data: tree });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Verify drill answer and save attempt stats
 * @route   POST /api/language/verify-drill
 * @access  Private
 */
exports.verifyDrill = async (req, res) => {
  try {
    const { language, verb, tense, expected, received } = req.body;
    const result = conjugationService.verifyAnswer(expected, received);

    await ConjugationDrill.create({
      userId: req.user.id,
      language: language || 'spanish',
      verb: verb || 'unknown',
      tense: tense || 'present',
      accuracyScore: result.isCorrect ? 100 : 0,
      mistakeHistory: result.isCorrect ? [] : [{ expected, received, distance: result.levenshteinDistance }],
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
