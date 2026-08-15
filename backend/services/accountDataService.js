/**
 * Account data portability and erasure.
 *
 * Builds the JSON archive returned by GET /api/users/me/export and performs
 * the transactional delete behind DELETE /api/users/me. Kept out of the
 * controller so the archive shape and the delete ordering can be unit tested
 * without an HTTP layer.
 */

const fs = require('fs');
const path = require('path');
const defaultModels = require('../models');

const EXPORT_SCHEMA_VERSION = 1;

/**
 * Columns of the users table that are safe to hand back to the user.
 *
 * Deliberately an allowlist rather than a denylist. A denylist fails open:
 * the day someone adds a `mfaSecret` column, a denylist silently exports it.
 * An allowlist fails closed — a newly added field is missing from the export
 * until someone adds it here, which is a bug report rather than a breach.
 */
const EXPORTABLE_USER_FIELDS = [
  'id',
  'name',
  'email',
  'role',
  'provider',
  'authProvider',
  'avatar',
  'avatarUrl',
  'isEmailVerified',
  'streakCount',
  'streakLastActive',
  'streakFreezes',
  'studyHours',
  'leaderboardVisible',
  'receiveWeeklyDigest',
  'dailyReminderTime',
  'examCountdownPreferences',
  'sm2EasyFactorModifier',
  'sm2IntervalModifier',
  'sm2Step1Interval',
  'sm2Step2Interval',
  'syncGoogleCalendar',
  'dailyAiUsageCount',
  'lastAiUsageReset',
  'xp',
  'level',
  'createdAt',
  'updatedAt',
];

/**
 * Entities to include in the archive, in a stable order.
 *
 * `key` is the archive property, `model` the Sequelize model name in
 * models/index.js, and `foreignKey` the column that points back at the user —
 * the schema is inconsistent here (`user` on most tables, `userId` on the
 * gamification ones, `createdBy` on quizzes, `hostUserId` on battles), so it
 * has to be declared per entity rather than inferred.
 */
const EXPORT_ENTITIES = [
  { key: 'exams', model: 'Exam', foreignKey: 'user' },
  { key: 'subjects', model: 'Subject', foreignKey: 'user' },
  { key: 'topics', model: 'Topic', foreignKey: 'user' },
  { key: 'pyqs', model: 'PYQ', foreignKey: 'user' },
  { key: 'studyPlans', model: 'StudyPlan', foreignKey: 'user' },
  { key: 'quizzes', model: 'Quiz', foreignKey: 'createdBy' },
  { key: 'quizAttempts', model: 'QuizAttempt', foreignKey: 'user' },
  { key: 'quizBookmarks', model: 'QuizBookmark', foreignKey: 'user' },
  { key: 'notes', model: 'Note', foreignKey: 'user' },
  { key: 'flashcards', model: 'Flashcard', foreignKey: 'user' },
  { key: 'progress', model: 'Progress', foreignKey: 'user' },
  { key: 'focusSessions', model: 'FocusSession', foreignKey: 'user' },
  { key: 'achievements', model: 'Achievement', foreignKey: 'userId' },
  { key: 'badges', model: 'UserBadge', foreignKey: 'userId' },
  { key: 'pyqAnalyses', model: 'PYQAnalysis', foreignKey: 'userId' },
  { key: 'battleParticipations', model: 'BattleParticipant', foreignKey: 'userId' },
  { key: 'feedback', model: 'Feedback', foreignKey: 'user' },
  { key: 'activityLogs', model: 'ActivityLog', foreignKey: 'user' },
];

/**
 * A heavy user can accumulate tens of thousands of activity log and telemetry
 * rows. Paging keeps peak memory bounded, and the hard cap keeps one export
 * from being able to exhaust the process — truncation is reported in the
 * archive metadata rather than silently hidden.
 */
const PAGE_SIZE = 500;
const MAX_ROWS_PER_ENTITY = 5000;

