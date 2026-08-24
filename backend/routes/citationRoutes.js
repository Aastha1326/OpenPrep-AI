const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  lookupDOI,
  saveCitation,
  getUserCitations,
  exportBibliography,
} = require('../controllers/citationController');

router.get('/lookup', protect, lookupDOI);
router.post('/', protect, saveCitation);
router.get('/', protect, getUserCitations);
router.get('/export', protect, exportBibliography);

module.exports = router;
