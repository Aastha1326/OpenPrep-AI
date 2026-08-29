const redisSentinelService = require('../../services/redisSentinelService');
const Redis = require('ioredis');

vi.mock('ioredis', () => {
  const mockRedisInstance = {
    on: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
  };
  return vi.fn().mockImplementation(() => mockRedisInstance);
});

describe('Redis Sentinel HA Connection Client Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    redisSentinelService.client = null;
    redisSentinelService.isReady = false;
    redisSentinelService.isSentinel = false;
  });

  test('should connect with Sentinel hosts config when REDIS_SENTINEL_HOSTS is declared', () => {
    process.env.REDIS_SENTINEL_HOSTS = '127.0.0.1:26379,127.0.0.1:26380';
    process.env.REDIS_SENTINEL_NAME = 'mymaster';

    redisSentinelService.connect();

    expect(Redis).toHaveBeenCalledWith(
      expect.objectContaining({
        sentinels: [
          { host: '127.0.0.1', port: 26379 },
          { host: '127.0.0.1', port: 26380 },
        ],
        name: 'mymaster',
      })
    );
    expect(redisSentinelService.isSentinel).toBe(true);
  });

  test('should fallback to regular Redis URL when REDIS_SENTINEL_HOSTS is missing', () => {
    delete process.env.REDIS_SENTINEL_HOSTS;
    process.env.REDIS_URL = 'redis://local-db:6379';

    redisSentinelService.connect();

    expect(Redis).toHaveBeenCalledWith('redis://local-db:6379', expect.any(Object));
    expect(redisSentinelService.isSentinel).toBe(false);
  });

  test('should store and read JWT blacklisted identifiers', async () => {
    redisSentinelService.connect();
    redisSentinelService.isReady = true;

    const mockClient = redisSentinelService.client;
    mockClient.get.mockResolvedValue('true');

    await redisSentinelService.blacklistJwt('token-id-111', 1800);
    expect(mockClient.set).toHaveBeenCalledWith('jwt:blacklist:token-id-111', 'true', 'EX', 1800);

    const isBlack = await redisSentinelService.isJwtBlacklisted('token-id-111');
    expect(mockClient.get).toHaveBeenCalledWith('jwt:blacklist:token-id-111');
    expect(isBlack).toBe(true);
  });
});
