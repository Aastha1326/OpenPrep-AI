const { maskIp, getPayloadHash, logSecurityEvent, auditInterceptor } = require('../../middleware/auditLogMiddleware');
const { SecurityAuditLog } = require('../../models');

describe('Security Audit Log Middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('maskIp masks IPv4 and IPv6 addresses correctly', () => {
    expect(maskIp('192.168.1.50')).toBe('192.168.1.xxx');
    expect(maskIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:xxxx:xxxx');
    expect(maskIp(null)).toBe('0.0.0.0');
  });

  test('getPayloadHash returns a hash and deletes credentials', () => {
    const body = { username: 'john', password: 'secretpassword', secret: 'abc' };
    const hash = getPayloadHash(body);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 length
  });

  test('logSecurityEvent writes to SecurityAuditLog model', async () => {
    vi.spyOn(SecurityAuditLog, 'create').mockResolvedValue({});

    const req = {
      ip: '10.0.0.5',
      headers: { 'user-agent': 'Mozilla' },
      body: { username: 'testuser' },
    };

    await logSecurityEvent({
      userId: 'user-000',
      eventType: 'failed_login',
      severity: 'WARNING',
      req,
      statusCode: 401,
    });

    expect(SecurityAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-000',
        eventType: 'failed_login',
        severity: 'WARNING',
        ipAddress: '10.0.0.xxx',
        userAgent: 'Mozilla',
        statusCode: 401,
      })
    );
  });

  test('auditInterceptor intercepts response and logs events', async () => {
    vi.spyOn(SecurityAuditLog, 'create').mockResolvedValue({});

    const req = {
      ip: '192.168.1.20',
      headers: { 'user-agent': 'Chrome' },
      body: {},
      user: { id: 'user-456' },
    };

    const res = {
      statusCode: 200,
      send: vi.fn(),
    };

    const next = vi.fn();

    const middleware = auditInterceptor('user_login', 'INFO');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    // Call res.send to trigger interceptor callback
    res.send({ success: true });

    expect(SecurityAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
        eventType: 'successful_login',
        severity: 'INFO',
        ipAddress: '192.168.1.xxx',
        userAgent: 'Chrome',
        statusCode: 200,
      })
    );
  });
});
