const graphEngineService = require('../services/graphEngineService');
const GraphProject = require('../models/GraphProject');

/**
 * @desc    Solve shortest path via Dijkstra with step animation frames
 * @route   POST /api/graphs/solve-path
 * @access  Private
 */
exports.solvePath = (req, res) => {
  try {
    const { nodes = [], edges = [], startNodeId, targetNodeId } = req.body;
    const result = graphEngineService.solveDijkstra(nodes, edges, startNodeId, targetNodeId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Compute Adjacency & Laplacian matrices
 * @route   POST /api/graphs/matrices
 * @access  Private
 */
exports.computeMatrices = (req, res) => {
  try {
    const { nodes = [], edges = [] } = req.body;
    const matrices = graphEngineService.computeMatrices(nodes, edges);
    return res.json({ success: true, data: matrices });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
