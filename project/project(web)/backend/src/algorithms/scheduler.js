import { DirectedGraph } from './graph.js';
import { detectCycle } from './cycleDetection.js';
import { topologicalSortKahn } from './topologicalSort.js';
import { calculateCriticalPath } from './criticalPath.js';

/**
 * Main Scheduling Engine
 * Orchestrates graph construction, cycle detection, topological sorting,
 * critical path analysis, and timeline coordinate mapping.
 *
 * @param {Array} tasks - Array of task objects: { id, name, duration, description, status }
 * @param {Array} dependencies - Array of dependency objects: { predecessorId, successorId }
 * @returns {Object} Complete analysis result or error object
 */
export function generateSchedule(tasks = [], dependencies = []) {
  if (!tasks || tasks.length === 0) {
    return {
      success: false,
      errorType: 'NO_TASKS',
      message: 'No tasks added yet. Add your first task to start scheduling.'
    };
  }

  // 1. BUILD DIRECTED GRAPH
  const graph = new DirectedGraph();

  // Add all tasks as vertices
  for (const task of tasks) {
    graph.addVertex(task.id, {
      ...task,
      duration: Math.max(0.1, Number(task.duration) || 1)
    });
  }

  // Add all dependencies as directed edges
  const invalidDeps = [];
  for (const dep of dependencies) {
    const { predecessorId, successorId } = dep;

    if (predecessorId === successorId) {
      invalidDeps.push(`Self-dependency on task ${predecessorId}`);
      continue;
    }

    if (graph.hasVertex(predecessorId) && graph.hasVertex(successorId)) {
      graph.addEdge(predecessorId, successorId);
    }
  }

  // 2. CYCLE DETECTION
  const cycleResult = detectCycle(graph);
  if (cycleResult.hasCycle) {
    return {
      success: false,
      errorType: 'CIRCULAR_DEPENDENCY',
      message: 'Scheduling cannot be generated because a circular dependency exists.',
      details: cycleResult.message,
      cycleNames: cycleResult.cycleNames,
      cycleIds: cycleResult.cycleIds,
      graph
    };
  }

  // 3. TOPOLOGICAL SORT (KAHN'S ALGORITHM)
  const topoResult = topologicalSortKahn(graph);
  if (!topoResult.success || topoResult.hasCycle) {
    return {
      success: false,
      errorType: 'CIRCULAR_DEPENDENCY',
      message: 'Scheduling cannot be generated because a circular dependency exists.',
      details: topoResult.error,
      graph
    };
  }

  const topoOrder = topoResult.order;
  const executionOrderTasks = topoOrder.map(id => graph.getVertex(id));

  // 4. CRITICAL PATH ANALYSIS (CPM)
  const cpmResult = calculateCriticalPath(graph, topoOrder);

  // 5. PARALLEL TRACK ALLOCATION (For Gantt timeline layout)
  // Determine which tasks can execute concurrently
  const timelineTracks = assignTimelineTracks(executionOrderTasks, cpmResult.taskMetrics);

  // 6. BUILD GRAPH REPRESENTATION FOR VISUALIZATION
  const graphNodes = tasks.map(task => {
    const metrics = cpmResult.taskMetrics[task.id] || {};
    return {
      id: task.id,
      name: task.name,
      duration: task.duration,
      status: task.status,
      isCritical: metrics.isCritical || false,
      earliestStart: metrics.earliestStart || 0,
      earliestFinish: metrics.earliestFinish || 0,
      slack: metrics.slack || 0
    };
  });

  const graphEdges = [];
  const criticalEdgeSet = new Set(
    cpmResult.criticalEdges.map(e => `${e.from}->${e.to}`)
  );

  for (const dep of dependencies) {
    if (graph.hasVertex(dep.predecessorId) && graph.hasVertex(dep.successorId)) {
      const isCritical = criticalEdgeSet.has(`${dep.predecessorId}->${dep.successorId}`);
      graphEdges.push({
        id: dep.id || `${dep.predecessorId}-${dep.successorId}`,
        from: dep.predecessorId,
        to: dep.successorId,
        fromName: graph.getVertex(dep.predecessorId)?.name || dep.predecessorId,
        toName: graph.getVertex(dep.successorId)?.name || dep.successorId,
        isCritical
      });
    }
  }

  return {
    success: true,
    errorType: null,
    message: 'Schedule generated successfully.',
    projectDuration: cpmResult.projectDuration,
    executionOrder: executionOrderTasks,
    topoOrder,
    taskMetrics: cpmResult.taskMetrics,
    criticalTasks: cpmResult.criticalTasks,
    criticalTaskIds: cpmResult.criticalTaskIds,
    criticalPath: cpmResult.criticalPath,
    criticalEdges: cpmResult.criticalEdges,
    graphNodes,
    graphEdges,
    timelineTracks,
    dsaSteps: topoResult.steps,
    adjacencyList: graph.toAdjacencyListObject(),
    totalTasks: tasks.length,
    totalDependencies: graphEdges.length
  };
}

/**
 * Assigns non-overlapping display tracks for Gantt timeline
 */
function assignTimelineTracks(tasks, taskMetrics) {
  // Sort tasks by earliestStart, then by duration desc
  const sorted = [...tasks].sort((a, b) => {
    const aES = taskMetrics[a.id]?.earliestStart ?? 0;
    const bES = taskMetrics[b.id]?.earliestStart ?? 0;
    if (aES !== bES) return aES - bES;
    return (b.duration || 0) - (a.duration || 0);
  });

  const tracks = []; // Array of end times for each track

  return sorted.map(task => {
    const metrics = taskMetrics[task.id] || { earliestStart: 0, earliestFinish: 1 };
    const start = metrics.earliestStart;
    const finish = metrics.earliestFinish;

    // Find the first track where trackEnd <= start
    let assignedTrack = -1;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i] <= start) {
        assignedTrack = i;
        tracks[i] = finish;
        break;
      }
    }

    if (assignedTrack === -1) {
      assignedTrack = tracks.length;
      tracks.push(finish);
    }

    return {
      ...task,
      metrics,
      trackIndex: assignedTrack
    };
  });
}
