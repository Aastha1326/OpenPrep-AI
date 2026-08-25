/**
 * Prometheus Telemetry Exporter Middleware
 * Tracks HTTP request durations, AI latency histograms, memory/CPU process metrics,
 * and active WebSocket connections.
 */

let client;
try {
  client = require('prom-client');
} catch (e) {
  client = null;
}

// Fallback metrics store when prom-client is not loaded
class SimpleRegistry {
  constructor() {
    this.metrics = new Map();
  }

  registerMetric(name, help, type) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { help, type, values: [] });
    }
  }

  observe(name, value, labels = {}) {
    this.registerMetric(name, 'Metric histogram value', 'histogram');
    const m = this.metrics.get(name);
    m.values.push({ value, labels, timestamp: Date.now() });
  }

  setGauge(name, value, labels = {}) {
    this.registerMetric(name, 'Metric gauge value', 'gauge');
    const m = this.metrics.get(name);
    m.values = [{ value, labels, timestamp: Date.now() }];
  }

  async metricsOutput() {
    let output = '';
    const memory = process.memoryUsage();
    
    output += `# HELP process_resident_memory_bytes Resident memory size in bytes.\n`;
    output += `# TYPE process_resident_memory_bytes gauge\nprocess_resident_memory_bytes ${memory.rss}\n\n`;
    
    output += `# HELP process_heap_bytes Process heap size in bytes.\n`;
    output += `# TYPE process_heap_bytes gauge\nprocess_heap_bytes ${memory.heapUsed}\n\n`;

    for (const [name, m] of this.metrics.entries()) {
      output += `# HELP ${name} ${m.help}\n`;
      output += `# TYPE ${name} ${m.type}\n`;
      if (m.type === 'gauge') {
        const val = m.values[0] ? m.values[0].value : 0;
        output += `${name} ${val}\n\n`;
      } else {
        const count = m.values.length;
        const sum = m.values.reduce((acc, curr) => acc + curr.value, 0);
        output += `${name}_count ${count}\n`;
        output += `${name}_sum ${sum.toFixed(4)}\n\n`;
      }
    }
    return output;
  }
}

let register;
let httpRequestDurationSeconds;
let aiGenerationDurationSeconds;
let activeWebsocketConnections;

if (client) {
  register = new client.Registry();
  client.collectDefaultMetrics({ register });

  httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  aiGenerationDurationSeconds = new client.Histogram({
    name: 'ai_generation_duration_seconds',
    help: 'Duration of Gemini AI API calls in seconds',
    labelNames: ['model', 'endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  });

  activeWebsocketConnections = new client.Gauge({
    name: 'active_websocket_connections',
    help: 'Current number of active WebSocket connections',
  });

  register.registerMetric(httpRequestDurationSeconds);
  register.registerMetric(aiGenerationDurationSeconds);
  register.registerMetric(activeWebsocketConnections);
} else {
  const fallback = new SimpleRegistry();
  register = {
    metrics: () => fallback.metricsOutput(),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
  };
  httpRequestDurationSeconds = {
    observe: (labels, duration) => fallback.observe('http_request_duration_seconds', duration, labels),
  };
  aiGenerationDurationSeconds = {
    observe: (labels, duration) => fallback.observe('ai_generation_duration_seconds', duration, labels),
  };
  activeWebsocketConnections = {
    set: (val) => fallback.setGauge('active_websocket_connections', val),
  };
}

/**
 * Middleware to track HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path || 'unknown';

    if (req.path !== '/metrics') {
      httpRequestDurationSeconds.observe(
        {
          method: req.method,
          route: route,
          status_code: res.statusCode,
        },
        durationInSeconds
      );
    }
  });

  next();
};

/**
 * Controller endpoint to expose Prometheus metrics
 */
const getMetrics = async (req, res) => {
  try {
    res.setHeader('Content-Type', client ? register.contentType : 'text/plain; version=0.0.4; charset=utf-8');
    const metricsOutput = typeof register.metrics === 'function' ? await register.metrics() : await register.metrics;
    res.status(200).send(metricsOutput);
  } catch (err) {
    res.status(500).send(`Error collecting metrics: ${err.message}`);
  }
};

module.exports = {
  metricsMiddleware,
  getMetrics,
  httpRequestDurationSeconds,
  aiGenerationDurationSeconds,
  activeWebsocketConnections,
  register,
};
