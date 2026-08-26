const { getSecurityLogs, exportSecurityLogs, getThreatSummary } = require('../../controllers/securityController');
const { SecurityAuditLog } = require('../../models');

describe('Security Controller (Admin Endpoints)', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = {
      query: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    next = vi.fn();
  });

  test('getSecurityLogs returns paginated query outputs', async () => {
    req.query = { eventType: 'failed_login', severity: 'WARNING', page: 1, limit: 10 };

    vi.spyOn(SecurityAuditLog, 'findAndCountAll').mockResolvedValue({
      count: 1,
      rows: [{ id: '1', eventType: 'failed_login', severity: 'WARNING', timestamp: new Date() }]
    });

    await getSecurityLogs(req, res, next);

    expect(SecurityAuditLog.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventType: 'failed_login', severity: 'WARNING' }),
        limit: 10,
        offset: 0
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('exportSecurityLogs outputs CSV headers and formatting correctly', async () => {
    req.query = { format: 'csv' };

    vi.spyOn(SecurityAuditLog, 'findAll').mockResolvedValue([
      {
        id: 'log-123',
        userId: 'user-456',
        eventType: 'brute_force',
        severity: 'CRITICAL',
        ipAddress: '127.0.0.xxx',
        userAgent: 'curl',
        statusCode: 429,
        timestamp: new Date('2026-08-24T12:00:00.000Z'),
      }
    ]);

    await exportSecurityLogs(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('"log-123","user-456","brute_force","CRITICAL","127.0.0.xxx","curl","429","2026-08-24T12:00:00.000Z"'));
  });

  test('getThreatSummary aggregates rates, failed logins and anomalies', async () => {
    vi.spyOn(SecurityAuditLog, 'count').mockResolvedValue(15);
    vi.spyOn(SecurityAuditLog, 'findAll').mockResolvedValue([
      {
        ipAddress: '100.100.100.xxx',
        getDataValue: (attr) => attr === 'count' ? '8' : '100.100.100.xxx'
      }
    ]);

    await getThreatSummary(req, res, next);

    expect(SecurityAuditLog.count).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          failedLoginSpikes: 15,
          topRateLimitedIps: expect.arrayContaining([
            expect.objectContaining({ ipAddress: '100.100.100.xxx', count: 8 })
          ]),
          geoVelocityAnomalies: expect.any(Array)
        })
      })
    );
  });
});
