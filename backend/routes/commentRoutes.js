const express = require('express');
const { protect } = require('../middleware/auth');
const {
  voteComment,
  verifyComment,
  flagComment,
} = require('../controllers/discussionController');

const router = express.Router();
router.post('/:id/vote', protect, voteComment);
router.put('/:id/verify', protect, verifyComment);
router.post('/:id/flag', protect, flagComment);

module.exports = router;
