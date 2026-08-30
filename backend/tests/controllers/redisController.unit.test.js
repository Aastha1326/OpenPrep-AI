const { getRedisStatus } = require('../../controllers/redisController');
const redisSentinelService = require('../../services/redisSentinelService');

describe('Redis Status Controller (Admin Endpoint)', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();

    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  test('should return status offline if client is uninitialized', async () => {
    redisSentinelService.isReady = false;
    redisSentinelService.client = null;

    await getRedisStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: 'DISCONNECTED' })
      })
    );
  });

  test('should return sentinel masters, slaves and ping results when active', async () => {
    redisSentinelService.isReady = true;
    redisSentinelService.isSentinel = true;

    const mockClient = {
      ping: vi.fn().mockResolvedValue('PONG'),
      sentinel: vi.fn().mockImplementation(async (cmd) => {
        if (cmd === 'masters') {
          return [['name', 'mymaster', 'ip', '127.0.0.1', 'port', '6379', 'status', 'ok', 'numSlaves', '1']];
        }
        if (cmd === 'slaves') {
          return [['ip', '127.0.0.1', 'port', '6380', 'flags', 'slave', 'masterLinkStatus', 'up', 'lag', '0']];
        }
        if (cmd === 'sentinels') {
          return [['ip', '127.0.0.1', 'port', '26379', 'flags', 'sentinel']];
        }
        return [];
      }),
      info: vi.fn().mockResolvedValue('role:master\r\nconnected_slaves:1\r\n'),
    };
    redisSentinelService.client = mockClient;

    await getRedisStatus(req, res, next);

    expect(mockClient.ping).toHaveBeenCalled();
    expect(mockClient.sentinel).toHaveBeenCalledWith('masters');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'CONNECTED',
          isSentinel: true,
          masters: expect.arrayContaining([
            expect.objectContaining({ name: 'mymaster', port: 6379 })
          ]),
          slaves: expect.arrayContaining([
            expect.objectContaining({ port: 6380, lag: 0 })
          ])
        })
      })
    );
  });
});
