import React, { useState, useEffect } from 'react';
import { Cpu, Play, RotateCcw, Table, Activity, Zap, Sparkles } from 'lucide-react';
import TruthTableCard from './TruthTableCard';
import TimingWaveformOscilloscope from './TimingWaveformOscilloscope';

const defaultNodes = [
  { id: 'in_a', type: 'INPUT', label: 'A', x: 60, y: 80, state: 1 },
  { id: 'in_b', type: 'INPUT', label: 'B', x: 60, y: 200, state: 0 },
  { id: 'gate_xor', type: 'XOR', label: 'XOR (Sum)', x: 260, y: 100 },
  { id: 'gate_and', type: 'AND', label: 'AND (Carry)', x: 260, y: 220 },
  { id: 'out_sum', type: 'OUTPUT', label: 'Sum', x: 480, y: 100, state: 1 },
  { id: 'out_carry', type: 'OUTPUT', label: 'Carry', x: 480, y: 220, state: 0 },
];

const LogicCircuitCanvas = () => {
  const [nodes, setNodes] = useState(defaultNodes);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'table' | 'oscilloscope'

  const toggleInput = (nodeId) => {
    setNodes((prev) => {
      const updated = prev.map((n) => (n.id === nodeId ? { ...n, state: n.state ? 0 : 1 } : n));
      const inA = updated.find((n) => n.id === 'in_a')?.state || 0;
      const inB = updated.find((n) => n.id === 'in_b')?.state || 0;

      // Recompute outputs
      return updated.map((n) => {
        if (n.id === 'out_sum') return { ...n, state: inA ^ inB };
        if (n.id === 'out_carry') return { ...n, state: inA & inB };
        return n;
      });
    });
  };

  const inA = nodes.find((n) => n.id === 'in_a')?.state || 0;
  const inB = nodes.find((n) => n.id === 'in_b')?.state || 0;
  const outSum = nodes.find((n) => n.id === 'out_sum')?.state || 0;
  const outCarry = nodes.find((n) => n.id === 'out_carry')?.state || 0;

  return (
    <div className="bg-gray-900/70 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Digital Logic Circuit Simulator</h3>
            <p className="text-xs text-gray-400">Interactive Gate Breadboard, Live Voltage Flow & Timing Waveforms</p>
          </div>
        </div>

        <div className="flex bg-gray-850 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'canvas' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Circuit Canvas
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'table' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Table size={13} /> Truth Table
          </button>
          <button
            onClick={() => setActiveTab('oscilloscope')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'oscilloscope' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={13} /> Waveforms
          </button>
        </div>
      </div>

      {/* Main View */}
      {activeTab === 'canvas' && (
        <div className="relative bg-gray-950 rounded-2xl border border-gray-800 p-6 h-80 overflow-hidden flex items-center justify-between">
          {/* Inputs Column */}
          <div className="flex flex-col gap-12 z-10">
            <div className="text-xs font-bold text-gray-400 uppercase">Input Pins</div>
            <button
              onClick={() => toggleInput('in_a')}
              className={`px-4 py-3 rounded-2xl border font-mono font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${
                inA
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              <Zap size={16} /> Pin A: {inA}
            </button>
            <button
              onClick={() => toggleInput('in_b')}
              className={`px-4 py-3 rounded-2xl border font-mono font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${
                inB
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              <Zap size={16} /> Pin B: {inB}
            </button>
          </div>

          {/* Logic Gates Column */}
          <div className="flex flex-col gap-8 z-10">
            <div className="px-6 py-4 rounded-2xl bg-gray-900 border border-purple-500/30 text-purple-300 text-xs font-bold shadow-lg text-center">
              XOR Gate (Sum Logic)
              <div className="font-mono text-[11px] text-gray-400 mt-0.5">A ⊕ B = {outSum}</div>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-gray-900 border border-blue-500/30 text-blue-300 text-xs font-bold shadow-lg text-center">
              AND Gate (Carry Logic)
              <div className="font-mono text-[11px] text-gray-400 mt-0.5">A ∧ B = {outCarry}</div>
            </div>
          </div>

          {/* Outputs Column */}
          <div className="flex flex-col gap-12 z-10">
            <div className="text-xs font-bold text-gray-400 uppercase">LED Outputs</div>
            <div
              className={`px-4 py-3 rounded-2xl border font-mono font-bold text-sm flex items-center gap-2 transition-all ${
                outSum
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              Sum (S): {outSum}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl border font-mono font-bold text-sm flex items-center gap-2 transition-all ${
                outCarry
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
            >
              Carry (C): {outCarry}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'table' && <TruthTableCard currentA={inA} currentB={inB} />}

      {activeTab === 'oscilloscope' && (
        <TimingWaveformOscilloscope
          signals={[
            { name: 'Input A', state: inA },
            { name: 'Input B', state: inB },
            { name: 'Sum Output', state: outSum },
            { name: 'Carry Output', state: outCarry },
          ]}
        />
      )}
    </div>
  );
};

export default LogicCircuitCanvas;
