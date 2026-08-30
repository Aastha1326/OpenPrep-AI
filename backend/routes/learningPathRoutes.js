const express = require('express');
const router = express.Router();
const {
  getCurrentPath,
  generateNewPath,
  updatePathItemStatus,
} = require('../controllers/learningPathController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCurrentPath);
router.post('/generate', generateNewPath);
router.patch('/item/:itemId', updatePathItemStatus);

module.exports = router;
