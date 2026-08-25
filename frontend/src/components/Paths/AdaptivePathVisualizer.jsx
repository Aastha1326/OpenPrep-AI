/**
 * @fileoverview Interactive visualizer for the adaptive study path.
 * Displays nodes and edges, allowing users to track progress and unlock new topics.
 */
import React, { useState, useMemo } from 'react';

const AdaptivePathVisualizer = ({ pathData, onNodeComplete }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodes, setNodes] = useState(pathData?.nodes || []);
    const [edges, setEdges] = useState(pathData?.edges || []);

    // Calculate simple grid positions for nodes based on their index
    const positionedNodes = useMemo(() => {
        return nodes.map((node, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            return {
                ...node,
                x: 150 + col * 250,
                y: 100 + row * 150,
            };
        });
    }, [nodes]);

    const handleNodeClick = (node) => {
        if (node.status !== 'locked') {
            setSelectedNode(node);
        }
    };

    const handleMarkComplete = async (score) => {
        if (selectedNode) {
            // Optimistic update
            const updatedNodes = nodes.map((n) =>
                n.id === selectedNode.id ? { ...n, status: 'completed' } : n
            );

            // Unlock dependent nodes
            const dependentEdge = edges.find((e) => e.source === selectedNode.id);
            if (dependentEdge) {
                const updatedNodesWithUnlocks = updatedNodes.map((n) =>
                    n.id === dependentEdge.target && n.status === 'locked'
                        ? { ...n, status: 'available' }
                        : n
                );
                setNodes(updatedNodesWithUnlocks);
            } else {
                setNodes(updatedNodes);
            }

            setSelectedNode(null);
            await onNodeComplete(selectedNode.id, score);
        }
    };

    if (!pathData) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                No study path generated yet. Create one to visualize your learning trajectory.
            </div>
        );
    }

    return (
        <div className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">{pathData.pathName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Est. Completion: {pathData.estimatedCompletionDays} days
                </p>
            </div>

            <svg className="w-full h-full">
                {/* Render Edges */}
                {edges.map((edge, index) => {
                    const source = positionedNodes.find((n) => n.id === edge.source);
                    const target = positionedNodes.find((n) => n.id === edge.target);
                    if (!source || !target) return null;

                    const isUnlocked = source.status === 'completed';

                    return (
                        <g key={`edge-${index}`}>
                            <line
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={isUnlocked ? '#3b82f6' : '#d1d5db'}
                                strokeWidth="3"
                                strokeDasharray={isUnlocked ? '0' : '5,5'}
                                className="transition-colors duration-300 dark:stroke-gray-600"
                            />
                            <text
                                x={(source.x + target.x) / 2}
                                y={(source.y + target.y) / 2 - 8}
                                textAnchor="middle"
                                className="text-xs fill-gray-500 dark:fill-gray-400 bg-white dark:bg-gray-900"
                            >
                                {edge.relationship}
                            </text>
                        </g>
                    );
                })}

                {/* Render Nodes */}
                {positionedNodes.map((node) => {
                    const isLocked = node.status === 'locked';
                    const isCompleted = node.status === 'completed';

                    let fillColor = '#ffffff';
                    let strokeColor = '#3b82f6';
                    if (isLocked) { strokeColor = '#9ca3af'; fillColor = '#f3f4f6'; }
                    if (isCompleted) { strokeColor = '#10b981'; fillColor = '#d1fae5'; }

                    return (
                        <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => handleNodeClick(node)}
                            className={`transition-all duration-200 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110'}`}
                        >
                            <circle
                                r="40"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth="3"
                                className="dark:fill-gray-800 transition-colors"
                            />
                            <text
                                textAnchor="middle"
                                dy="5"
                                className="text-sm font-bold fill-gray-800 dark:fill-gray-100 pointer-events-none"
                            >
                                {node.topic.length > 12 ? node.topic.substring(0, 12) + '...' : node.topic}
                            </text>
                            {isCompleted && (
                                <text
                                    textAnchor="middle"
                                    dy="25"
                                    className="text-xs fill-green-600 dark:fill-green-400 pointer-events-none"
                                >
                                    ✓ Done
                                </text>
                            )}
                            {isLocked && (
                                <text
                                    textAnchor="middle"
                                    dy="25"
                                    className="text-xs fill-gray-500 dark:fill-gray-400 pointer-events-none"
                                >
                                    🔒
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Node Details Modal */}
            {selectedNode && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 z-20">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedNode.topic}</h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-3 ${selectedNode.difficulty === 'Hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            selectedNode.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                        {selectedNode.difficulty} • {selectedNode.estimatedMinutes} mins
                    </span>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {selectedNode.description}
                    </p>

                    {selectedNode.status === 'available' && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Simulate quiz completion score:</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMarkComplete(85)}
                                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Pass (85+)
                                </button>
                                <button
                                    onClick={() => handleMarkComplete(60)}
                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Review (60)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdaptivePathVisualizer;
