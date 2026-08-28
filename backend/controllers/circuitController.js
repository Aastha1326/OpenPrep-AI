const circuitService = require('../services/circuitService');
const CircuitModel = require('../models/CircuitModel');

/**
 * @desc    Evaluate circuit voltage propagation
 * @route   POST /api/circuits/evaluate
 * @access  Private
 */
exports.evaluateCircuit = (req, res) => {
  try {
    const { nodes = [], wires = [], inputValues = {} } = req.body;
    const result = circuitService.evaluateCircuit(nodes, wires, inputValues);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Generate full 2^N truth table for circuit
 * @route   POST /api/circuits/truth-table
 * @access  Private
 */
exports.generateTruthTable = (req, res) => {
  try {
    const { nodes = [], wires = [], inputLabels = [] } = req.body;
    const table = circuitService.generateTruthTable(nodes, wires, inputLabels);
    return res.json({ success: true, data: table });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get prebuilt circuit templates
 * @route   GET /api/circuits/templates
 * @access  Private
 */
exports.getTemplates = (req, res) => {
  const templates = circuitService.getTemplates();
  return res.json({ success: true, data: templates });
};

/**
 * @desc    Save user circuit project
 * @route   POST /api/circuits
 * @access  Private
 */
exports.saveCircuit = async (req, res) => {
  try {
    const { title, description, category, nodes, wires, isPublic, tags } = req.body;

    const circuit = await CircuitModel.create({
      userId: req.user.id,
      title: title || 'Untitled Digital Circuit',
      description,
      category: category || 'COMBINATIONAL',
      nodes: nodes || [],
      wires: wires || [],
      isPublic: !!isPublic,
      tags: tags || [],
    });

    return res.status(201).json({ success: true, data: circuit });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user saved circuits
 * @route   GET /api/circuits
 * @access  Private
 */
exports.getUserCircuits = async (req, res) => {
  try {
    const circuits = await CircuitModel.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
    });

    return res.json({ success: true, data: circuits });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
