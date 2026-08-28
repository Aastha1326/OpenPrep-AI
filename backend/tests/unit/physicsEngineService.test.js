import { describe, it, expect } from 'vitest';
import physicsEngineService from '../../services/physicsEngineService';

describe('PhysicsEngineService Classical Mechanics Unit Tests', () => {
  it('should calculate elastic collision with conservation of momentum and energy', () => {
    const bodyA = { mass: 2.0, vx: 5.0 };
    const bodyB = { mass: 2.0, vx: 0.0 };

    const result = physicsEngineService.simulateCollision(bodyA, bodyB, 1.0);

    expect(result.finalVelocities.v1).toBe(0);
    expect(result.finalVelocities.v2).toBe(5);
    expect(result.energyConserved).toBe(true);
    expect(result.momentumInitial).toBe(result.momentumFinal);
  });

  it('should compute ballistic projectile trajectory points and conservation profile', () => {
    const data = physicsEngineService.calculateProjectileTrajectory(20, 45, 9.81, 0, 20);

    expect(data.maxHeight).toBeGreaterThan(0);
    expect(data.totalRange).toBeGreaterThan(0);
    expect(data.trajectory.length).toBe(21);
    expect(data.trajectory[0].y).toBe(0);
  });

  it('should simulate harmonic spring oscillation with damping', () => {
    const sim = physicsEngineService.simulateHarmonicOscillator(1.0, 10.0, 0.1, 5.0, 30);

    expect(sim.trajectory.length).toBe(31);
    expect(sim.springConstant).toBe(10);
  });
});