/** Safety net for related tables, in case one ever gains a secret column. */
const SENSITIVE_FIELD_PATTERN = /(password|secret|token|apikey|api_key|privatekey)/i;

const stripSensitiveFields = (row) => {
  if (!row || typeof row !== 'object') return row;
  const output = {};
  for (const key of Object.keys(row)) {
    output[key] = SENSITIVE_FIELD_PATTERN.test(key) ? '[REDACTED]' : row[key];
  }
  return output;
};

const toPlainRow = (instance) => {
  const raw = instance && typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  return stripSensitiveFields(raw);
};

/** Project the user record through the allowlist above. */
const buildProfile = (user) => {
  const raw = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  const profile = {};
  for (const field of EXPORTABLE_USER_FIELDS) {
    if (field in raw) profile[field] = raw[field];
  }
  return profile;
};

/**
 * Read every row of one entity for a user, in pages, up to the cap.
 * Returns the rows plus whether the cap truncated the result.
 */
const fetchEntityRows = async (model, foreignKey, userId) => {
  const rows = [];
  let truncated = false;

  for (let offset = 0; offset < MAX_ROWS_PER_ENTITY; offset += PAGE_SIZE) {
    // eslint-disable-next-line no-await-in-loop -- pages must be sequential to bound memory
    const page = await model.findAll({
      where: { [foreignKey]: userId },
      limit: PAGE_SIZE,
      offset,
      order: [['id', 'ASC']],
    });

    rows.push(...page.map(toPlainRow));

    if (page.length < PAGE_SIZE) return { rows, truncated: false };
  }

  // Cap reached with a full final page — there may be more.
  truncated = true;
  return { rows, truncated };
};

/**
 * Assemble the full archive for a user.
 *
 * An entity that fails to read does not abort the export: a partial archive
 * with an explicit `errors` list is far more useful to someone trying to
 * leave than a 500.
 */
const buildAccountExport = async (user, options = {}) => {
  const models = options.models || defaultModels;

  const archive = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: buildProfile(user),
    data: {},
    meta: { counts: {}, truncated: [], errors: [] },
  };

  for (const entity of EXPORT_ENTITIES) {
    const model = models[entity.model];

    if (!model || typeof model.findAll !== 'function') {
      archive.data[entity.key] = [];
      archive.meta.errors.push({ entity: entity.key, error: 'model unavailable' });
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop -- sequential to bound peak memory
      const { rows, truncated } = await fetchEntityRows(model, entity.foreignKey, user.id);
      archive.data[entity.key] = rows;
      archive.meta.counts[entity.key] = rows.length;
      if (truncated) archive.meta.truncated.push(entity.key);
    } catch (error) {
      archive.data[entity.key] = [];
      archive.meta.counts[entity.key] = 0;
      archive.meta.errors.push({ entity: entity.key, error: error.message });
    }
  }

  return archive;
};

/**
 * Order matters: children before parents, so the delete succeeds even where
 * a foreign key is RESTRICT or where the association was declared in JS but
 * the constraint was never created in the database.
 */
const DELETE_ORDER = [
  { model: 'QuizTelemetryEvent', foreignKey: 'user' },
  { model: 'QuizBookmark', foreignKey: 'user' },
  { model: 'QuizAttempt', foreignKey: 'user' },
  { model: 'BattleParticipant', foreignKey: 'userId' },
  { model: 'BattleSession', foreignKey: 'hostUserId' },
  { model: 'PYQAnalysis', foreignKey: 'userId' },
  { model: 'Quiz', foreignKey: 'createdBy' },
  { model: 'Flashcard', foreignKey: 'user' },
  { model: 'Note', foreignKey: 'user' },
  { model: 'Progress', foreignKey: 'user' },
  { model: 'FocusSession', foreignKey: 'user' },
  { model: 'StudyPlan', foreignKey: 'user' },
  { model: 'PYQ', foreignKey: 'user' },
  { model: 'Topic', foreignKey: 'user' },
  { model: 'Subject', foreignKey: 'user' },
  { model: 'Exam', foreignKey: 'user' },
  { model: 'Achievement', foreignKey: 'userId' },
  { model: 'UserBadge', foreignKey: 'userId' },
  { model: 'UsageQuota', foreignKey: 'user' },
  { model: 'Feedback', foreignKey: 'user' },
  { model: 'ActivityLog', foreignKey: 'user' },
];

