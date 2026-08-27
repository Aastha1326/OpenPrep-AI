/**
 * @fileoverview Mongoose model for persisting multi-turn doubt-solving sessions
 * with progressive Socratic hints.
 */
const mongoose = require('mongoose');

const DoubtSessionSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    imageUrls: [{ url: String, mimeType: String }],
    hints: [{ level: Number, content: String }],
    currentLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoubtSession', DoubtSessionSchema);
