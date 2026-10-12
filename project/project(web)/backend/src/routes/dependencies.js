import express from 'express';
import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { DirectedGraph } from '../algorithms/graph.js';
import { detectCycle } from '../algorithms/cycleDetection.js';

const router = express.Router();

router.use(authenticateToken);

function formatDependency(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    createdAt: row.created_at
  };
}

// Get all dependencies for a project
router.get('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user owns the project
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const rows = db.prepare(`
      SELECT * FROM dependencies
      WHERE project_id = ?
      ORDER BY datetime(created_at) ASC
    `).all(projectId);

    return res.json(rows.map(formatDependency));
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Create dependency with Graph Cycle Detection Check
router.post('/', (req, res) => {
  try {
    const { projectId, predecessorId, successorId } = req.body;

    if (!projectId || !predecessorId || !successorId) {
      return res.status(400).json({ error: 'Project ID, predecessor, and successor are required' });
    }

    if (predecessorId === successorId) {
      return res.status(400).json({ error: 'A task cannot depend on itself.' });
    }

    // Verify user owns the project
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify both tasks exist in the project
    const predTask = db.prepare('SELECT id, name FROM tasks WHERE id = ? AND project_id = ?').get(predecessorId, projectId);
    const succTask = db.prepare('SELECT id, name FROM tasks WHERE id = ? AND project_id = ?').get(successorId, projectId);

    if (!predTask || !succTask) {
      return res.status(404).json({ error: 'One or both specified tasks were not found in this project' });
    }

    // Check duplicate
    const existing = db.prepare(`
      SELECT id FROM dependencies
      WHERE project_id = ? AND predecessor_id = ? AND successor_id = ?
    `).get(projectId, predecessorId, successorId);

    if (existing) {
      return res.status(400).json({ error: 'This dependency already exists.' });
    }

    // --- DSA CYCLE CHECK PRE-VALIDATION ---
    // Fetch all current tasks and dependencies to test if adding this edge causes a cycle
    const currentTasks = db.prepare('SELECT id, name, duration FROM tasks WHERE project_id = ?').all(projectId);
    const currentDeps = db.prepare('SELECT predecessor_id, successor_id FROM dependencies WHERE project_id = ?').all(projectId);

    const testGraph = new DirectedGraph();
    for (const t of currentTasks) {
      testGraph.addVertex(t.id, { name: t.name, duration: t.duration });
    }
    for (const d of currentDeps) {
      testGraph.addEdge(d.predecessor_id, d.successor_id);
    }
    // Propose adding new edge
    testGraph.addEdge(predecessorId, successorId);

    const cycleResult = detectCycle(testGraph);
    if (cycleResult.hasCycle) {
      const cycleMsg = cycleResult.cycleNames?.length > 0
        ? `Circular dependency detected: ${cycleResult.cycleNames.join(' -> ')}`
        : 'Adding this dependency would create a circular dependency loop.';
      return res.status(400).json({
        error: cycleMsg,
        cycle: cycleResult.cycle,
        cycleNames: cycleResult.cycleNames
      });
    }

    const id = 'dep_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO dependencies (id, project_id, predecessor_id, successor_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, projectId, predecessorId, successorId, now);

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    const created = db.prepare('SELECT * FROM dependencies WHERE id = ?').get(id);
    return res.status(201).json(formatDependency(created));
  } catch (error) {
    console.error('Error creating dependency:', error);
    return res.status(500).json({ error: 'Failed to create dependency' });
  }
});

// Delete dependency
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dep = db.prepare(`
      SELECT d.* FROM dependencies d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = ? AND p.owner_id = ?
    `).get(id, req.user.id);

    if (!dep) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    db.prepare('DELETE FROM dependencies WHERE id = ?').run(id);

    const now = new Date().toISOString();
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, dep.project_id);

    return res.json({ message: 'Dependency deleted successfully', id });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    return res.status(500).json({ error: 'Failed to delete dependency' });
  }
});

export default router;
