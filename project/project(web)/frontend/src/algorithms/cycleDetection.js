/**
 * Circular Dependency (Cycle) Detection in Directed Graphs
 * Uses 3-color DFS to detect cycles and reconstruct the circular path.
 * 0: UNVISITED (White)
 * 1: VISITING (Gray) - on current recursion stack
 * 2: VISITED (Black) - fully processed
 */

export function detectCycle(graph) {
  const vertexIds = graph.getAllVertexIds();
  const color = new Map();
  const parent = new Map();

  for (const id of vertexIds) {
    color.set(id, 0); // UNVISITED
    parent.set(id, null);
  }

  let cycleFound = null;

  function dfs(u) {
    color.set(u, 1); // VISITING

    const successors = graph.getSuccessors(u);
    for (const v of successors) {
      if (color.get(v) === 1) {
        // Back edge found! u -> v forms a cycle
        // Reconstruct cycle path from u back to v, then v
        const cycle = [v];
        let curr = u;
        while (curr && curr !== v) {
          cycle.push(curr);
          curr = parent.get(curr);
        }
        cycle.push(v);
        cycle.reverse();
        cycleFound = cycle;
        return true;
      }

      if (color.get(v) === 0) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }

    color.set(u, 2); // VISITED
    return false;
  }

  for (const id of vertexIds) {
    if (color.get(id) === 0) {
      if (dfs(id)) {
        break;
      }
    }
  }

  if (cycleFound) {
    const cycleTaskNames = cycleFound.map(id => {
      const task = graph.getVertex(id);
      return task ? task.name : id;
    });

    return {
      hasCycle: true,
      cycleIds: cycleFound,
      cycleNames: cycleTaskNames,
      message: `Circular dependency detected: ${cycleTaskNames.join(' → ')}`
    };
  }

  return {
    hasCycle: false,
    cycleIds: [],
    cycleNames: [],
    message: 'No circular dependencies detected.'
  };
}
