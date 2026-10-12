import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { DirectedGraph } from '../algorithms/graph.js';
import { detectCycle } from '../algorithms/cycleDetection.js';
import { topologicalSortKahn } from '../algorithms/topologicalSort.js';
import { calculateCriticalPath } from '../algorithms/criticalPath.js';
import { generateSchedule } from '../algorithms/scheduler.js';

const router = express.Router();

router.use(authenticateToken);

// Helper to fetch project and check ownership
function getProjectForUser(projectId, userId) {
  return db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, userId);
}

// 1. Full Project Schedule & CPM Calculation
router.get('/project/:projectId/schedule', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = getProjectForUser(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY datetime(created_at) ASC').all(projectId).map(t => ({
      id: t.id,
      name: t.name,
      duration: Number(t.duration),
      status: t.status,
      description: t.description
    }));

    const dependencies = db.prepare('SELECT * FROM dependencies WHERE project_id = ?').all(projectId).map(d => ({
      id: d.id,
      predecessorId: d.predecessor_id,
      successorId: d.successor_id
    }));

    const schedule = generateSchedule(tasks, dependencies, project.start_date);
    return res.json(schedule);
  } catch (error) {
    console.error('Error generating schedule:', error);
    return res.status(500).json({ error: 'Failed to compute project schedule: ' + error.message });
  }
});

// 2. Graph Adjacency List & Network Topology
router.get('/project/:projectId/graph', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = getProjectForUser(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);
    const dependencies = db.prepare('SELECT * FROM dependencies WHERE project_id = ?').all(projectId);

    const graph = new DirectedGraph();
    for (const t of tasks) {
      graph.addVertex(t.id, {
        id: t.id,
        name: t.name,
        duration: Number(t.duration),
        status: t.status
      });
    }

    for (const d of dependencies) {
      graph.addEdge(d.predecessor_id, d.successor_id);
    }

    // Prepare serializable graph details
    const vertices = [];
    const adjacencyList = {};

    for (const vertex of graph.getAllVertices()) {
      const id = vertex.id;
      vertices.push({
        id,
        data: vertex,
        inDegree: graph.getInDegree(id),
        outDegree: graph.getOutDegree(id),
        predecessors: graph.getPredecessors(id),
        successors: graph.getSuccessors(id)
      });

      adjacencyList[id] = graph.getSuccessors(id);
    }

    return res.json({
      vertexCount: graph.getVertexCount(),
      edgeCount: graph.getEdgeCount(),
      vertices,
      adjacencyList
    });
  } catch (error) {
    console.error('Error generating graph topology:', error);
    return res.status(500).json({ error: 'Failed to inspect graph network: ' + error.message });
  }
});

// 3. Cycle Detection Endpoint
router.get('/project/:projectId/cycle-check', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = getProjectForUser(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);
    const dependencies = db.prepare('SELECT * FROM dependencies WHERE project_id = ?').all(projectId);

    const graph = new DirectedGraph();
    for (const t of tasks) {
      graph.addVertex(t.id, { name: t.name, duration: Number(t.duration) });
    }
    for (const d of dependencies) {
      graph.addEdge(d.predecessor_id, d.successor_id);
    }

    const result = detectCycle(graph);
    return res.json(result);
  } catch (error) {
    console.error('Error checking cycles:', error);
    return res.status(500).json({ error: 'Cycle check failed: ' + error.message });
  }
});

// 4. Critical Path Method (CPM) calculation
router.get('/project/:projectId/critical-path', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = getProjectForUser(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);
    const dependencies = db.prepare('SELECT * FROM dependencies WHERE project_id = ?').all(projectId);

    const graph = new DirectedGraph();
    for (const t of tasks) {
      graph.addVertex(t.id, { name: t.name, duration: Number(t.duration) });
    }
    for (const d of dependencies) {
      graph.addEdge(d.predecessor_id, d.successor_id);
    }

    const cpmResult = calculateCriticalPath(graph);
    return res.json(cpmResult);
  } catch (error) {
    console.error('Error calculating critical path:', error);
    return res.status(500).json({ error: 'CPM calculation failed: ' + error.message });
  }
});

export default router;
