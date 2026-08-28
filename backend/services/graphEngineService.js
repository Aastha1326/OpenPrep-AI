class GraphEngineService {
  /**
   * Generates step-by-step Dijkstra shortest path search execution trace
   */
  solveDijkstra(nodes = [], edges = [], startNodeId, targetNodeId) {
    const adj = new Map();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      const weight = parseFloat(e.weight) || 1;
      adj.get(e.from)?.push({ to: e.to, weight });
      adj.get(e.to)?.push({ to: e.from, weight }); // Undirected
    });

    const distances = {};
    const previous = {};
    const visited = new Set();
    const steps = [];

    nodes.forEach((n) => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
    });
    distances[startNodeId] = 0;

    const unvisited = new Set(nodes.map((n) => n.id));

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current = null;
      let minDistance = Infinity;

      unvisited.forEach((id) => {
        if (distances[id] < minDistance) {
          minDistance = distances[id];
          current = id;
        }
      });

      if (!current || minDistance === Infinity) break;

      unvisited.delete(current);
      visited.add(current);

      steps.push({
        currentNode: current,
        visited: Array.from(visited),
        distances: { ...distances },
        description: `Visiting node ${current} with current minimum distance ${minDistance}`,
      });

      if (current === targetNodeId) break;

      const neighbors = adj.get(current) || [];
      neighbors.forEach(({ to, weight }) => {
        if (!visited.has(to)) {
          const newDist = distances[current] + weight;
          if (newDist < distances[to]) {
            distances[to] = newDist;
            previous[to] = current;
          }
        }
      });
    }

    // Reconstruct path
    const path = [];
    let curr = targetNodeId;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }

    return {
      shortestPath: path[0] === startNodeId ? path : [],
      totalDistance: distances[targetNodeId] === Infinity ? -1 : distances[targetNodeId],
      steps,
    };
  }

  /**
   * Computes Adjacency Matrix and Laplacian Matrix L = D - A
   */
  computeMatrices(nodes = [], edges = []) {
    const n = nodes.length;
    const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));

    const adjacencyMatrix = Array.from({ length: n }, () => Array(n).fill(0));
    const degreeMatrix = Array.from({ length: n }, () => Array(n).fill(0));

    edges.forEach((e) => {
      const u = nodeIndexMap.get(e.from);
      const v = nodeIndexMap.get(e.to);
      const w = parseFloat(e.weight) || 1;

      if (u !== undefined && v !== undefined) {
        adjacencyMatrix[u][v] = w;
        adjacencyMatrix[v][u] = w;
      }
    });

    for (let i = 0; i < n; i++) {
      let degree = 0;
      for (let j = 0; j < n; j++) {
        degree += adjacencyMatrix[i][j] > 0 ? 1 : 0;
      }
      degreeMatrix[i][i] = degree;
    }

    const laplacianMatrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => degreeMatrix[i][j] - adjacencyMatrix[i][j])
    );

    return {
      nodeLabels: nodes.map((node) => node.label || node.id),
      adjacencyMatrix,
      degreeMatrix,
      laplacianMatrix,
    };
  }
}

module.exports = new GraphEngineService();
