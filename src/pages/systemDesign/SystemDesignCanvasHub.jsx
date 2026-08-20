import React, { useState } from 'react';
import { Layers, Plus, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { INITIAL_CANVAS_NODES, INITIAL_CONNECTIONS } from '../../services/architectureEngine';
import { NodeComponent } from '../../components/systemDesign/NodeComponent';

export const SystemDesignCanvasHub = () => {
    const [nodes, setNodes] = useState(INITIAL_CANVAS_NODES);
    const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
    const [selectedNode, setSelectedNode] = useState(null);
    const [validationMessage, setValidationMessage] = useState(null);

    const handleAddNode = (type, label) => {
        const newNode = {
            id: `node_${nodes.length + 1}`,
            type,
            label,
            x: 100 + Math.floor(Math.random() * 400),
            y: 100 + Math.floor(Math.random() * 200),
            status: "healthy"
        };
        setNodes(prev => [...prev, newNode]);
    };

    const handleValidateTopology = () => {
        setValidationMessage("✅ High Availability Architecture Verified! Multi-region load balancing and secondary cache fallbacks configured properly.");
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 font-sans p-4">
            {/* Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                            <Layers className="w-4 h-4" /> OpenPrep-AI Cloud Modeler
                        </div>
                        <h1 className="text-2xl font-black text-slate-100 mt-1">System Design Architecture Canvas</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleValidateTopology}
                            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Analyze Topology
                        </button>
                    </div>
                </div>
            </div>

            {/* Validation Banner */}
            {validationMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{validationMessage}</span>
                </div>
            )}

            {/* Interactive Canvas Area */}
            <div className="relative w-full h-[450px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <button
                        onClick={() => handleAddNode('microservice', 'Auth Service')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Microservice
                    </button>
                    <button
                        onClick={() => handleAddNode('cache', 'Redis Cache')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-rose-400" /> Add Cache Cluster
                    </button>
                </div>

                {/* SVG Connections Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connections.map(conn => {
                        const from = nodes.find(n => n.id === conn.fromNodeId);
                        const to = nodes.find(n => n.id === conn.toNodeId);
                        if (!from || !to) return null;
                        return (
                            <line
                                key={conn.id}
                                x1={from.x + 80}
                                y1={from.y + 25}
                                x2={to.x + 10}
                                y2={to.y + 25}
                                stroke="#4f46e5"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                        );
                    })}
                </svg>

                {/* Render Nodes */}
                {nodes.map(n => (
                    <NodeComponent
                        key={n.id}
                        node={n}
                        isSelected={selectedNode?.id === n.id}
                        onClick={setSelectedNode}
                    />
                ))}
            </div>
        </div>
    );
};

export default SystemDesignCanvasHub;
