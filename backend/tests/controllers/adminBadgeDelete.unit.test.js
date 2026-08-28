import { describe, it, expect, beforeEach, vi } from 'vitest';

const fs = require('fs');
const path = require('path');

const adminController = require('../../controllers/adminController');
const { Badge } = require('../../models');

/** Minimal Express double: records what the handler sent. */
function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('adminController module integrity', () => {
  it('parses and loads', () => {
    expect(() => require('../../controllers/adminController')).not.toThrow();
  });

  it('exports every handler routes/adminRoutes.js destructures', () => {
    const routeSource = fs.readFileSync(
      path.join(__dirname, '..', '..', 'routes', 'adminRoutes.js'),
      'utf8'
    );

    const importBlock = routeSource.slice(
      routeSource.indexOf('{'),
      routeSource.indexOf("require('../controllers/adminController')")
    );
    const handlerNames = [...importBlock.matchAll(/^\s{2}(\w+),$/gm)].map((m) => m[1]);

    expect(handlerNames.length).toBeGreaterThan(0);
    for (const name of handlerNames) {
      expect(typeof adminController[name], `${name} is not exported`).toBe('function');
    }
  });

  it('loads the admin router without throwing', () => {
    expect(() => require('../../routes/adminRoutes')).not.toThrow();
  });
});

describe('deleteAdminBadge', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = { params: { id: 'badge-1' } };
    res = makeRes();
    next = vi.fn();
  });

  it('destroys the badge and reports success', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(Badge, 'findByPk').mockResolvedValue({ id: 'badge-1', destroy });

    await adminController.deleteAdminBadge(req, res, next);

    expect(Badge.findByPk).toHaveBeenCalledWith('badge-1');
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Badge deleted successfully' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 and does not destroy anything when the badge is unknown', async () => {
    vi.spyOn(Badge, 'findByPk').mockResolvedValue(null);

    await adminController.deleteAdminBadge(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Badge not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a lookup failure to the error middleware', async () => {
    const failure = new Error('connection terminated');
    vi.spyOn(Badge, 'findByPk').mockRejectedValue(failure);

    await adminController.deleteAdminBadge(req, res, next);

    expect(next).toHaveBeenCalledWith(failure);
    expect(res.statusCode).toBeNull();
  });

  it('forwards a destroy failure to the error middleware', async () => {
    const failure = new Error('foreign key violation');
    vi.spyOn(Badge, 'findByPk').mockResolvedValue({
      id: 'badge-1',
      destroy: vi.fn().mockRejectedValue(failure),
    });

    await adminController.deleteAdminBadge(req, res, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});

describe('sibling badge handlers still work', () => {
  let res;
  let next;

  beforeEach(() => {
    vi.restoreAllMocks();
    res = makeRes();
    next = vi.fn();
  });

  it('getAdminBadges returns the badge list', async () => {
    const badges = [{ id: 'a' }, { id: 'b' }];
    vi.spyOn(Badge, 'findAll').mockResolvedValue(badges);

    await adminController.getAdminBadges({}, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: badges });
  });

  it('updateAdminBadge applies only the fields supplied', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 'badge-1',
      name: 'Old name',
      description: 'Old description',
      icon: 'old-icon',
      category: 'streak',
      criteriaType: 'quiz_count',
      criteriaThreshold: 5,
      isActive: true,
      update,
    };
    vi.spyOn(Badge, 'findByPk').mockResolvedValue(existing);

    const req = { params: { id: 'badge-1' }, body: { name: 'New name' } };
    await adminController.updateAdminBadge(req, res, next);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New name', description: 'Old description' })
    );
    expect(res.statusCode).toBe(200);
  });

  it('updateAdminBadge returns 404 for an unknown badge', async () => {
    vi.spyOn(Badge, 'findByPk').mockResolvedValue(null);

    await adminController.updateAdminBadge(
      { params: { id: 'nope' }, body: {} },
      res,
      next
    );

    expect(res.statusCode).toBe(404);
  });
});

describe('getAnalytics', () => {
  // getAnalytics sits directly below deleteAdminBadge. While the closing brace
  // was missing it was nested inside its neighbour, so this covers that the
  // restored brace put it back at module scope with its behaviour intact.
  it('still returns its full payload', async () => {
    vi.restoreAllMocks();
    const { User, QuizAttempt } = require('../../models');
    vi.spyOn(User, 'count').mockResolvedValue(120);
    vi.spyOn(QuizAttempt, 'count').mockResolvedValue(340);
    vi.spyOn(QuizAttempt, 'aggregate').mockResolvedValue(78.25);

    const res = makeRes();
    const next = vi.fn();

    await adminController.getAnalytics({}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('activeUsers');
    expect(res.body.data).toHaveProperty('interviewMetrics');
    expect(res.body.data).toHaveProperty('quizMetrics');
    expect(res.body.data).toHaveProperty('systemHealth');
    expect(res.body.data).toHaveProperty('generatedAt');
    expect(res.body.data.activeUsers.totalUsers).toBe(120);
    expect(res.body.data.quizMetrics.totalQuizAttempts).toBe(340);
  });

  it('forwards a failure to the error middleware instead of crashing', async () => {
    vi.restoreAllMocks();
    const { User } = require('../../models');
    const failure = new Error('connection terminated');
    vi.spyOn(User, 'count').mockRejectedValue(failure);

    const res = makeRes();
    const next = vi.fn();

    await adminController.getAnalytics({}, res, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});
