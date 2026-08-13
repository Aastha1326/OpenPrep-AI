import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Download, Eye, ListTree, ZoomIn, RefreshCw } from 'lucide-react';

/**
 * Custom Node Renderer for Concept Mind Map Nodes
 */
const CustomConceptNode = ({ data, selected }) => {
  const category = data.category || 'topic';
  const categoryStyles = {
    root: 'bg-purple-950/90 border-purple-500/80 text-purple-100 shadow-purple-500/30',
    topic: 'bg-indigo-950/90 border-indigo-500/80 text-indigo-100 shadow-indigo-500/30',
    subtopic: 'bg-emerald-950/90 border-emerald-500/80 text-emerald-100 shadow-emerald-500/30',
    formula: 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-500/30',
    definition: 'bg-cyan-950/90 border-cyan-500/80 text-cyan-100 shadow-cyan-500/30',
  }[category] || 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-slate-500/20';

  const categoryBadges = {
    root: 'ROOT',
    topic: 'TOPIC',
    subtopic: 'SUB-CONCEPT',
    formula: 'FORMULA',
    definition: 'DEFINITION',
  }[category] || 'CONCEPT';

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 backdrop-blur-md transition-all duration-300 shadow-xl min-w-[160px] max-w-[240px] cursor-pointer hover:scale-105 ${categoryStyles} ${
        selected ? 'ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''
      } ${data.isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[9px] font-extrabold tracking-widest uppercase opacity-75">{categoryBadges}</span>
        {data.difficulty && (
          <span className="text-[9px] font-mono opacity-80 uppercase px-1.5 py-0.5 rounded bg-slate-950/50">
            {data.difficulty}
          </span>
        )}
      </div>
      <div className="text-xs font-bold leading-tight break-words">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  conceptNode: CustomConceptNode,
};

/**
 * Layout helper to calculate 2D positions for hierarchical nodes
 */
function layoutTreeNodes(nodesList = [], edgesList = []) {
  if (!nodesList || nodesList.length === 0) return [];

  // Group by depth/level based on parent-child relations
  const childrenMap = {};
  const parentMap = {};
  edgesList.forEach((edge) => {
    if (!childrenMap[edge.source]) childrenMap[edge.source] = [];
    childrenMap[edge.source].push(edge.target);
    parentMap[edge.target] = edge.source;
  });

  const rootNodes = nodesList.filter((n) => !parentMap[n.id] || n.category === 'root');
  const rootId = rootNodes.length > 0 ? rootNodes[0].id : nodesList[0].id;

  const levels = {};
  const queue = [{ id: rootId, level: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const { id, level } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);

    if (!levels[level]) levels[level] = [];
    levels[level].push(id);

    const children = childrenMap[id] || [];
    children.forEach((cId) => queue.push({ id: cId, level: level + 1 }));
  }

  // Position remaining unvisited nodes
  nodesList.forEach((n) => {
    if (!visited.has(n.id)) {
      if (!levels[1]) levels[1] = [];
      levels[1].push(n.id);
    }
  });

  const nodePositions = {};
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
  const LEVEL_HEIGHT = 160;
  const NODE_SPACING = 240;

  levelKeys.forEach((lvl) => {
    const idsInLevel = levels[lvl];
    const totalWidth = idsInLevel.length * NODE_SPACING;
    const startX = -(totalWidth / 2) + NODE_SPACING / 2;

    idsInLevel.forEach((id, idx) => {
      nodePositions[id] = {
        x: startX + idx * NODE_SPACING,
        y: lvl * LEVEL_HEIGHT,
      };
    });
  });

  return nodesList.map((n) => ({
    id: n.id,
    type: 'conceptNode',
    position: nodePositions[n.id] || { x: 0, y: 0 },
    data: {
      ...n,
      label: n.label,
      category: n.category,
    },
  }));
}

export default function MindMapCanvas({ graphData, onNodeSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccessibilityTree, setShowAccessibilityTree] = useState(false);

  const initialNodes = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.nodes)) return [];
    return layoutTreeNodes(graphData.nodes, graphData.edges || []);
  }, [graphData]);

  const initialEdges = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.edges)) return [];
    return graphData.edges.map((e) => ({
      id: e.id || `edge-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || '',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
    }));
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update dimmed status based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialNodes.map((n) => ({ ...n, data: { ...n.data, isDimmed: false } }));
    }
    const q = searchQuery.toLowerCase();
    return initialNodes.map((n) => {
      const match =
        (n.data.label && n.data.label.toLowerCase().includes(q)) ||
        (n.data.description && n.data.description.toLowerCase().includes(q));
      return {
        ...n,
        data: { ...n.data, isDimmed: !match },
      };
    });
  }, [initialNodes, searchQuery]);

  const handleExportPNG = useCallback(() => {
    // Create an SVG / Canvas snapshot download
    const svgEl = document.querySelector('.react-flow__renderer svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${graphData?.title || 'concept-mind-map'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [graphData]);

  const handleNodeClick = (_, node) => {
    if (onNodeSelect) {
      onNodeSelect(node.data);
    }
  };

  return (
    <div className="w-full h-[650px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search concepts or node labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 sm:w-72"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Screen Reader Text Tree View */}
          <button
            type="button"
            onClick={() => setShowAccessibilityTree(!showAccessibilityTree)}
            aria-expanded={showAccessibilityTree}
            aria-label="Toggle screen reader accessible text tree view"
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
              showAccessibilityTree
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>{showAccessibilityTree ? 'Canvas View' : 'Text Tree (A11y)'}</span>
          </button>

          {/* Export PNG/SVG Visual */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Screen Reader Accessible Collapsible Text Tree View */}
      {showAccessibilityTree ? (
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">
            Accessible Concept Hierarchy Tree
          </h3>
          <ul className="space-y-3 font-mono text-xs">
            {graphData?.nodes?.map((node) => (
              <li
                key={node.id}
                tabIndex={0}
                onClick={() => onNodeSelect && onNodeSelect(node)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors"
              >
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {node.category}
                  </span>
                  <span>{node.label}</span>
                </div>
                {node.description && <p className="text-slate-400 text-xs mt-1 font-sans">{node.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* React Flow Canvas Graph Renderer */
        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={filteredNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            onlyRenderVisibleElements={true}
            className="bg-slate-950"
          >
            <Background color="#334155" gap={24} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 !rounded-xl overflow-hidden" />
            <MiniMap
              nodeColor={(n) => (n.data?.category === 'root' ? '#8b5cf6' : '#6366f1')}
              maskColor="rgba(15, 23, 42, 0.8)"
              className="!bg-slate-900 !border-slate-800 !rounded-xl"
            />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
