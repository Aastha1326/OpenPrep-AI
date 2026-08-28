const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  evaluateCircuit,
  generateTruthTable,
  getTemplates,
  saveCircuit,
  getUserCircuits,
} = require('../controllers/circuitController');

router.post('/evaluate', protect, evaluateCircuit);
router.post('/truth-table', protect, generateTruthTable);
router.get('/templates', protect, getTemplates);
router.post('/', protect, saveCircuit);
router.get('/', protect, getUserCircuits);

module.exports = router;
