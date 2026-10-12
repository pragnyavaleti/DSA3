import express from 'express';
import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Sample templates pool for seeding realistic demonstration projects
const SAMPLE_TEMPLATES = [
  {
    name: 'Software Development Lifecycle (SDLC)',
    description: 'Academic demonstration project modeling standard software development phases with linear & dependent workflows.',
    tasks: [
      { name: 'Requirement Analysis', duration: 3, status: 'Completed', description: 'Gather user specifications, stakeholder interviews, and project scope document.' },
      { name: 'Design', duration: 4, status: 'In Progress', description: 'System architecture, database schema, UI wireframes, and API contracts.' },
      { name: 'Coding', duration: 6, status: 'Pending', description: 'Core backend algorithms, database integration, and responsive frontend views.' },
      { name: 'Testing', duration: 3, status: 'Pending', description: 'Unit testing, graph topological cycle checks, and integration testing.' },
      { name: 'Deployment', duration: 2, status: 'Pending', description: 'Production release, server configuration, and monitoring pipeline.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 1, toIndex: 2 },
      { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 }
    ]
  },
  {
    name: 'Mobile Banking App (iOS & Android)',
    description: 'FinTech mobile application with biometric login, transaction processing, and bank compliance.',
    tasks: [
      { name: 'Security & Compliance Audit', duration: 4, status: 'Completed', description: 'Review banking regulations, ISO 27001 standards, and tokenization.' },
      { name: 'UI/UX Design & Prototyping', duration: 3, status: 'In Progress', description: 'Figma interactive prototypes and user journey flows.' },
      { name: 'API & Microservices Architecture', duration: 6, status: 'Pending', description: 'OAuth2 auth service, payment ledger API, and push notifications.' },
      { name: 'Client App Development', duration: 7, status: 'Pending', description: 'React Native mobile views, biometric integration, and offline caching.' },
      { name: 'Penetration Testing & QA', duration: 4, status: 'Pending', description: 'Vulnerability assessment, stress tests, and automated UI checks.' },
      { name: 'App Store Deployment', duration: 2, status: 'Pending', description: 'App Store and Google Play compliance review and staged rollout.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
      { fromIndex: 1, toIndex: 3 },
      { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 },
      { fromIndex: 4, toIndex: 5 }
    ]
  },
  {
    name: 'E-Commerce Cloud Migration',
    description: 'Modernizing retail platform to cloud-native Kubernetes containers and serverless databases.',
    tasks: [
      { name: 'Cloud Architecture Spec', duration: 3, status: 'Completed', description: 'Terraform scripts, VPC network setup, and multi-region failover.' },
      { name: 'Database Schema & Sharding', duration: 5, status: 'In Progress', description: 'Data migration pipelines, replication rules, and indexing.' },
      { name: 'Microservices Containerization', duration: 6, status: 'Pending', description: 'Dockerizing product catalog, order engine, and inventory services.' },
      { name: 'Payment Gateway Integration', duration: 4, status: 'Pending', description: 'Stripe, PayPal, and credit card gateway webhook listeners.' },
      { name: 'Load & Benchmark Testing', duration: 3, status: 'Pending', description: 'Simulating 50k concurrent users and autoscaling validation.' },
      { name: 'Production DNS Cutover', duration: 2, status: 'Pending', description: 'Zero-downtime blue/green DNS traffic routing and telemetry monitoring.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
      { fromIndex: 1, toIndex: 3 },
      { fromIndex: 2, toIndex: 4 },
      { fromIndex: 3, toIndex: 4 },
      { fromIndex: 4, toIndex: 5 }
    ]
  },
  {
    name: 'Autonomous AI Vehicle Perception',
    description: 'Deep neural network training and computer vision pipeline for real-time obstacle avoidance.',
    tasks: [
      { name: 'LiDAR & Camera Calibration', duration: 3, status: 'Completed', description: 'Spatial alignment of stereo cameras and 3D point cloud sensors.' },
      { name: 'Dataset Annotation & Ingestion', duration: 4, status: 'In Progress', description: 'Bounding box labels and synthetic weather variations.' },
      { name: 'Model Training & GPU Tuning', duration: 8, status: 'Pending', description: 'PyTorch YOLO/Transformer obstacle detection model training.' },
      { name: 'Sensor Fusion & Edge Optimization', duration: 5, status: 'Pending', description: 'TensorRT compilation for on-board Nvidia Drive computers.' },
      { name: 'Hardware-in-the-Loop Simulation', duration: 4, status: 'Pending', description: 'Simulated collision avoidance and emergency braking test runs.' },
      { name: 'Track Field Test Validation', duration: 3, status: 'Pending', description: 'Closed track physical driving trials and safety verification.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 1, toIndex: 2 },
      { fromIndex: 2, toIndex: 3 },
      { fromIndex: 3, toIndex: 4 },
      { fromIndex: 4, toIndex: 5 }
    ]
  },
  {
    name: 'Smart Campus Student ERP Portal',
    description: 'Academic management platform connecting course enrollment, grading, timetable, and campus fee payments.',
    tasks: [
      { name: 'Requirements & Stakeholder Review', duration: 4, status: 'Completed', description: 'Interviews with deans, department heads, and student council.' },
      { name: 'Database Schema & Role Auth', duration: 5, status: 'In Progress', description: 'PostgreSQL relational schemas, RBAC access control, and SSO.' },
      { name: 'Course Registration Module', duration: 6, status: 'Pending', description: 'Real-time prerequisite checks, seat reservation, and waitlist queues.' },
      { name: 'Fee Payment & Accounting API', duration: 4, status: 'Pending', description: 'Challan generation, payment reconciliation, and receipts.' },
      { name: 'User Acceptance Testing (UAT)', duration: 4, status: 'Pending', description: 'Beta testing with 500 students and faculty staff.' },
      { name: 'Production Campus Rollout', duration: 2, status: 'Pending', description: 'Live deployment on college intranet and cloud CDN.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 1, toIndex: 2 },
      { fromIndex: 1, toIndex: 3 },
      { fromIndex: 2, toIndex: 4 },
      { fromIndex: 3, toIndex: 4 },
      { fromIndex: 4, toIndex: 5 }
    ]
  },
  {
    name: 'Smart IoT Home Automation Hub',
    description: 'Firmware and cloud coordinator for wireless sensor nodes, Zigbee/Matter devices, and energy monitoring.',
    tasks: [
      { name: 'Protocol & Mesh Architecture', duration: 3, status: 'Completed', description: 'Matter 1.2 protocol evaluation and encryption handshakes.' },
      { name: 'Embedded Controller Firmware', duration: 6, status: 'In Progress', description: 'C/C++ RTOS code for ESP32 and ARM Cortex microcontrollers.' },
      { name: 'Mobile Companion Application', duration: 5, status: 'Pending', description: 'Bluetooth BLE pairing and real-time device control dashboard.' },
      { name: 'Mesh Latency & Range Benchmark', duration: 3, status: 'Pending', description: 'Stress testing packet loss through concrete walls.' },
      { name: 'Cloud MQTT Telemetry Pipeline', duration: 4, status: 'Pending', description: 'Scalable broker for sensor data streams and anomaly detection.' },
      { name: 'Production Firmware Flash', duration: 2, status: 'Pending', description: 'OTA update server validation and factory flashing.' }
    ],
    dependencies: [
      { fromIndex: 0, toIndex: 1 },
      { fromIndex: 0, toIndex: 2 },
      { fromIndex: 1, toIndex: 3 },
      { fromIndex: 1, toIndex: 4 },
      { fromIndex: 2, toIndex: 4 },
      { fromIndex: 3, toIndex: 5 },
      { fromIndex: 4, toIndex: 5 }
    ]
  }
];

// Helper to format project row with camelCase for frontend compatibility
function formatProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description || '',
    startDate: row.start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Get all projects for logged-in user
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM projects
      WHERE owner_id = ?
      ORDER BY datetime(created_at) DESC
    `).all(req.user.id);

    return res.json(rows.map(formatProject));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/', (req, res) => {
  try {
    const { name, description, startDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const id = 'proj_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const date = startDate || now.split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO projects (id, owner_id, name, description, start_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, req.user.id, name.trim(), (description || '').trim(), date, now, now);

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return res.status(201).json(formatProject(created));
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND owner_id = ?
    `).get(req.params.id, req.user.id);

    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(formatProject(row));
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, startDate } = req.body;
    const now = new Date().toISOString();

    const current = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    const newName = name !== undefined ? name.trim() : current.name;
    const newDesc = description !== undefined ? description.trim() : current.description;
    const newDate = startDate !== undefined ? startDate : current.start_date;

    const stmt = db.prepare(`
      UPDATE projects
      SET name = ?, description = ?, start_date = ?, updated_at = ?
      WHERE id = ? AND owner_id = ?
    `);

    stmt.run(newName, newDesc, newDate, now, req.params.id, req.user.id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    return res.json(formatProject(updated));
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').run(req.params.id, req.user.id);
    return res.json({ message: 'Project deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Seed / Load Sample Project Template
router.post('/sample', (req, res) => {
  try {
    const existingProjects = db.prepare('SELECT name FROM projects WHERE owner_id = ?').all(req.user.id);
    const existingNames = new Set(existingProjects.map(p => p.name.trim().toLowerCase()));

    let chosenTemplate = null;
    let finalProjectName = '';

    for (let i = 0; i < SAMPLE_TEMPLATES.length; i++) {
      const cand = SAMPLE_TEMPLATES[i];
      if (!existingNames.has(cand.name.toLowerCase())) {
        chosenTemplate = cand;
        finalProjectName = cand.name;
        break;
      }
    }

    if (!chosenTemplate) {
      const idx = existingProjects.length % SAMPLE_TEMPLATES.length;
      chosenTemplate = SAMPLE_TEMPLATES[idx];
      const cycleCount = Math.floor(existingProjects.length / SAMPLE_TEMPLATES.length) + 1;
      finalProjectName = `${chosenTemplate.name} (Phase ${cycleCount})`;
    }

    const projectId = 'proj_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const startDate = now.split('T')[0];

    db.prepare(`
      INSERT INTO projects (id, owner_id, name, description, start_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, req.user.id, finalProjectName, chosenTemplate.description, startDate, now, now);

    // Create tasks
    const createdTasks = [];
    const taskStmt = db.prepare(`
      INSERT INTO tasks (id, project_id, name, description, duration, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of chosenTemplate.tasks) {
      const taskId = 'task_' + crypto.randomUUID().substring(0, 8);
      taskStmt.run(taskId, projectId, t.name, t.description || '', t.duration, t.status, now, now);
      createdTasks.push({ id: taskId, ...t });
    }

    // Create dependencies
    const depStmt = db.prepare(`
      INSERT INTO dependencies (id, project_id, predecessor_id, successor_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const dep of chosenTemplate.dependencies) {
      const pred = createdTasks[dep.fromIndex];
      const succ = createdTasks[dep.toIndex];
      if (pred && succ) {
        const depId = 'dep_' + crypto.randomUUID().substring(0, 8);
        depStmt.run(depId, projectId, pred.id, succ.id, now);
      }
    }

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    return res.status(201).json(formatProject(created));
  } catch (error) {
    console.error('Error generating sample project:', error);
    return res.status(500).json({ error: 'Failed to generate sample project' });
  }
});

export default router;
