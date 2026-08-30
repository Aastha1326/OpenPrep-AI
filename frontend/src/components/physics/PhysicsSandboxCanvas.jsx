import React, { useState, useEffect, useRef } from 'react';
import { Atom, Play, Pause, RotateCcw, Sliders, Activity } from 'lucide-react';
import EnergyPhaseDiagram from './EnergyPhaseDiagram';
import PhysicsControlPanel from './PhysicsControlPanel';

const PhysicsSandboxCanvas = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gravity, setGravity] = useState(9.81);
  const [restitution, setRestitution] = useState(0.9);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'energy'

  // Ball states
  const [ballA, setBallA] = useState({ x: 100, y: 150, vx: 4, vy: 0, mass: 2, radius: 24, color: '#38bdf8' });
  const [ballB, setBallB] = useState({ x: 400, y: 150, vx: -2, vy: 0, mass: 2, radius: 24, color: '#a855f7' });

  const animRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = setInterval(() => {
        setBallA((prevA) => {
          setBallB((prevB) => {
            let newAx = prevA.x + prevA.vx;
            let newBx = prevB.x + prevB.vx;
            let newAvx = prevA.vx;
            let newBvx = prevB.vx;

            // Wall collisions
            if (newAx <= 30 || newAx >= 550) newAvx *= -1;
            if (newBx <= 30 || newBx >= 550) newBvx *= -1;

            // Ball-ball collision
            const dx = newBx - newAx;
            if (Math.abs(dx) <= prevA.radius + prevB.radius) {
              const m1 = prevA.mass;
              const m2 = prevB.mass;
              const u1 = prevA.vx;
              const u2 = prevB.vx;
              newAvx = (m1 * u1 + m2 * u2 - m2 * restitution * (u1 - u2)) / (m1 + m2);
              newBvx = (m1 * u1 + m2 * u2 + m1 * restitution * (u1 - u2)) / (m1 + m2);
            }

            return { ...prevB, x: newBx, vx: newBvx };
          });
          return { ...prevA, x: prevA.x + prevA.vx, vx: prevA.vx };
        });
      }, 30);
    } else {
      clearInterval(animRef.current);
    }
    return () => clearInterval(animRef.current);
  }, [isPlaying, restitution]);

  const handleReset = () => {
    setIsPlaying(false);
    setBallA({ x: 100, y: 150, vx: 4, vy: 0, mass: 2, radius: 24, color: '#38bdf8' });
    setBallB({ x: 400, y: 150, vx: -2, vy: 0, mass: 2, radius: 24, color: '#a855f7' });
  };

  return (
    <div className="bg-gray-900/70 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
            <Atom size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">2D Classical Physics Mechanics Sandbox</h3>
            <p className="text-xs text-gray-400">Verlet Integrations, Elastic Collisions & Real-Time Energy Curves</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all ${
              isPlaying ? 'bg-amber-500 text-gray-950' : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause Simulation' : 'Run Simulation'}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-850 hover:bg-gray-750 text-gray-300 rounded-xl border border-gray-700 transition-all"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Physics Canvas Simulation Area */}
      <div className="relative bg-gray-950 rounded-2xl border border-gray-800 p-4 h-72 overflow-hidden flex items-center justify-center">
        {/* Floor Line */}
        <div className="absolute bottom-6 left-0 right-0 h-1 bg-gray-800 border-t border-gray-700" />

        {/* Ball A */}
        <div
          className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold font-mono text-gray-950 shadow-lg shadow-cyan-500/30 transition-all"
          style={{
            left: `${ballA.x}px`,
            top: `${ballA.y}px`,
            backgroundColor: ballA.color,
          }}
        >
          m₁
        </div>

        {/* Ball B */}
        <div
          className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold font-mono text-white shadow-lg shadow-purple-500/30 transition-all"
          style={{
            left: `${ballB.x}px`,
            top: `${ballB.y}px`,
            backgroundColor: ballB.color,
          }}
        >
          m₂
        </div>
      </div>

      {/* Energy & Control Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnergyPhaseDiagram ballA={ballA} ballB={ballB} />
        <PhysicsControlPanel
          gravity={gravity}
          setGravity={setGravity}
          restitution={restitution}
          setRestitution={setRestitution}
        />
      </div>
    </div>
  );
};

export default PhysicsSandboxCanvas;
