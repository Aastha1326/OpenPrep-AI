const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getQuestionComments,
  createQuestionComment,
} = require('../controllers/discussionController');

const router = express.Router();
router.get('/:id/comments', protect, getQuestionComments);
router.post('/:id/comments', protect, createQuestionComment);

module.exports = router;
