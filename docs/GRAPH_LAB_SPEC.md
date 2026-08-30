# OpenPrep AI Discrete Mathematics & Graph Theory Laboratory Specification

## Architecture

```
+-------------------------------------------------------------+
|              Interactive Graph Theory Canvas Editor         |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
| Graph Pathfinding Solvers   |              | Adjacency & Laplacian       |
| (Dijkstra, A*, BFS, DFS)    |              | Matrix Algebraic Calculator |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
+-------------------------------------------------------------+
| Frame-by-Frame Algorithm Playback & Priority Queue Inspector|
+-------------------------------------------------------------+
```

## Features
- **Graph Pathfinding Execution**: Full step playback with open/closed sets.
- **Algebraic Graph Theory**: Computes Adjacency Matrix $A$, Degree Matrix $D$, and Laplacian Matrix $L = D - A$.
