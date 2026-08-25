import { describe, it, expect, vi, beforeEach } from 'vitest';
import poolManager from '../../services/poolManagerService';

describe('PoolManagerService Unit Tests', () => {
  beforeEach(() => {
    poolManager.queryLatencyHistory = [];
    poolManager.failureCount = 0;
    poolManager.circuitState = 'CLOSED';
  });

  it('should accurately record query latency and compute statistics', () => {
    poolManager.recordLatency(10);
    poolManager.recordLatency(20);
    poolManager.recordLatency(30);

    const metrics = poolManager.getLatencyMetrics();
    expect(metrics.samples).toBe(3);
    expect(metrics.avg).toBe(20);
    expect(metrics.p50).toBe(20);
  });

  it('should return default metrics when no latency samples exist', () => {
    const metrics = poolManager.getLatencyMetrics();
    expect(metrics.samples).toBe(0);
    expect(metrics.p50).toBe(0);
    expect(metrics.avg).toBe(0);
  });

  it('should return properly structured pool telemetry data', () => {
    const stats = poolManager.getPoolStats();
    expect(stats).toHaveProperty('pool');
    expect(stats).toHaveProperty('circuitBreaker');
    expect(stats).toHaveProperty('latency');
    expect(stats.circuitBreaker.state).toBe('CLOSED');
  });

  it('should handle buffer eviction when maxLatencyHistorySize is exceeded', () => {
    poolManager.maxLatencyHistorySize = 3;
    poolManager.recordLatency(5);
    poolManager.recordLatency(10);
    poolManager.recordLatency(15);
    poolManager.recordLatency(20);

    expect(poolManager.queryLatencyHistory.length).toBe(3);
    expect(poolManager.queryLatencyHistory).toEqual([10, 15, 20]);
  });
});
