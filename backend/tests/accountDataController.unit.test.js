const User = require('../models/User');
const accountDataService = require('../services/accountDataService');
const controller = require('../controllers/accountDataController');

/**
 * Express doubles. `res` records what the handler set so assertions can read
 * status, headers and body without an HTTP round trip.
 */
const makeRes = () => {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
  };
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.setHeader = vi.fn((name, value) => {
    res.headers[name] = value;
  });
  return res;
};

const makeReq = (overrides = {}) => ({
  user: { id: 'user-1' },
  body: {},
  ...overrides,
});

const makeUserRecord = (overrides = {}) => ({
  id: 'user-1',
  email: 'asha@example.com',
  password: '$2a$10$hash',
  matchPassword: vi.fn(async () => true),
  ...overrides,
});

describe('controllers/accountDataController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportAccountData', () => {
    it('returns the archive built by the service', async () => {
      const archive = { schemaVersion: 1, exportedAt: 'now', profile: {}, data: {}, meta: {} };
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'buildAccountExport').mockResolvedValue(archive);

      const res = makeRes();
      await controller.exportAccountData(makeReq(), res, vi.fn());

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(archive);
    });

    it('serves the archive as a dated download', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'buildAccountExport').mockResolvedValue({});

      const res = makeRes();
      await controller.exportAccountData(makeReq(), res, vi.fn());

      expect(res.headers['Content-Type']).toBe('application/json; charset=utf-8');
      expect(res.headers['Content-Disposition']).toMatch(
        /attachment; filename="openprep-export-\d{4}-\d{2}-\d{2}\.json"/
      );
    });

    it('forbids caching, since the archive is personal data', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'buildAccountExport').mockResolvedValue({});

      const res = makeRes();
      await controller.exportAccountData(makeReq(), res, vi.fn());

      expect(res.headers['Cache-Control']).toBe('no-store, private');
    });

    it('exports only the authenticated user', async () => {
      const findByPk = vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'buildAccountExport').mockResolvedValue({});

      // A user id in the body must not be able to redirect the export.
      await controller.exportAccountData(
        makeReq({ body: { userId: 'someone-else' } }),
        makeRes(),
        vi.fn()
      );

      expect(findByPk).toHaveBeenCalledWith('user-1');
    });

    it('404s when the account no longer exists', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(null);

      const res = makeRes();
      await controller.exportAccountData(makeReq(), res, vi.fn());

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('forwards unexpected failures to the error handler', async () => {
      vi.spyOn(User, 'findByPk').mockRejectedValue(new Error('db down'));

      const next = vi.fn();
      await controller.exportAccountData(makeReq(), makeRes(), next);

      expect(next).toHaveBeenCalledOnce();
      expect(next.mock.calls[0][0].message).toBe('db down');
    });
  });

  describe('deleteAccount', () => {
    it('deletes the account when the password is correct', async () => {
      const user = makeUserRecord();
      vi.spyOn(User, 'findByPk').mockResolvedValue(user);
      const destroy = vi.spyOn(accountDataService, 'deleteAccount').mockResolvedValue({
        deletedCounts: { User: 1, Note: 3 },
        filesRemoved: 2,
        fileErrors: [],
      });

      const res = makeRes();
      await controller.deleteAccount(makeReq({ body: { password: 'correct' } }), res, vi.fn());

      expect(user.matchPassword).toHaveBeenCalledWith('correct');
      expect(destroy).toHaveBeenCalledWith(user);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toEqual({ User: 1, Note: 3 });
      expect(res.body.data.filesRemoved).toBe(2);
    });

    it('rejects a wrong password and deletes nothing', async () => {
      const user = makeUserRecord({ matchPassword: vi.fn(async () => false) });
      vi.spyOn(User, 'findByPk').mockResolvedValue(user);
      const destroy = vi.spyOn(accountDataService, 'deleteAccount');

      const res = makeRes();
      await controller.deleteAccount(makeReq({ body: { password: 'wrong' } }), res, vi.fn());

      expect(res.statusCode).toBe(401);
      expect(destroy).not.toHaveBeenCalled();
    });

    it('requires a password rather than deleting on an empty body', async () => {
      const user = makeUserRecord();
      vi.spyOn(User, 'findByPk').mockResolvedValue(user);
      const destroy = vi.spyOn(accountDataService, 'deleteAccount');

      const res = makeRes();
      await controller.deleteAccount(makeReq(), res, vi.fn());

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/password confirmation is required/i);
      expect(destroy).not.toHaveBeenCalled();
    });

    it('tolerates a missing body entirely', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      const destroy = vi.spyOn(accountDataService, 'deleteAccount');

      const res = makeRes();
      await controller.deleteAccount({ user: { id: 'user-1' } }, res, vi.fn());

      expect(res.statusCode).toBe(400);
      expect(destroy).not.toHaveBeenCalled();
    });

    describe('OAuth-only accounts', () => {
      const oauthUser = () =>
        makeUserRecord({ password: null, matchPassword: vi.fn(async () => false) });

      it('accepts the exact confirmation phrase', async () => {
        const user = oauthUser();
        vi.spyOn(User, 'findByPk').mockResolvedValue(user);
        const destroy = vi.spyOn(accountDataService, 'deleteAccount').mockResolvedValue({
          deletedCounts: { User: 1 },
          filesRemoved: 0,
          fileErrors: [],
        });

        const res = makeRes();
        await controller.deleteAccount(
          makeReq({ body: { confirmation: controller.DELETE_CONFIRMATION_PHRASE } }),
          res,
          vi.fn()
        );

        expect(res.statusCode).toBe(200);
        expect(destroy).toHaveBeenCalledWith(user);
        // There is no password to check, so it must not be consulted.
        expect(user.matchPassword).not.toHaveBeenCalled();
      });

      it('rejects a near-miss phrase', async () => {
        vi.spyOn(User, 'findByPk').mockResolvedValue(oauthUser());
        const destroy = vi.spyOn(accountDataService, 'deleteAccount');

        for (const confirmation of ['delete my account', 'DELETE MY ACCOUNT ', 'DELETE', '']) {
          const res = makeRes();
          // eslint-disable-next-line no-await-in-loop
          await controller.deleteAccount(makeReq({ body: { confirmation } }), res, vi.fn());
          expect(res.statusCode).toBe(400);
        }

        expect(destroy).not.toHaveBeenCalled();
      });

      it('does not accept a password in place of the phrase', async () => {
        vi.spyOn(User, 'findByPk').mockResolvedValue(oauthUser());
        const destroy = vi.spyOn(accountDataService, 'deleteAccount');

        const res = makeRes();
        await controller.deleteAccount(makeReq({ body: { password: 'anything' } }), res, vi.fn());

        expect(res.statusCode).toBe(400);
        expect(destroy).not.toHaveBeenCalled();
      });
    });

    it('404s when the account no longer exists', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(null);

      const res = makeRes();
      await controller.deleteAccount(makeReq({ body: { password: 'x' } }), res, vi.fn());

      expect(res.statusCode).toBe(404);
    });

    it('forwards a failed transaction to the error handler', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'deleteAccount').mockRejectedValue(new Error('rolled back'));

      const next = vi.fn();
      const res = makeRes();
      await controller.deleteAccount(makeReq({ body: { password: 'correct' } }), res, next);

      // The transaction rolled back, so the user must see a failure rather
      // than a success message for a deletion that did not happen.
      expect(next).toHaveBeenCalledOnce();
      expect(next.mock.calls[0][0].message).toBe('rolled back');
      expect(res.statusCode).toBeNull();
    });

    it('logs through the request logger when one is attached', async () => {
      vi.spyOn(User, 'findByPk').mockResolvedValue(makeUserRecord());
      vi.spyOn(accountDataService, 'deleteAccount').mockResolvedValue({
        deletedCounts: { User: 1 },
        filesRemoved: 0,
        fileErrors: [],
      });

      const log = { info: vi.fn() };
      await controller.deleteAccount(
        makeReq({ body: { password: 'correct' }, log }),
        makeRes(),
        vi.fn()
      );

      expect(log.info).toHaveBeenCalledWith('account deleted', expect.any(Object));
    });
  });
});
