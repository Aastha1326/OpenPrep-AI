const cacheManager = require('../../utils/cacheManager');
const { getCache, setCache, invalidateCache } = require('../../config/redis');

describe('cacheManager unit tests', () => {
  it('should generate a correct cache key', () => {
    const key = cacheManager.generateKey('user123', '/api/progress/stats');
    expect(key).toBe('user_user123:/api/progress/stats');
  });

  it('should throw an error if generateKey is called without userId', () => {
    expect(() => cacheManager.generateKey(null, 'stats')).toThrow();
  });

  it('should set and get cache successfully', async () => {
    const key = 'user_test:test-endpoint';
    const value = { data: 'test-value' };
    
    await cacheManager.set(key, value, 10);
    const cached = await cacheManager.get(key);
    expect(cached).toEqual(value);
  });

  it('should invalidate cache successfully by pattern', async () => {
    const key1 = 'user_invalidate:route1';
    const key2 = 'user_invalidate:route2';
    const value = { data: 'ok' };

    await cacheManager.set(key1, value, 10);
    await cacheManager.set(key2, value, 10);

    // Invalidate pattern
    await cacheManager.invalidate('user_invalidate:*');

    const cached1 = await cacheManager.get(key1);
    const cached2 = await cacheManager.get(key2);

    expect(cached1).toBeNull();
    expect(cached2).toBeNull();
  });
});
