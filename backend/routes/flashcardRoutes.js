const express = require('express');
const {
  generateAIFlashcards,
  createFlashcard,
  getFlashcards,
  reviewFlashcard,
  deleteFlashcard,
  exportFlashcards,
  importFlashcards,
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { checkQuota } = require('../middleware/quotaMiddleware');
const flashcardUpload = require('../middleware/flashcardUpload');
const {
  validateGenerateAIFlashcards,
  validateCreateFlashcard,
  validateReviewFlashcard,
  validateExportFlashcards,
  validateImportFlashcards,
} = require('../middleware/validators');

const router = express.Router();

// Static routes first (must come before /:id to avoid route shadowing)
router.post('/generate-ai', protect, aiLimiter, checkQuota, validateGenerateAIFlashcards, generateAIFlashcards);
router.get('/export', protect, validateExportFlashcards, exportFlashcards);
router.post('/import', protect, flashcardUpload.single('file'), validateImportFlashcards, importFlashcards);

// Collection routes
router.post('/', protect, validateCreateFlashcard, createFlashcard);
router.get('/', protect, getFlashcards);

// Parameterised routes
router.put('/:id/review', protect, validateReviewFlashcard, reviewFlashcard);
router.delete('/:id', protect, deleteFlashcard);

module.exports = router;
