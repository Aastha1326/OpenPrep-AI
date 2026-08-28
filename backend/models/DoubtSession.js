/**
 * @fileoverview A doubt-solving session: the student's original question, the
 * ladder of progressively more revealing hints generated for it, and how far
 * down that ladder the student has chosen to walk.
 *
 * This used to be a Mongoose schema. Nothing in this application talks to
 * MongoDB - config/db.js builds a Sequelize instance and a pg pool, and there
 * is no mongoose.connect() call anywhere - so every read and write in the
 * controller would have hung on Mongoose's buffering timeout even once the
 * package was installed.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * A session moves through exactly three states:
 *
 *   active    - hints remain unrevealed
 *   solved    - the student reached the final level, or said they got it
 *   abandoned - closed without reaching the solution
 *
 * The distinction is what makes the hint ladder measurable: a student who
 * solves at level 1 understood the concept, one who needed level 4 did not,
 * and that difference is the signal the feature exists to collect.
 */
const SESSION_STATUSES = ['active', 'solved', 'abandoned'];

const DoubtSession = sequelize.define(
  'DoubtSession',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'A doubt session needs a question.' },
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    /**
     * Uploaded problem images, as `[{ url, mimeType }]`.
     *
     * The controller stores a data URI here rather than a file path because
     * the upload middleware keeps the buffer in memory and never writes it to
     * disk. That is a deliberate trade for a feature where the image is only
     * ever read back by the same session.
     */
    imageUrls: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    /**
     * The hint ladder, as `[{ level, content, kind }]`, ordered by level.
     *
     * Stored as one document rather than a child table because a ladder is
     * written once, read whole, and never queried across sessions.
     */
    hints: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    /**
     * How many hints the student has revealed. 0 means "the first hint was
     * handed over when the session opened"; the ladder is 1-indexed, so
     * currentLevel is also the index of the last hint the student has seen.
     */
    currentLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM(...SESSION_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    /**
     * True when the ladder was built from the deterministic fallback rather
     * than from the model, so a session can be re-generated later without
     * guessing which ones were degraded.
     */
    hintsAreFallback: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'DoubtSessions',
    timestamps: true,
    indexes: [
      { name: 'doubt_sessions_student_idx', fields: ['studentId', 'createdAt'] },
      { name: 'doubt_sessions_status_idx', fields: ['status'] },
    ],
  }
);

DoubtSession.SESSION_STATUSES = SESSION_STATUSES;

/** The hint the student is currently looking at, or null before the first. */
DoubtSession.prototype.currentHint = function currentHint() {
  const ladder = Array.isArray(this.hints) ? this.hints : [];
  return ladder[this.currentLevel] || null;
};

/** Whether any hint remains below the one the student has reached. */
DoubtSession.prototype.hasMoreHints = function hasMoreHints() {
  const ladder = Array.isArray(this.hints) ? this.hints : [];
  return this.currentLevel + 1 < ladder.length;
};

module.exports = DoubtSession;
