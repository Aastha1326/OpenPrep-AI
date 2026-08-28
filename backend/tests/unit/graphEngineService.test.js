import { describe, it, expect } from 'vitest';
import graphEngineService from '../../services/graphEngineService';

describe('GraphEngineService Dijkstra & Matrix Unit Tests', () => {
  const nodes = [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
  ];

  const edges = [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'B', to: 'C', weight: 2 },
    { from: 'A', to: 'C', weight: 10 },
  ];

  it('should calculate shortest path via Dijkstra', () => {
    const result = graphEngineService.solveDijkstra(nodes, edges, 'A', 'C');

    expect(result.shortestPath).toEqual(['A', 'B', 'C']);
    expect(result.totalDistance).toBe(6);
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('should compute valid Adjacency and Laplacian matrices', () => {
    const matrices = graphEngineService.computeMatrices(nodes, edges);

    expect(matrices.adjacencyMatrix.length).toBe(3);
    expect(matrices.laplacianMatrix.length).toBe(3);
    expect(matrices.degreeMatrix[0][0]).toBe(2); // Node A has 2 edges
  });
});
