import React, { useState } from 'react';
import { Share2, Play, Table, RotateCcw, Sparkles } from 'lucide-react';
import PathfindingStepPlayer from './PathfindingStepPlayer';
import MatrixInspectorCard from './MatrixInspectorCard';

const defaultGraph = {
  nodes: [
    { id: 'A', label: 'Node A', x: 80, y: 120 },
    { id: 'B', label: 'Node B', x: 260, y: 60 },
    { id: 'C', label: 'Node C', x: 260, y: 190 },
    { id: 'D', label: 'Node D', x: 440, y: 120 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'C', to: 'B', weight: 1 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 8 },
  ],
};

const GraphCanvasEditor = () => {
  const [graph, setGraph] = useState(defaultGraph);
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'matrix'
  const [startNode, setStartNode] = useState('A');
  const [targetNode, setTargetNode] = useState('D');

  return (
    <div className="bg-gray-900/70 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Share2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Graph Theory & Discrete Math Lab</h3>
            <p className="text-xs text-gray-400">Interactive Pathfinding Traversals & Laplacian Matrix Algebra</p>
          </div>
        </div>

        <div className="flex bg-gray-850 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'canvas' ? 'bg-amber-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Graph Canvas
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix' ? 'bg-amber-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Table size={13} /> Adjacency Matrices
          </button>
        </div>
      </div>

      {activeTab === 'canvas' ? (
        <div className="space-y-6">
          {/* Visual Canvas Representation */}
          <div className="relative bg-gray-950 rounded-2xl border border-gray-800 p-6 h-72 overflow-hidden flex items-center justify-around">
            {/* Render Nodes */}
            {graph.nodes.map((node) => {
              const isStart = node.id === startNode;
              const isTarget = node.id === targetNode;

              return (
                <div
                  key={node.id}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-lg transition-all border ${
                    isStart
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20 scale-110'
                      : isTarget
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-purple-500/20 scale-110'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <span className="font-mono text-sm">{node.id}</span>
                  <span className="text-[9px] text-gray-400">{isStart ? 'Start' : isTarget ? 'Target' : ''}</span>
                </div>
              );
            })}
          </div>

          <PathfindingStepPlayer nodes={graph.nodes} edges={graph.edges} startNode={startNode} targetNode={targetNode} />
        </div>
      ) : (
        <MatrixInspectorCard nodes={graph.nodes} edges={graph.edges} />
      )}
    </div>
  );
};

export default GraphCanvasEditor;
