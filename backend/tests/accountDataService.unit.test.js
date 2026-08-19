const path = require('path');

/**
 * The service takes its models through an injectable option, so the suite
 * hands it in-memory doubles rather than mocking the module graph. Each
 * double records the queries it was given, which is what lets the
 * delete-ordering and pagination assertions below work without a database.
 */
const makeModel = (rows = []) => ({
  rows,
  findAllCalls: [],
  destroyCalls: [],
  findAll: vi.fn(async function findAll(options = {}) {
    this.findAllCalls.push(options);
    const offset = options.offset || 0;
    const limit = options.limit || this.rows.length;
    return this.rows.slice(offset, offset + limit).map((row) => ({
      get: () => ({ ...row }),
      ...row,
    }));
  }),
  destroy: vi.fn(async function destroy(options = {}) {
    this.destroyCalls.push(options);
    return this.rows.length;
  }),
});

const MODEL_NAMES = [
  'Exam',
  'Subject',
  'Topic',
  'PYQ',
  'StudyPlan',
  'Quiz',
  'QuizAttempt',
  'QuizBookmark',
  'QuizTelemetryEvent',
  'Note',
  'Flashcard',
  'Progress',
  'FocusSession',
  'Achievement',
  'UserBadge',
  'UsageQuota',
  'PYQAnalysis',
  'BattleParticipant',
  'BattleSession',
  'Feedback',
  'ActivityLog',
];

const fs = require('fs');
const service = require('../services/accountDataService');

let mockModels;

const buildModels = () => {
  const models = {};
  for (const name of [...MODEL_NAMES, 'User']) {
    models[name] = makeModel();
  }
  models.sequelize = {
    transaction: vi.fn(async (callback) => callback('TX')),
  };
  return models;
};

const makeUser = (overrides = {}) => {
  const raw = {
    id: 'user-1',
    name: 'Asha',
    email: 'asha@example.com',
    role: 'student',
    password: '$2a$10$hashedhashedhashed',
    refreshTokens: ['rt-1', 'rt-2'],
    refreshTokenExpire: new Date('2026-09-01'),
    emailVerificationToken: 'verify-token',
    resetPasswordToken: 'reset-token',
    resetPasswordOtpHash: 'otp-hash',
    googleCalendarRefreshToken: 'google-refresh',
    pushSubscription: { endpoint: 'https://push', keys: { auth: 'k' } },
    xp: 420,
    level: 5,
    streakCount: 12,
    avatar: '/uploads/avatars/asha.png',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };

  return { ...raw, get: () => ({ ...raw }) };
};

