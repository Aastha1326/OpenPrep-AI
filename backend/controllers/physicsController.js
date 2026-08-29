const physicsEngineService = require('../services/physicsEngineService');
const PhysicsSimulationScenario = require('../models/PhysicsSimulationScenario');

/**
 * @desc    Simulate ballistic projectile kinematics
 * @route   POST /api/physics/projectile
 * @access  Private
 */
exports.simulateProjectile = (req, res) => {
  try {
    const { v0 = 20, angleDeg = 45, g = 9.81, height = 0 } = req.body;
    const data = physicsEngineService.calculateProjectileTrajectory(v0, angleDeg, g, height);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Simulate 2-body collision conservation laws
 * @route   POST /api/physics/collision
 * @access  Private
 */
exports.simulateCollision = (req, res) => {
  try {
    const { bodyA, bodyB, restitution = 1.0 } = req.body;
    const result = physicsEngineService.simulateCollision(bodyA, bodyB, restitution);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Simulate harmonic spring oscillator
 * @route   POST /api/physics/oscillator
 * @access  Private
 */
exports.simulateOscillator = (req, res) => {
  try {
    const { mass = 1.0, k = 10.0, damping = 0.1, x0 = 5.0 } = req.body;
    const data = physicsEngineService.simulateHarmonicOscillator(mass, k, damping, x0);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
