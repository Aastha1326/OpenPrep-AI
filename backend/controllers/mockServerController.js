const mockServerService = require('../services/mockServerService');
const MockEndpoint = require('../models/MockEndpoint');

/**
 * @desc    Create dynamic mock endpoint
 * @route   POST /api/mock-server/endpoints
 * @access  Private
 */
exports.createEndpoint = async (req, res) => {
  try {
    const { name, path, method = 'GET', statusCode = 200, delayMs = 150, responseSchema = {}, headers = {} } = req.body;

    const endpoint = await MockEndpoint.create({
      userId: req.user.id,
      name: name || 'Mock Route',
      path: path.startsWith('/') ? path : `/${path}`,
      method: method.toUpperCase(),
      statusCode: parseInt(statusCode, 10),
      delayMs: parseInt(delayMs, 10),
      responseSchema,
      headers,
    });

    return res.status(201).json({ success: true, data: endpoint });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    List user mock endpoints
 * @route   GET /api/mock-server/endpoints
 * @access  Private
 */
exports.getEndpoints = async (req, res) => {
  try {
    const endpoints = await MockEndpoint.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
    });

    return res.json({ success: true, data: endpoints });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Dispatch and execute a live mock test request
 * @route   POST /api/mock-server/test-dispatch
 * @access  Private
 */
exports.testDispatch = async (req, res) => {
  const startTime = Date.now();
  try {
    const { endpointId } = req.body;
    const endpoint = await MockEndpoint.findByPk(endpointId);
    if (!endpoint) return res.status(404).json({ message: 'Endpoint not found' });

    // Emulate artificial network delay
    if (endpoint.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(endpoint.delayMs, 3000)));
    }

    const payload = mockServerService.generateMockResponse(endpoint.responseSchema);
    const duration = Date.now() - startTime;

    mockServerService.recordTraffic(endpoint.id, endpoint.method, endpoint.path, endpoint.statusCode, duration);

    endpoint.callCount += 1;
    await endpoint.save();

    return res.status(endpoint.statusCode).json({
      ...payload,
      _mockMeta: {
        latencyMs: duration,
        status: endpoint.statusCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get live traffic inspection telemetry
 * @route   GET /api/mock-server/traffic
 * @access  Private
 */
exports.getTraffic = (req, res) => {
  const logs = mockServerService.getTrafficLogs();
  return res.json({ success: true, data: logs });
};
