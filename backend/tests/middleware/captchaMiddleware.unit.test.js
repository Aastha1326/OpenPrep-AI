const verifyCaptcha = require('../../middleware/captchaMiddleware');

describe('reCAPTCHA verification middleware', () => {
  let req;
  let res;
  let next;
  let originalNodeEnv;
  let originalSecretKey;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalSecretKey = process.env.RECAPTCHA_SECRET_KEY;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.RECAPTCHA_SECRET_KEY = originalSecretKey;
  });

  beforeEach(() => {
    req = { body: {} };
    res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
    next = vi.fn();
    // Default to test env for safety
    process.env.NODE_ENV = 'test';
    delete process.env.RECAPTCHA_SECRET_KEY;
  });

  it('should bypass verification if NODE_ENV is test', async () => {
    process.env.NODE_ENV = 'test';
    process.env.RECAPTCHA_SECRET_KEY = 'mock_secret';

    await verifyCaptcha(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should bypass verification if RECAPTCHA_SECRET_KEY is not set', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.RECAPTCHA_SECRET_KEY;

    await verifyCaptcha(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if captchaToken is missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'mock_secret';
    req.body = {}; // no captchaToken

    await verifyCaptcha(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('reCAPTCHA token is required');
  });

  it('should return 403 if reCAPTCHA verification fails', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'mock_secret';
    req.body = { captchaToken: 'bad_token' };

    // Mock global fetch to return success: false
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await verifyCaptcha(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('reCAPTCHA verification failed');

    vi.unstubAllGlobals();
  });

  it('should return 403 if score is low (< 0.5)', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'mock_secret';
    req.body = { captchaToken: 'bot_token' };

    // Mock global fetch to return success: true but low score
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, score: 0.3 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await verifyCaptcha(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Suspicious request detected');

    vi.unstubAllGlobals();
  });

  it('should pass and call next if verification succeeds with high score', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'mock_secret';
    req.body = { captchaToken: 'human_token' };

    // Mock global fetch to return success: true and high score
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, score: 0.9 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await verifyCaptcha(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();

    vi.unstubAllGlobals();
  });
});
