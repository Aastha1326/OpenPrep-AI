/**
 * @fileoverview Custom SVG-based interactive graph component for visualizing concept maps.
 * Supports panning, zooming, and node clicking without external heavy graph libraries.
 */
import React, { useState, useRef, useEffect } from 'react';

const InteractiveGraph = ({ nodes, edges }) => {
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedNode, setSelectedNode] = useState(null);
    const svgRef = useRef(null);

    // Calculate initial node positions in a circular layout
    const calculatePositions = () => {
        const centerX = 400;
        const centerY = 300;
        const radius = 200;

        return nodes.map((node, index) => {
            const angle = (index / nodes.length) * 2 * Math.PI;
            return {
                ...node,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            };
        });
    };

    const positionedNodes = calculatePositions();

    const handleWheel = (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        setTransform((prev) => ({
            ...prev,
            k: Math.max(0.5, Math.min(3, prev.k * scaleFactor)),
        }));
    };

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'svg') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
            setSelectedNode(null);
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setTransform((prev) => ({
                ...prev,
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node);
    };

    return (
        <div className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {/* Render Edges */}
                    {edges.map((edge, index) => {
                        const source = positionedNodes.find((n) => n.id === edge.source);
                        const target = positionedNodes.find((n) => n.id === edge.target);
                        if (!source || !target) return null;

                        return (
                            <g key={`edge-${index}`}>
                                <line
                                    x1={source.x}
                                    y1={source.y}
                                    x2={target.x}
                                    y2={target.y}
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    className="dark:stroke-gray-600"
                                />
                                <text
                                    x={(source.x + target.x) / 2}
                                    y={(source.y + target.y) / 2 - 5}
                                    textAnchor="middle"
                                    className="text-xs fill-gray-500 dark:fill-gray-400 bg-white dark:bg-gray-900"
                                >
                                    {edge.relationship}
                                </text>
                            </g>
                        );
                    })}

                    {/* Render Nodes */}
                    {positionedNodes.map((node) => (
                        <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => handleNodeClick(node)}
                            className="cursor-pointer transition-transform hover:scale-110"
                        >
                            <circle
                                r="30"
                                fill={selectedNode?.id === node.id ? '#3b82f6' : '#ffffff'}
                                stroke="#3b82f6"
                                strokeWidth="3"
                                className="dark:fill-gray-800 dark:stroke-blue-500 transition-colors"
                            />
                            <text
                                textAnchor="middle"
                                dy="5"
                                className="text-xs font-semibold fill-gray-800 dark:fill-gray-100 pointer-events-none"
                            >
                                {node.label.length > 10 ? node.label.substring(0, 10) + '...' : node.label}
                            </text>
                        </g>
                    ))}
                </g>
            </svg>

            {/* Node Details Panel */}
            {selectedNode && (
                <div className="absolute top-4 right-4 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedNode.label}</h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full mb-3">
                        {selectedNode.category}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedNode.description}
                    </p>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                    onClick={() => setTransform((prev) => ({ ...prev, k: Math.min(3, prev.k * 1.2) }))}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </button>
                <button
                    onClick={() => setTransform((prev) => ({ ...prev, k: Math.max(0.5, prev.k * 0.8) }))}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <button
                    onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
        </div>
    );
};

export default InteractiveGraph;
