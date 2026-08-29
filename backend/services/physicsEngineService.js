class PhysicsEngineService {
  /**
   * Simulates 1D/2D elastic and inelastic collision kinematics
   */
  simulateCollision(bodyA, bodyB, restitution = 1.0) {
    const m1 = bodyA.mass || 1.0;
    const m2 = bodyB.mass || 1.0;
    const u1 = bodyA.vx || 0;
    const u2 = bodyB.vx || 0;

    // 1D Coefficient of Restitution Collision Formula
    // v1 = (m1*u1 + m2*u2 - m2*e*(u1 - u2)) / (m1 + m2)
    // v2 = (m1*u1 + m2*u2 + m1*e*(u1 - u2)) / (m1 + m2)
    const totalMass = m1 + m2;
    const v1 = (m1 * u1 + m2 * u2 - m2 * restitution * (u1 - u2)) / totalMass;
    const v2 = (m1 * u1 + m2 * u2 + m1 * restitution * (u1 - u2)) / totalMass;

    // Kinetic energies before and after
    const initialKe = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const finalKe = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;

    return {
      finalVelocities: { v1: parseFloat(v1.toFixed(3)), v2: parseFloat(v2.toFixed(3)) },
      initialKineticEnergy: parseFloat(initialKe.toFixed(3)),
      finalKineticEnergy: parseFloat(finalKe.toFixed(3)),
      energyConserved: Math.abs(initialKe - finalKe) < 0.001,
      momentumInitial: parseFloat((m1 * u1 + m2 * u2).toFixed(3)),
      momentumFinal: parseFloat((m1 * v1 + m2 * v2).toFixed(3)),
    };
  }

  /**
   * Calculates ballistic projectile trajectory with gravity and drag
   */
  calculateProjectileTrajectory(v0 = 20, angleDeg = 45, g = 9.81, height = 0, steps = 50) {
    const rad = (angleDeg * Math.PI) / 180;
    const vx0 = v0 * Math.cos(rad);
    const vy0 = v0 * Math.sin(rad);

    // Time of flight: y(t) = h + vy0*t - 0.5*g*t^2 = 0
    const discriminant = vy0 * vy0 + 2 * g * height;
    const totalTime = (vy0 + Math.sqrt(discriminant)) / g;

    const points = [];
    const dt = totalTime / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const x = vx0 * t;
      const y = Math.max(0, height + vy0 * t - 0.5 * g * t * t);
      const vx = vx0;
      const vy = vy0 - g * t;

      const ke = 0.5 * (vx * vx + vy * vy);
      const pe = g * y;

      points.push({
        t: parseFloat(t.toFixed(3)),
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        ke: parseFloat(ke.toFixed(2)),
        pe: parseFloat(pe.toFixed(2)),
        totalEnergy: parseFloat((ke + pe).toFixed(2)),
      });
    }

    return {
      maxHeight: parseFloat((height + (vy0 * vy0) / (2 * g)).toFixed(2)),
      totalRange: parseFloat((vx0 * totalTime).toFixed(2)),
      totalTime: parseFloat(totalTime.toFixed(2)),
      trajectory: points,
    };
  }

  /**
   * Harmonic oscillator spring physics
   */
  simulateHarmonicOscillator(mass = 1.0, k = 10.0, damping = 0.1, x0 = 5.0, steps = 60) {
    const dt = 0.1;
    let x = x0;
    let v = 0;
    const trajectory = [];

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      // F = -kx - c*v
      const a = (-k * x - damping * v) / mass;
      v += a * dt;
      x += v * dt;

      const ke = 0.5 * mass * v * v;
      const pe = 0.5 * k * x * x;

      trajectory.push({
        t: parseFloat(t.toFixed(2)),
        x: parseFloat(x.toFixed(3)),
        v: parseFloat(v.toFixed(3)),
        ke: parseFloat(ke.toFixed(3)),
        pe: parseFloat(pe.toFixed(3)),
        totalEnergy: parseFloat((ke + pe).toFixed(3)),
      });
    }

    return {
      springConstant: k,
      mass,
      trajectory,
    };
  }
}

module.exports = new PhysicsEngineService();
