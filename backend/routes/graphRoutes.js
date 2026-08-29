const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  solvePath,
  computeMatrices,
} = require('../controllers/graphController');

router.post('/solve-path', protect, solvePath);
router.post('/matrices', protect, computeMatrices);

module.exports = router;