const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads'));

/**
 * Resolve a stored `/uploads/...` URL to an absolute path, refusing anything
 * that escapes the uploads directory. The values come from the database, but
 * they originate in user-supplied uploads, so they are not trusted here.
 */
const resolveUploadPath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return null;
  if (!fileUrl.startsWith('/uploads/')) return null;

  const absolute = path.resolve(path.join(__dirname, '..', fileUrl));
  const relative = path.relative(uploadsDir, absolute);
  const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

  return isInside ? absolute : null;
};

/**
 * Collect every file on disk owned by the user, before their rows are gone.
 * Called inside the transaction; the unlinking happens after it commits.
 */
const collectUserFiles = async (userId, user, transaction, models) => {
  const files = [];

  const avatarPath = resolveUploadPath(user.avatar);
  if (avatarPath) files.push(avatarPath);

  for (const modelName of ['Note', 'PYQ']) {
    const model = models[modelName];
    if (!model || typeof model.findAll !== 'function') continue;

    const foreignKey = 'user';
    // eslint-disable-next-line no-await-in-loop -- two small queries, kept sequential for the shared transaction
    const rows = await model.findAll({
      where: { [foreignKey]: userId },
      attributes: ['fileUrl'],
      transaction,
    });

    for (const row of rows) {
      const filePath = resolveUploadPath(row.fileUrl);
      if (filePath) files.push(filePath);
    }
  }

  return files;
};

/**
 * Unlink files best-effort. Never throws: the account row is already gone by
 * the time this runs, and failing the request over a leftover file would tell
 * the user their deletion failed when it did not.
 */
const removeFiles = (files) => {
  const removed = [];
  const failed = [];

  for (const file of files) {
    try {
      fs.unlinkSync(file);
      removed.push(file);
    } catch (error) {
      if (error.code !== 'ENOENT') failed.push({ file, error: error.message });
    }
  }

  return { removed, failed };
};

/**
 * Permanently delete a user and everything they own.
 *
 * Runs in a single transaction so a failure part-way cannot leave orphaned
 * rows pointing at a user that no longer exists.
 */
const deleteAccount = async (user, options = {}) => {
  const models = options.models || defaultModels;
  const sequelize = options.sequelize || models.sequelize;
  const userId = user.id;
  const deletedCounts = {};

  const files = [];

  await sequelize.transaction(async (transaction) => {
    files.push(...(await collectUserFiles(userId, user, transaction, models)));

    for (const entry of DELETE_ORDER) {
      const model = models[entry.model];
      if (!model || typeof model.destroy !== 'function') continue;

      // eslint-disable-next-line no-await-in-loop -- ordering is the point
      const count = await model.destroy({
        where: { [entry.foreignKey]: userId },
        transaction,
      });

      if (count) deletedCounts[entry.model] = count;
    }

    await models.User.destroy({ where: { id: userId }, transaction });
    deletedCounts.User = 1;
  });

  // Only after the transaction commits — otherwise a rollback would leave the
  // rows intact but their files already gone.
  const fileResult = removeFiles(files);

  return {
    deletedCounts,
    filesRemoved: fileResult.removed.length,
    fileErrors: fileResult.failed,
  };
};

module.exports = {
  buildAccountExport,
  deleteAccount,
  buildProfile,
  stripSensitiveFields,
  resolveUploadPath,
  removeFiles,
  EXPORT_SCHEMA_VERSION,
  EXPORTABLE_USER_FIELDS,
  EXPORT_ENTITIES,
  DELETE_ORDER,
  MAX_ROWS_PER_ENTITY,
  PAGE_SIZE,
};
