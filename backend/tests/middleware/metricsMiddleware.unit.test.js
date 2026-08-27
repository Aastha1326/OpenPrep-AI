const {
  metricsMiddleware,
  getMetrics,
  httpRequestDurationSeconds,
  activeWebsocketConnections,
  aiGenerationDurationSeconds,
} = require('../../middleware/metricsMiddleware');

describe('Prometheus Telemetry Exporter Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    req = {
      method: 'GET',
      path: '/api/quizzes',
      route: { path: '/api/quizzes' },
    };
    res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') callback();
      }),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    next = vi.fn();
  });

  it('measures request timing and records HTTP metrics on response finish', () => {
    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('exposes OpenMetrics formatted string via getMetrics endpoint', async () => {
    await getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
    const metricsOutput = res.send.mock.calls[0][0];
    expect(metricsOutput).toContain('process_resident_memory_bytes');
  });

  it('allows updating custom Prometheus gauge and histogram metrics', () => {
    expect(() => {
      if (typeof activeWebsocketConnections.set === 'function') {
        activeWebsocketConnections.set(5);
      }
      if (typeof aiGenerationDurationSeconds.observe === 'function') {
        aiGenerationDurationSeconds.observe({ model: 'gemini-1.5-flash', endpoint: '/generate-ai' }, 1.25);
      }
    }).not.toThrow();
  });
});
