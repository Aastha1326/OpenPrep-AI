const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTemplates,
  validateLaTeX,
  createCheatSheet,
  getUserCheatSheets,
} = require('../controllers/cheatSheetController');

router.get('/templates', protect, getTemplates);
router.post('/validate-latex', protect, validateLaTeX);
router.post('/', protect, createCheatSheet);
router.get('/', protect, getUserCheatSheets);

module.exports = router;
