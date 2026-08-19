import React, { useState } from 'react';
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Layers, 
    Sparkles, 
    Download, 
    Search, 
    RotateCcw,
    ChevronRight,
    Brain,
    Sliders
} from 'lucide-react';
import { MindMapGraphData, MindMapNode, PRESET_MIND_MAPS, generateMindMapFromText } from './mindMapEngine';
import { NodeDetailModal } from './NodeDetailModal';

export const MindMapCanvas: React.FC = () => {
    const [graphData, setGraphData] = useState<MindMapGraphData>(PRESET_MIND_MAPS["os_concurrency"]);
    const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [customTopicInput, setCustomTopicInput] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Filter nodes by search query
    const filteredNodes = graphData.nodes.filter(node => 
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGenerateCustomMap = () => {
        if (!customTopicInput.trim()) return;
        setIsGenerating(true);
        setTimeout(() => {
            const newMap = generateMindMapFromText(customTopicInput);
            setGraphData(newMap);
            setCustomTopicInput('');
            setIsGenerating(false);
        }, 1200);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl">
                <div>
                    <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
                        <Layers className="w-4 h-4" />
                        AI Graph Visualizer
                    </div>
                    <h1 className="text-2xl font-black text-slate-100 mt-1">{graphData.title}</h1>
                    <p className="text-xs text-slate-400">{graphData.subject} • {graphData.nodes.length} Concept Nodes Rendered</p>
                </div>

                {/* AI Generator Search Bar */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={customTopicInput}
                        onChange={(e) => setCustomTopicInput(e.target.value)}
                        placeholder="Type topic (e.g. Quantum Computing)..."
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-48 sm:w-64"
                    />
                    <button
                        onClick={handleGenerateCustomMap}
                        disabled={isGenerating || !customTopicInput.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isGenerating ? "Synthesizing..." : "Generate AI Map"}
                    </button>
                </div>
            </div>

            {/* Interactive Canvas Workspace */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-6 min-h-[520px] overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* Canvas Background Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

                {/* Top Control Toolbar */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter node labels..."
                                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => alert("Downloading High-Resolution PNG Mind Map Diagram...")}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors ml-2"
                        >
                            <Download className="w-3.5 h-3.5" /> Export PNG
                        </button>
                    </div>
                </div>

                {/* SVG Connecting Edges & Nodes Display */}
                <div
                    className="relative z-0 my-8 transition-transform duration-300"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {graphData.edges.map((edge) => {
                            const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                            const targetNode = graphData.nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;

                            return (
                                <g key={edge.id}>
                                    <line
                                        x1={sourceNode.position.x + 80}
                                        y1={sourceNode.position.y + 25}
                                        x2={targetNode.position.x + 80}
                                        y2={targetNode.position.y + 25}
                                        stroke="#475569"
                                        strokeWidth="2"
                                        strokeDasharray={edge.animated ? "4,4" : undefined}
                                        className={edge.animated ? "animate-pulse" : ""}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Nodes Grid Layout */}
                    <div className="relative min-h-[380px]">
                        {filteredNodes.map((node) => {
                            const nodeStyles = {
                                root: "bg-indigo-950/90 border-indigo-500/60 text-indigo-200 shadow-indigo-500/20",
                                subject: "bg-teal-950/90 border-teal-500/60 text-teal-200 shadow-teal-500/20",
                                subtopic: "bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-500/20",
                                concept: "bg-purple-950/90 border-purple-500/60 text-purple-200 shadow-purple-500/20",
                                formula: "bg-blue-950/90 border-blue-500/60 text-blue-200 shadow-blue-500/20"
                            }[node.category];

                            return (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    style={{
                                        left: `${node.position.x}px`,
                                        top: `${node.position.y}px`
                                    }}
                                    className={`absolute cursor-pointer w-44 p-3 rounded-2xl border backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-105 hover:z-20 ${nodeStyles}`}
                                >
                                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                        <span>{node.category}</span>
                                        <span>{node.masteryPercentage}%</span>
                                    </div>
                                    <h4 className="text-xs font-bold truncate">{node.label}</h4>
                                    <p className="text-[10px] opacity-75 line-clamp-2 mt-1">{node.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Canvas Footer Status */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-900">
                    <span>Click any node to reveal formulas, definitions, and flashcards.</span>
                    <span>GPU Canvas Active</span>
                </div>
            </div>

            {/* Node Detail Modal */}
            <NodeDetailModal
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onLaunchQuiz={(nodeId) => alert(`Launching Spaced Repetition Quiz for Node ID: ${nodeId}`)}
            />
        </div>
    );
};
