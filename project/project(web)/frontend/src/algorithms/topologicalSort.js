/**
 * Topological Sort using Kahn's Algorithm (BFS-based)
 * Returns the valid execution order and step-by-step traces for academic demonstration.
 */

export function topologicalSortKahn(graph) {
  const vertexIds = graph.getAllVertexIds();
  const totalVertices = vertexIds.length;

  if (totalVertices === 0) {
    return {
      success: true,
      order: [],
      steps: []
    };
  }

  // Copy in-degrees
  const inDegree = new Map();
  for (const id of vertexIds) {
    inDegree.set(id, graph.getInDegree(id));
  }

  // Queue of zero-indegree vertices
  const queue = [];
  const steps = [];

  for (const id of vertexIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id);
    }
  }

  const initialZeroTasks = queue.map(id => graph.getVertex(id)?.name || id);
  steps.push({
    stepNumber: 0,
    action: 'Initialize in-degrees and find starting tasks',
    description: `Found ${queue.length} task(s) with 0 incoming dependencies: [${initialZeroTasks.join(', ') || 'None'}]`,
    inDegreeState: Object.fromEntries(
      vertexIds.map(id => [graph.getVertex(id)?.name || id, inDegree.get(id)])
    ),
    queue: [...initialZeroTasks]
  });

  const topoOrder = [];
  let stepCount = 1;

  let queueHead = 0;
  while (queueHead < queue.length) {
    const currentId = queue[queueHead++];
    topoOrder.push(currentId);
    const currentTask = graph.getVertex(currentId);

    const releasedTasks = [];
    const successors = graph.getSuccessors(currentId);

    for (const succId of successors) {
      const currentInDegree = inDegree.get(succId) - 1;
      inDegree.set(succId, currentInDegree);
      if (currentInDegree === 0) {
        queue.push(succId);
        releasedTasks.push(graph.getVertex(succId)?.name || succId);
      }
    }

    steps.push({
      stepNumber: stepCount++,
      action: `Processed "${currentTask?.name || currentId}"`,
      description: releasedTasks.length > 0
        ? `Decremented dependent in-degrees. Unlocked ready task(s): [${releasedTasks.join(', ')}]`
        : `Decremented dependent in-degrees. No new tasks reached 0 in-degree.`,
      queue: queue.slice(queueHead).map(id => graph.getVertex(id)?.name || id),
      processedSoFar: topoOrder.map(id => graph.getVertex(id)?.name || id)
    });
  }

  // If processed task count !== total task count, a cycle exists
  if (topoOrder.length !== totalVertices) {
    const unprocessedIds = vertexIds.filter(id => !topoOrder.includes(id));
    const unprocessedNames = unprocessedIds.map(id => graph.getVertex(id)?.name || id);

    return {
      success: false,
      hasCycle: true,
      order: [],
      steps,
      error: `Circular dependency detected. ${unprocessedIds.length} task(s) could not be scheduled: [${unprocessedNames.join(', ')}]`,
      unprocessedIds
    };
  }

  return {
    success: true,
    hasCycle: false,
    order: topoOrder,
    steps
  };
}
