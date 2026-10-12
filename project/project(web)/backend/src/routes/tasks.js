import express from 'express';
import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description || '',
    duration: Number(row.duration),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Get all tasks for a project
router.get('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user owns the project
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const rows = db.prepare(`
      SELECT * FROM tasks
      WHERE project_id = ?
      ORDER BY datetime(created_at) ASC
    `).all(projectId);

    return res.json(rows.map(formatTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', (req, res) => {
  try {
    const { projectId, name, description, duration, status } = req.body;

    if (!projectId || !name || !name.trim()) {
      return res.status(400).json({ error: 'Project ID and task name are required' });
    }

    // Verify user owns the project
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const id = 'task_' + crypto.randomUUID().substring(0, 8);
    const parsedDuration = Math.max(1, parseInt(duration, 10) || 1);
    const taskStatus = status || 'Pending';
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tasks (id, project_id, name, description, duration, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, projectId, name.trim(), (description || '').trim(), parsedDuration, taskStatus, now, now);

    // Update project updatedAt
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

    const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return res.status(201).json(formatTask(created));
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `).get(id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { name, description, duration, status } = req.body;
    const now = new Date().toISOString();

    const newName = name !== undefined ? name.trim() : task.name;
    const newDesc = description !== undefined ? description.trim() : task.description;
    const newDuration = duration !== undefined ? Math.max(1, parseInt(duration, 10) || 1) : task.duration;
    const newStatus = status !== undefined ? status : task.status;

    db.prepare(`
      UPDATE tasks
      SET name = ?, description = ?, duration = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newName, newDesc, newDuration, newStatus, now, id);

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, task.project_id);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return res.json(formatTask(updated));
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `).get(id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task (dependencies with foreign keys cascade)
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    const now = new Date().toISOString();
    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, task.project_id);

    return res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
