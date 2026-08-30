const rateLimiterMiddleware = require('../middleware/rateLimiter');

describe('Sliding Window Rate Limiter Middleware Integration Tests', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '192.168.1.1',
      path: '/api/v1/ai/generate-quiz',
      user: null // Default anonymous user
    };
    
    mockResponse = {
      headers: {},
      setHeader: function (key, value) { this.headers[key] = value; },
      status: function (code) { this.statusCode = code; return this; },
      json: function (data) { this.body = data; return this; }
    };
    
    nextFunction = jest.fn();
  });

  test('should enforce strict rate limits and return standardized response headers', async () => {
    // Fire successive anonymous requests to exhaust the 10 request limit
    for (let i = 0; i < 10; i++) {
      await rateLimiterMiddleware(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      nextFunction.mockClear();
    }

    // The 11th request must trigger a 429 Too Many Requests response
    await rateLimiterMiddleware(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.statusCode).toBe(429);
    expect(mockResponse.body.error).toBe('Too Many Requests');
    expect(mockResponse.headers['X-RateLimit-Limit']).toBe(10);
    expect(mockResponse.headers['X-RateLimit-Remaining']).toBe(0);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should adjust limits dynamically based on roles and paths', async () => {
    mockRequest.user = { id: 'usr-99', role: 'educator' }; // Educator user
    
    await rateLimiterMiddleware(mockRequest, mockResponse, nextFunction);
    
    expect(mockResponse.headers['X-RateLimit-Limit']).toBe(180);
    expect(nextFunction).toHaveBeenCalled();
  });
});
