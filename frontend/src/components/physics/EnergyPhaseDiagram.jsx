import React from 'react';
import { Activity } from 'lucide-react';

const EnergyPhaseDiagram = ({ ballA, ballB }) => {
  const keA = 0.5 * ballA.mass * (ballA.vx * ballA.vx);
  const keB = 0.5 * ballB.mass * (ballB.vx * ballB.vx);
  const totalKe = keA + keB;
  const momentum = ballA.mass * ballA.vx + ballB.mass * ballB.vx;

  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Activity size={16} className="text-cyan-400" />
          Kinematic Phase & Conservation Telemetry
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
          <span className="text-gray-400 block text-[11px]">Total Kinetic Energy (J)</span>
          <span className="text-base font-extrabold text-cyan-300">{totalKe.toFixed(2)} J</span>
        </div>
        <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
          <span className="text-gray-400 block text-[11px]">Total Linear Momentum</span>
          <span className="text-base font-extrabold text-purple-300">{momentum.toFixed(2)} kg·m/s</span>
        </div>
      </div>

      <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 space-y-1 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>Body 1 Velocity:</span>
          <span className="text-cyan-400 font-mono font-bold">{ballA.vx.toFixed(2)} m/s</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Body 2 Velocity:</span>
          <span className="text-purple-400 font-mono font-bold">{ballB.vx.toFixed(2)} m/s</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyPhaseDiagram;
