import { describe, it, expect } from 'vitest';
import mockServerService from '../../services/mockServerService';

describe('MockServerService & Dynamic Schema Payload Unit Tests', () => {
  it('should generate realistic mock payload according to schema template', () => {
    const schema = {
      userId: 'string:id',
      email: 'string:email',
      fullName: 'string:name',
      score: 'number',
      createdAt: 'string:timestamp',
    };

    const payload = mockServerService.generateMockResponse(schema);

    expect(payload).toHaveProperty('userId');
    expect(payload.email).toContain('@openprep.ai');
    expect(payload.fullName).toBe('Alex Morgan');
    expect(typeof payload.score).toBe('number');
    expect(payload).toHaveProperty('createdAt');
  });

  it('should record request traffic telemetry accurately', () => {
    const log = mockServerService.recordTraffic('ep_1', 'GET', '/api/v1/users', 200, 142);

    expect(log.endpointId).toBe('ep_1');
    expect(log.durationMs).toBe(142);
    expect(log.status).toBe(200);

    const logs = mockServerService.getTrafficLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].id).toBe(log.id);
  });
});
