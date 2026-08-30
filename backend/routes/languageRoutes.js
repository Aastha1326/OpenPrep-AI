const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConjugations,
  parseGrammarTree,
  verifyDrill,
} = require('../controllers/languageController');

router.get('/conjugate', protect, getConjugations);
router.post('/parse-grammar', protect, parseGrammarTree);
router.post('/verify-drill', protect, verifyDrill);

module.exports = router;
