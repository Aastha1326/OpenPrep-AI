import React from 'react';
import { Sliders } from 'lucide-react';

const PhysicsControlPanel = ({ gravity, setGravity, restitution, setRestitution }) => {
  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
        <Sliders size={16} className="text-cyan-400" />
        Physics Parameter Control Dials
      </h4>

      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between text-gray-300 font-semibold mb-1">
            <span>Coefficient of Restitution (e):</span>
            <span className="font-mono text-cyan-400 font-bold">{restitution} ({restitution === 1 ? 'Elastic' : 'Inelastic'})</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={restitution}
            onChange={(e) => setRestitution(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-gray-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-gray-300 font-semibold mb-1">
            <span>Gravitational Field (g):</span>
            <span className="font-mono text-purple-400 font-bold">{gravity} m/s²</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={gravity}
            onChange={(e) => setGravity(parseFloat(e.target.value))}
            className="w-full accent-purple-400 bg-gray-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default PhysicsControlPanel;
