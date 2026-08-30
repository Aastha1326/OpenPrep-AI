const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  simulateProjectile,
  simulateCollision,
  simulateOscillator,
} = require('../controllers/physicsController');

router.post('/projectile', protect, simulateProjectile);
router.post('/collision', protect, simulateCollision);
router.post('/oscillator', protect, simulateOscillator);

module.exports = router;