describe('services/accountDataService', () => {
  beforeEach(() => {
    mockModels = buildModels();
    vi.restoreAllMocks();
  });

  describe('buildProfile', () => {
    it('includes the fields a user should get back', () => {
      const profile = service.buildProfile(makeUser());

      expect(profile.id).toBe('user-1');
      expect(profile.name).toBe('Asha');
      expect(profile.email).toBe('asha@example.com');
      expect(profile.xp).toBe(420);
      expect(profile.streakCount).toBe(12);
    });

    it('never includes credentials or tokens', () => {
      const profile = service.buildProfile(makeUser());

      expect(profile.password).toBeUndefined();
      expect(profile.refreshTokens).toBeUndefined();
      expect(profile.refreshTokenExpire).toBeUndefined();
      expect(profile.emailVerificationToken).toBeUndefined();
      expect(profile.resetPasswordToken).toBeUndefined();
      expect(profile.resetPasswordOtpHash).toBeUndefined();
      expect(profile.googleCalendarRefreshToken).toBeUndefined();
      expect(profile.pushSubscription).toBeUndefined();
    });

    it('fails closed when a new secret column appears', () => {
      // The allowlist is the point: an unknown column is dropped rather than
      // exported, so adding `mfaSecret` to the model cannot leak it.
      const profile = service.buildProfile(makeUser({ mfaSecret: 'TOTPSECRET' }));

      expect(profile.mfaSecret).toBeUndefined();
      expect(JSON.stringify(profile)).not.toContain('TOTPSECRET');
    });

    it('omits allowlisted fields the record does not have', () => {
      const profile = service.buildProfile({ get: () => ({ id: 'u', name: 'n' }) });

      expect(profile).toEqual({ id: 'u', name: 'n' });
    });

    it('accepts a plain object as well as a model instance', () => {
      const profile = service.buildProfile({ id: 'u2', email: 'b@c.com', password: 'secret' });

      expect(profile.id).toBe('u2');
      expect(profile.password).toBeUndefined();
    });
  });

  describe('stripSensitiveFields', () => {
    it('redacts secret-looking columns on related tables', () => {
      const row = service.stripSensitiveFields({
        id: 1,
        title: 'Note',
        shareToken: 'abc',
        apiKey: 'k',
        webhookSecret: 's',
      });

      expect(row.title).toBe('Note');
      expect(row.shareToken).toBe('[REDACTED]');
      expect(row.apiKey).toBe('[REDACTED]');
      expect(row.webhookSecret).toBe('[REDACTED]');
    });

    it('passes through non-objects untouched', () => {
      expect(service.stripSensitiveFields(null)).toBeNull();
      expect(service.stripSensitiveFields('text')).toBe('text');
    });
  });

  describe('buildAccountExport', () => {
    it('produces a versioned, timestamped archive', async () => {
      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.schemaVersion).toBe(service.EXPORT_SCHEMA_VERSION);
      expect(typeof archive.exportedAt).toBe('string');
      expect(Date.parse(archive.exportedAt)).not.toBeNaN();
      expect(archive.profile.email).toBe('asha@example.com');
    });

    it('includes every declared entity even when empty', async () => {
      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      for (const entity of service.EXPORT_ENTITIES) {
        expect(archive.data).toHaveProperty(entity.key);
        expect(Array.isArray(archive.data[entity.key])).toBe(true);
      }
    });

    it('reads each entity with the correct foreign key', async () => {
      await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(mockModels.Note.findAllCalls[0].where).toEqual({ user: 'user-1' });
      // The schema is inconsistent — quizzes key off createdBy, badges off userId.
      expect(mockModels.Quiz.findAllCalls[0].where).toEqual({ createdBy: 'user-1' });
      expect(mockModels.UserBadge.findAllCalls[0].where).toEqual({ userId: 'user-1' });
      expect(mockModels.BattleParticipant.findAllCalls[0].where).toEqual({ userId: 'user-1' });
    });

    it('returns the rows and their counts', async () => {
      mockModels.Note.rows = [
        { id: 1, title: 'Kinematics' },
        { id: 2, title: 'Thermo' },
      ];

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.data.notes).toHaveLength(2);
      expect(archive.data.notes[0].title).toBe('Kinematics');
      expect(archive.meta.counts.notes).toBe(2);
    });

    it('pages through large tables rather than loading them at once', async () => {
      mockModels.ActivityLog.rows = Array.from({ length: 1200 }, (_, i) => ({ id: i }));

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.data.activityLogs).toHaveLength(1200);
      // 1200 rows at 500 per page = 3 queries (the third is short and stops).
      expect(mockModels.ActivityLog.findAll).toHaveBeenCalledTimes(3);
      expect(mockModels.ActivityLog.findAllCalls[0].limit).toBe(service.PAGE_SIZE);
      expect(mockModels.ActivityLog.findAllCalls[1].offset).toBe(service.PAGE_SIZE);
    });

    it('caps a runaway table and reports the truncation', async () => {
      mockModels.ActivityLog.rows = Array.from({ length: 9000 }, (_, i) => ({ id: i }));

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.data.activityLogs).toHaveLength(service.MAX_ROWS_PER_ENTITY);
      expect(archive.meta.truncated).toContain('activityLogs');
    });

    it('does not flag truncation when the table fits exactly under the cap', async () => {
      mockModels.Note.rows = Array.from({ length: 250 }, (_, i) => ({ id: i }));

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.meta.truncated).not.toContain('notes');
    });

    it('redacts secret-looking columns found on related rows', async () => {
      mockModels.Note.rows = [{ id: 1, title: 'N', shareToken: 'leaky' }];

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      expect(archive.data.notes[0].shareToken).toBe('[REDACTED]');
    });

    it('degrades to a partial archive when one entity fails', async () => {
      mockModels.Flashcard.findAll.mockRejectedValueOnce(new Error('relation does not exist'));

      const archive = await service.buildAccountExport(makeUser(), { models: mockModels });

      // A user trying to leave is better served by a partial archive than a 500.
      expect(archive.data.flashcards).toEqual([]);
      expect(archive.meta.errors).toContainEqual({
        entity: 'flashcards',
        error: 'relation does not exist',
      });
      expect(archive.data.notes).toBeDefined();
    });
  });

  describe('resolveUploadPath', () => {
    it('resolves a normal upload URL', () => {
      const resolved = service.resolveUploadPath('/uploads/notes-123.pdf');

      expect(resolved).toBeTruthy();
      expect(resolved.endsWith(path.join('uploads', 'notes-123.pdf'))).toBe(true);
    });

    it('refuses to escape the uploads directory', () => {
      // These come from the database but originate in user uploads.
      expect(service.resolveUploadPath('/uploads/../../etc/passwd')).toBeNull();
      expect(service.resolveUploadPath('/etc/passwd')).toBeNull();
      expect(service.resolveUploadPath('../../secrets.env')).toBeNull();
    });

    it('ignores empty and non-string values', () => {
      expect(service.resolveUploadPath('')).toBeNull();
      expect(service.resolveUploadPath(null)).toBeNull();
      expect(service.resolveUploadPath(undefined)).toBeNull();
      expect(service.resolveUploadPath(42)).toBeNull();
    });
  });

  describe('removeFiles', () => {
    it('reports files it removed', () => {
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);

      const result = service.removeFiles(['/a.png', '/b.pdf']);

      expect(result.removed).toEqual(['/a.png', '/b.pdf']);
      expect(result.failed).toEqual([]);
    });

    it('treats an already-missing file as success', () => {
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        const err = new Error('missing');
        err.code = 'ENOENT';
        throw err;
      });

      const result = service.removeFiles(['/gone.png']);

      expect(result.failed).toEqual([]);
    });

    it('collects real failures without throwing', () => {
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        const err = new Error('permission denied');
        err.code = 'EACCES';
        throw err;
      });

      const result = service.removeFiles(['/locked.png']);

      expect(result.removed).toEqual([]);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('permission denied');
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    });

    it('runs the whole delete inside one transaction', async () => {
      await service.deleteAccount(makeUser(), { models: mockModels });

      expect(mockModels.sequelize.transaction).toHaveBeenCalledTimes(1);
      // Every destroy must be enrolled, or a failure leaves orphaned rows.
      for (const entry of service.DELETE_ORDER) {
        const model = mockModels[entry.model];
        for (const call of model.destroyCalls) {
          expect(call.transaction).toBe('TX');
        }
      }
    });

    it('deletes children before their parents', async () => {
      const order = [];
      for (const entry of service.DELETE_ORDER) {
        const model = mockModels[entry.model];
        model.destroy.mockImplementation(async () => {
          order.push(entry.model);
          return 0;
        });
      }

      await service.deleteAccount(makeUser(), { models: mockModels });

      expect(order.indexOf('QuizAttempt')).toBeLessThan(order.indexOf('Quiz'));
      expect(order.indexOf('BattleParticipant')).toBeLessThan(order.indexOf('BattleSession'));
      expect(order.indexOf('Topic')).toBeLessThan(order.indexOf('Subject'));
      expect(order.indexOf('Subject')).toBeLessThan(order.indexOf('Exam'));
      expect(order.indexOf('Flashcard')).toBeLessThan(order.indexOf('Topic'));
    });

    it('targets each table by its own foreign key', async () => {
      await service.deleteAccount(makeUser(), { models: mockModels });

      expect(mockModels.Note.destroyCalls[0].where).toEqual({ user: 'user-1' });
      expect(mockModels.Quiz.destroyCalls[0].where).toEqual({ createdBy: 'user-1' });
      expect(mockModels.BattleSession.destroyCalls[0].where).toEqual({ hostUserId: 'user-1' });
      expect(mockModels.Achievement.destroyCalls[0].where).toEqual({ userId: 'user-1' });
    });

    it('deletes the user row last and reports the counts', async () => {
      mockModels.Note.rows = [{ id: 1 }, { id: 2 }];

      const result = await service.deleteAccount(makeUser(), { models: mockModels });

      expect(mockModels.User.destroy).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        transaction: 'TX',
      });
      expect(result.deletedCounts.User).toBe(1);
      expect(result.deletedCounts.Note).toBe(2);
    });

    it('removes the avatar and uploaded note/PYQ files', async () => {
      mockModels.Note.rows = [{ fileUrl: '/uploads/note-1.pdf' }];
      mockModels.PYQ.rows = [{ fileUrl: '/uploads/pyq-1.pdf' }];

      const result = await service.deleteAccount(makeUser(), { models: mockModels });

      // avatar + note + pyq
      expect(result.filesRemoved).toBe(3);
    });

    it('skips file paths that try to escape the uploads directory', async () => {
      mockModels.Note.rows = [{ fileUrl: '/uploads/../../etc/passwd' }];

      const result = await service.deleteAccount(makeUser({ avatar: null }), { models: mockModels });

      expect(result.filesRemoved).toBe(0);
    });

    it('does not fail the deletion when a file cannot be unlinked', async () => {
      fs.unlinkSync.mockImplementation(() => {
        const err = new Error('permission denied');
        err.code = 'EACCES';
        throw err;
      });

      const result = await service.deleteAccount(makeUser(), { models: mockModels });

      // The rows are already gone; failing here would tell the user their
      // deletion failed when it did not.
      expect(result.fileErrors).toHaveLength(1);
      expect(result.deletedCounts.User).toBe(1);
    });

    it('propagates a database failure so the transaction rolls back', async () => {
      mockModels.sequelize.transaction.mockImplementation(async (callback) => {
        await callback('TX');
        throw new Error('deadlock detected');
      });

      await expect(service.deleteAccount(makeUser(), { models: mockModels })).rejects.toThrow('deadlock detected');
    });

    it('does not unlink any file when the transaction fails', async () => {
      mockModels.sequelize.transaction.mockImplementation(async () => {
        throw new Error('rolled back');
      });

      await expect(service.deleteAccount(makeUser(), { models: mockModels })).rejects.toThrow('rolled back');
      // Unlinking before the commit would destroy files for an account that
      // still exists.
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
