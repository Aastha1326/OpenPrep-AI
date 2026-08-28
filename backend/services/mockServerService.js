class MockServerService {
  constructor() {
    this.trafficLogs = [];
  }

  /**
   * Generates realistic JSON mock payload from schema blueprint
   */
  generateMockResponse(schema = {}) {
    if (typeof schema !== 'object' || schema === null) return schema;

    const result = {};
    for (const [key, type] of Object.entries(schema)) {
      if (typeof type === 'object' && !Array.isArray(type)) {
        result[key] = this.generateMockResponse(type);
      } else if (Array.isArray(type)) {
        result[key] = [this.generateMockResponse(type[0] || {})];
      } else if (type === 'string:id' || key.toLowerCase().includes('id')) {
        result[key] = `id_${Math.random().toString(36).substring(2, 9)}`;
      } else if (type === 'string:email' || key.toLowerCase().includes('email')) {
        result[key] = `student_${Math.floor(Math.random() * 1000)}@openprep.ai`;
      } else if (type === 'string:name' || key.toLowerCase().includes('name')) {
        result[key] = 'Alex Morgan';
      } else if (type === 'number' || typeof type === 'number') {
        result[key] = Math.floor(Math.random() * 100);
      } else if (type === 'boolean' || typeof type === 'boolean') {
        result[key] = true;
      } else if (type === 'string:timestamp' || key.toLowerCase().includes('time')) {
        result[key] = new Date().toISOString();
      } else {
        result[key] = `Sample ${key}`;
      }
    }
    return result;
  }

  /**
   * Records live request/response latency telemetry
   */
  recordTraffic(endpointId, method, path, status, durationMs) {
    const entry = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      endpointId,
      method,
      path,
      status,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    this.trafficLogs.unshift(entry);
    if (this.trafficLogs.length > 50) this.trafficLogs.pop();

    return entry;
  }

  getTrafficLogs() {
    return this.trafficLogs;
  }
}

module.exports = new MockServerService();
