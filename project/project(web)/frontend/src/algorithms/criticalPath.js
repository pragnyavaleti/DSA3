/**
 * Critical Path Method (CPM) and Project Completion Time Calculation
 * Implements Forward Pass (ES, EF) and Backward Pass (LS, LF, Slack/Float)
 */

export function calculateCriticalPath(graph, topoOrder) {
  if (!topoOrder || topoOrder.length === 0) {
    return {
      projectDuration: 0,
      taskMetrics: {},
      criticalTasks: [],
      criticalPath: [],
      criticalEdges: []
    };
  }

  const ES = new Map(); // Earliest Start
  const EF = new Map(); // Earliest Finish
  const LS = new Map(); // Latest Start
  const LF = new Map(); // Latest Finish
  const slack = new Map(); // Total Float / Slack

  // 1. FORWARD PASS (in Topological Order)
  for (const taskId of topoOrder) {
    const task = graph.getVertex(taskId);
    const duration = Number(task?.duration) || 0;
    const predecessors = graph.getPredecessors(taskId);

    if (predecessors.length === 0) {
      ES.set(taskId, 0);
    } else {
      let maxPredEF = 0;
      for (const predId of predecessors) {
        const predEF = EF.get(predId) ?? 0;
        if (predEF > maxPredEF) {
          maxPredEF = predEF;
        }
      }
      ES.set(taskId, maxPredEF);
    }

    EF.set(taskId, ES.get(taskId) + duration);
  }

  // Minimum Project Completion Time = max(EF of all tasks)
  let projectDuration = 0;
  for (const taskId of topoOrder) {
    const taskEF = EF.get(taskId);
    if (taskEF > projectDuration) {
      projectDuration = taskEF;
    }
  }

  // 2. BACKWARD PASS (in Reverse Topological Order)
  const reverseTopo = [...topoOrder].reverse();

  for (const taskId of reverseTopo) {
    const task = graph.getVertex(taskId);
    const duration = Number(task?.duration) || 0;
    const successors = graph.getSuccessors(taskId);

    if (successors.length === 0) {
      LF.set(taskId, projectDuration);
    } else {
      let minSuccLS = Infinity;
      for (const succId of successors) {
        const succLS = LS.get(succId) ?? projectDuration;
        if (succLS < minSuccLS) {
          minSuccLS = succLS;
        }
      }
      LF.set(taskId, minSuccLS);
    }

    LS.set(taskId, LF.get(taskId) - duration);
    const taskSlack = LF.get(taskId) - EF.get(taskId);
    slack.set(taskId, Math.max(0, Math.round(taskSlack * 100) / 100));
  }

  // 3. IDENTIFY CRITICAL TASKS (Slack === 0)
  const criticalTaskIds = new Set();
  const taskMetrics = {};

  for (const taskId of topoOrder) {
    const task = graph.getVertex(taskId);
    const duration = Number(task?.duration) || 0;
    const s = slack.get(taskId) || 0;
    const isCritical = s === 0;

    if (isCritical) {
      criticalTaskIds.add(taskId);
    }

    taskMetrics[taskId] = {
      id: taskId,
      name: task?.name || taskId,
      description: task?.description || '',
      duration,
      status: task?.status || 'Pending',
      earliestStart: ES.get(taskId),
      earliestFinish: EF.get(taskId),
      latestStart: LS.get(taskId),
      latestFinish: LF.get(taskId),
      slack: s,
      isCritical
    };
  }

  // 4. RECONSTRUCT CRITICAL PATH (Directed path of critical tasks from start to end)
  // Find all critical starting nodes (ES == 0 and isCritical)
  const criticalStartNodes = topoOrder.filter(
    id => criticalTaskIds.has(id) && ES.get(id) === 0
  );

  let bestPath = [];
  let criticalEdges = [];

  function findLongestCriticalPath(currentId, currentPath) {
    const currentEF = EF.get(currentId);
    const successors = graph.getSuccessors(currentId);
    const criticalSuccessors = successors.filter(
      succId => criticalTaskIds.has(succId) && ES.get(succId) === currentEF
    );

    if (criticalSuccessors.length === 0) {
      if (currentPath.length > bestPath.length) {
        bestPath = [...currentPath];
      }
      return;
    }

    for (const nextId of criticalSuccessors) {
      findLongestCriticalPath(nextId, [...currentPath, nextId]);
    }
  }

  for (const startId of criticalStartNodes) {
    findLongestCriticalPath(startId, [startId]);
  }

  // Fallback: If bestPath is empty but critical tasks exist
  if (bestPath.length === 0 && criticalTaskIds.size > 0) {
    bestPath = topoOrder.filter(id => criticalTaskIds.has(id));
  }

  // Identify edges that lie on critical paths
  for (let i = 0; i < bestPath.length - 1; i++) {
    criticalEdges.push({ from: bestPath[i], to: bestPath[i + 1] });
  }

  const criticalTasks = Array.from(criticalTaskIds).map(id => taskMetrics[id]);
  const criticalPathObjects = bestPath.map(id => taskMetrics[id]);

  return {
    projectDuration,
    taskMetrics,
    criticalTaskIds: Array.from(criticalTaskIds),
    criticalTasks,
    criticalPath: criticalPathObjects,
    criticalEdges
  };
}
