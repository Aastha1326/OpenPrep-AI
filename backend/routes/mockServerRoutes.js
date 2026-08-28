const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createEndpoint,
  getEndpoints,
  testDispatch,
  getTraffic,
} = require('../controllers/mockServerController');

router.post('/endpoints', protect, createEndpoint);
router.get('/endpoints', protect, getEndpoints);
router.post('/test-dispatch', protect, testDispatch);
router.get('/traffic', protect, getTraffic);

module.exports = router;
