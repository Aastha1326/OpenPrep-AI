import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import API from '../../services/api';

const SkillDependencyGraph = () => {
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    rootCauseGaps: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGraph = async () => {
      try {
        const response = await API.get(
          '/skill-gap/dependency-graph'
        );

        if (response.data?.success) {
          setGraph(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load skill dependency graph:', err);
        setError('Failed to load skill dependency graph.');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, []);

  const nodes = useMemo(
    () =>
      graph.nodes.map((node, index) => ({
        id: node.id,
        position: {
          x: (index % 4) * 240,
          y: Math.floor(index / 4) * 140,
        },
        data: {
          label: `${node.label}${
            graph.rootCauseGaps.some(
              (gap) => gap.topicId === node.id
            )
              ? ' • Root Gap'
              : ''
          }`,
        },
      })),
    [graph]
  );

  const edges = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.dependencyType,
        animated: true,
      })),
    [graph]
  );

  if (loading) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Loading skill dependency graph...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div
      className="w-full h-[600px] rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      data-testid="skill-dependency-graph"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default SkillDependencyGraph;