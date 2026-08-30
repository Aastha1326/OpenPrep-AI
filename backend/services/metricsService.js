const client = require('prom-client');

// Initialize default system metrics (CPU, RAM, Event Loop lag, etc.)
client.collectDefaultMetrics({ register: client.register });

// 1. HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds bucketed by method, route, and status code.',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // custom latency buckets
});

// 2. HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed.',
  labelNames: ['method', 'route', 'status_code'],
});

// 3. Database query execution time histogram
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database execution query times in seconds.',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// 4. Upstream AI tokens count counter
const aiTokensConsumedTotal = new client.Counter({
  name: 'ai_tokens_consumed_total',
  help: 'Total number of upstream AI tokens consumed across Gemini models.',
  labelNames: ['model', 'type'], // type: 'input' (prompt), 'output' (candidates), 'total'
});

// 5. Active WebSocket connections gauge
const activeWebsocketConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active connected WebSocket sessions.',
});

/**
 * Record API route requests metrics
 */
function recordHttpRequest(method, route, statusCode, duration) {
  try {
    const labels = {
      method: method || 'GET',
      route: route || 'unknown',
      status_code: String(statusCode || 200),
    };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  } catch (err) {
    // Fail-safe
  }
}

/**
 * Record database execution duration
 * @param {number} duration - seconds
 */
function recordDbQueryDuration(duration) {
  try {
    dbQueryDuration.observe(duration);
  } catch (err) {
    // Fail-safe
  }
}

/**
 * Record Gemini API response token metadata
 * @param {object} result - Gemini response object
 * @param {string} modelName
 */
function recordTokens(result, modelName = 'gemini-1.5-flash') {
  try {
    if (result && result.response && result.response.usageMetadata) {
      const { promptTokenCount, candidatesTokenCount, totalTokenCount } = result.response.usageMetadata;
      recordTokensConsumed(modelName, promptTokenCount, candidatesTokenCount);
    }
  } catch (err) {
    // Fail-safe
  }
}

/**
 * Increment AI token counters directly
 * @param {string} modelName
 * @param {number} inputTokens
 * @param {number} outputTokens
 */
function recordTokensConsumed(modelName, inputTokens, outputTokens) {
  try {
    const name = modelName || 'gemini-2.5-flash';
    if (inputTokens) {
      aiTokensConsumedTotal.inc({ model: name, type: 'input' }, inputTokens);
    }
    if (outputTokens) {
      aiTokensConsumedTotal.inc({ model: name, type: 'output' }, outputTokens);
    }
    const total = (inputTokens || 0) + (outputTokens || 0);
    if (total) {
      aiTokensConsumedTotal.inc({ model: name, type: 'total' }, total);
    }
  } catch (err) {
    // Fail-safe
  }
}

module.exports = {
  register: client.register,
  recordHttpRequest,
  recordDbQueryDuration,
  recordTokens,
  recordTokensConsumed,
  activeWebsocketConnections,
};
