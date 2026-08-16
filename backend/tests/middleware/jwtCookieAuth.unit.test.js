const jwt = require('jsonwebtoken');
const { protect } = require('../../middleware/auth');
const authController = require('../../controllers/authController');
const User = require('../../models/User');

describe('JWT Cookie Authentication - Unit Tests', () => {
  const secret = 'supersecret_openprep_key';

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  const createMockRes = () => {
    const res = {
      statusCode: null,
      responseData: null,
      cookiesSet: {},
      cookiesCleared: [],
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(d) {
        this.responseData = d;
        return this;
      },
      cookie(name, val, options) {
        this.cookiesSet[name] = { val, options };
      },
      clearCookie(name) {
        this.cookiesCleared.push(name);
      },
    };
    return res;
  };

  it('should authenticate request successfully when valid token is in req.cookies.token', async () => {
    const fakeUser = { id: 'user-cookie-123', name: 'Cookie User', role: 'student' };
    const validToken = jwt.sign({ id: fakeUser.id, type: 'access' }, secret, { expiresIn: '1h' });

    vi.spyOn(User, 'findByPk').mockResolvedValue(fakeUser);

    const req = {
      cookies: { token: validToken },
      headers: {},
    };

    let nextCalled = false;
    const res = createMockRes();

    await protect(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(fakeUser.id);

    User.findByPk.mockRestore();
  });

  it('should reject request with 401 when no token is in cookies or headers', async () => {
    const req = { cookies: {}, headers: {} };
    const res = createMockRes();

    await protect(req, res, () => {});

    expect(res.statusCode).toBe(401);
    expect(res.responseData.success).toBe(false);
    expect(res.responseData.error).toContain('Not authorized');
  });

  it('should fall back to Authorization: Bearer header if cookie is missing', async () => {
    const fakeUser = { id: 'user-bearer-456', name: 'Bearer User', role: 'student' };
    const validToken = jwt.sign({ id: fakeUser.id, type: 'access' }, secret, { expiresIn: '1h' });

    vi.spyOn(User, 'findByPk').mockResolvedValue(fakeUser);

    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${validToken}` },
    };

    let nextCalled = false;
    const res = createMockRes();

    await protect(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user.id).toBe(fakeUser.id);

    User.findByPk.mockRestore();
  });

  it('should set HttpOnly token cookie on login and clear it on logout', async () => {
    const fakeUser = {
      id: 'user-login-789',
      email: 'cookie@openprep.ai',
      matchPassword: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

    const reqLogin = { body: { email: 'cookie@openprep.ai', password: 'password123' } };
    const resLogin = createMockRes();

    await authController.login(reqLogin, resLogin, () => {});

    expect(resLogin.cookiesSet.token).toBeDefined();
    expect(resLogin.cookiesSet.token.options.httpOnly).toBe(true);

    const reqLogout = {};
    const resLogout = createMockRes();

    await authController.logout(reqLogout, resLogout, () => {});

    expect(resLogout.cookiesCleared).toContain('token');

    User.findOne.mockRestore();
  });
});
