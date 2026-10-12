import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './config.js';
import * as projectApi from '../api/projects.js';
import * as taskApi from '../api/tasks.js';
import * as depApi from '../api/dependencies.js';
import * as dsaApi from '../api/dsa.js';
import { generateSchedule } from '../algorithms/scheduler.js';
import { calculateCriticalPath } from '../algorithms/criticalPath.js';
import { detectCycle } from '../algorithms/cycleDetection.js';
import { DirectedGraph } from '../algorithms/graph.js';

// Re-export modular API functions for backwards compatibility
export { projectApi, taskApi, depApi, dsaApi };

// Sample project templates for explicitly requested "Load Sample Project"
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
  }
];

// Helper to retrieve current authenticated user UID safely
function getCurrentUserUid(explicitUserId) {
  if (typeof explicitUserId === 'string' && explicitUserId.trim()) {
    return explicitUserId.trim();
  }

  // 1. If backend JWT token is active, extract the authoritative user ID
  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const tokenUid = payload?.id || payload?.uid;
        if (tokenUid) return tokenUid;
      }
    } catch {}
  }

  // 2. Firebase Cloud Auth
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  // 3. Fallback to local session
  try {
    const raw = localStorage.getItem('dsa_planner_session');
    if (raw) {
      const s = JSON.parse(raw);
      const sessionUid = s?.id || s?.uid;
      if (sessionUid) return sessionUid;
    }
  } catch {}

  return null;
}

// User-scoped Local Storage helpers for fallback mode (ensures no global keys exist)
function getUserStorageKey(collectionName, uid) {
  return `dsa_${collectionName}_${uid}`;
}

function getUserScopedItems(collectionName, uid) {
  if (!uid) return [];
  try {
    const raw = localStorage.getItem(getUserStorageKey(collectionName, uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setUserScopedItems(collectionName, uid, items) {
  if (!uid) return;
  try {
    localStorage.setItem(getUserStorageKey(collectionName, uid), JSON.stringify(items));
  } catch (e) {
    console.error(`Failed to store user-scoped ${collectionName}`, e);
  }
}

// ----------------------------------------------------
// PROJECTS
// ----------------------------------------------------

/**
 * Fetch projects belonging ONLY to the currently authenticated user
 */
export async function getUserProjects(explicitUserId) {
  const uid = getCurrentUserUid(explicitUserId);
  if (!uid) {
    return [];
  }

  // 1. Firebase Cloud Firestore Mode
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('ownerId', '==', uid)
      );

      const snapshot = await getDocs(q);
      const userProjects = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            ownerId: data.ownerId || uid,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString())
          };
        })
        // CRITICAL DATA ISOLATION: Never expose ownerless projects or projects of other users
        .filter((p) => p.ownerId === uid);

      return userProjects;
    } catch (err) {
      console.warn('[Firestore] Error fetching user projects from Cloud:', err);
    }
  }

  // 2. Local Fallback / Backend API Mode
  // If backend API token is active, call backend projectApi, strictly verifying ownerId
  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const apiProjects = await projectApi.getProjects();
      if (Array.isArray(apiProjects)) {
        const filtered = apiProjects.filter(p => p.ownerId === uid);
        // Sync with user-scoped storage
        setUserScopedItems('projects', uid, filtered);
        return filtered;
      }
    } catch (apiErr) {
      // Backend unavailable or unauthorized, fallback to user-scoped storage
    }
  }

  const localProjects = getUserScopedItems('projects', uid);
  return localProjects.filter(p => p.ownerId === uid);
}

/**
 * Create a new project. Saves ownerId = auth.currentUser.uid
 */
export async function createProject(userIdOrData, optionalData) {
  let projectData = {};
  let requestedUserId = null;

  if (typeof userIdOrData === 'string') {
    requestedUserId = userIdOrData;
    projectData = optionalData || {};
  } else if (typeof userIdOrData === 'object' && userIdOrData !== null) {
    projectData = userIdOrData;
    requestedUserId = optionalData || null;
  }

  const uid = getCurrentUserUid(requestedUserId);
  if (!uid) {
    throw new Error('User must be authenticated to create a project.');
  }

  const name = (projectData.name || '').trim();
  if (!name) {
    throw new Error('Project name is required.');
  }

  const description = (projectData.description || '').trim();
  const startDate = projectData.startDate || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // 1. Firebase Cloud Firestore Mode
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name,
        description,
        startDate,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name,
        description,
        startDate,
        ownerId: uid,
        createdAt: now,
        updatedAt: now
      };
    } catch (err) {
      console.warn('[Firestore] Cloud addDoc error, falling back to local mode:', err);
    }
  }

  // 2. Local / Backend Fallback
  let created = null;
  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      created = await projectApi.createProject({
        name,
        description,
        startDate
      });
    } catch {}
  }

  const projectId = created?.id || ('proj_' + Math.random().toString(36).substring(2, 9));
  const newProject = {
    id: projectId,
    ownerId: created?.ownerId || uid,
    name,
    description,
    startDate,
    createdAt: created?.createdAt || now,
    updatedAt: created?.updatedAt || now
  };

  const existing = getUserScopedItems('projects', uid);
  const filteredExisting = existing.filter(p => p.id !== projectId);
  setUserScopedItems('projects', uid, [newProject, ...filteredExisting]);

  return newProject;
}

/**
 * Get single project by ID, verifying ownership
 */
export async function getProject(projectId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'projects', projectId));
      if (!docSnap.exists()) {
        throw new Error('Project not found');
      }
      const data = docSnap.data();
      if (uid && data.ownerId && data.ownerId !== uid) {
        throw new Error('Access denied: You do not have permission to view this project.');
      }
      return {
        id: docSnap.id,
        ...data,
        ownerId: data.ownerId || uid
      };
    } catch (err) {
      if (err.message.includes('Access denied')) throw err;
    }
  }

  // Fallback: check backend or user-scoped storage
  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const p = await projectApi.getProject(projectId);
      if (p && uid && p.ownerId && p.ownerId !== uid) {
        throw new Error('Access denied: You do not have permission to view this project.');
      }
      if (p) return p;
    } catch (err) {
      if (err.message.includes('Access denied')) throw err;
    }
  }

  if (uid) {
    const list = getUserScopedItems('projects', uid);
    const found = list.find(p => p.id === projectId && p.ownerId === uid);
    if (found) return found;
  }

  throw new Error('Project not found');
}

/**
 * Update project
 */
export async function updateProject(projectId, updateData) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const snap = await getDoc(projectRef);
      if (snap.exists() && uid && snap.data().ownerId && snap.data().ownerId !== uid) {
        throw new Error('Access denied: Cannot update project belonging to another user.');
      }
      await updateDoc(projectRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return {
        id: projectId,
        ...snap.data(),
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    } catch (err) {
      if (err.message.includes('Access denied')) throw err;
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const res = await projectApi.updateProject(projectId, updateData);
      if (uid) {
        const list = getUserScopedItems('projects', uid).map(p => p.id === projectId ? { ...p, ...updateData } : p);
        setUserScopedItems('projects', uid, list);
      }
      return res;
    } catch {}
  }

  if (uid) {
    const list = getUserScopedItems('projects', uid);
    const updated = list.map(p => (p.id === projectId && p.ownerId === uid) ? { ...p, ...updateData, updatedAt: new Date().toISOString() } : p);
    setUserScopedItems('projects', uid, updated);
    return updated.find(p => p.id === projectId);
  }
}

/**
 * Delete project and associated tasks/dependencies
 */
export async function deleteProject(projectId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const snap = await getDoc(projectRef);
      if (snap.exists() && uid && snap.data().ownerId && snap.data().ownerId !== uid) {
        throw new Error('Access denied: Cannot delete project belonging to another user.');
      }
      await deleteDoc(projectRef);

      // Clean up tasks
      const tasksQ = query(collection(db, 'tasks'), where('projectId', '==', projectId));
      const tasksSnap = await getDocs(tasksQ);
      for (const tDoc of tasksSnap.docs) {
        await deleteDoc(doc(db, 'tasks', tDoc.id));
      }

      // Clean up dependencies
      const depsQ = query(collection(db, 'dependencies'), where('projectId', '==', projectId));
      const depsSnap = await getDocs(depsQ);
      for (const dDoc of depsSnap.docs) {
        await deleteDoc(doc(db, 'dependencies', dDoc.id));
      }

      return true;
    } catch (err) {
      if (err.message.includes('Access denied')) throw err;
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      await projectApi.deleteProject(projectId);
    } catch {}
  }

  if (uid) {
    const projects = getUserScopedItems('projects', uid).filter(p => p.id !== projectId);
    setUserScopedItems('projects', uid, projects);
    const tasks = getUserScopedItems('tasks', uid).filter(t => t.projectId !== projectId);
    setUserScopedItems('tasks', uid, tasks);
    const deps = getUserScopedItems('dependencies', uid).filter(d => d.projectId !== projectId);
    setUserScopedItems('dependencies', uid, deps);
  }

  return true;
}

/**
 * Load Sample Project: ONLY creates sample project when explicitly invoked by current user.
 * Document strictly contains ownerId: auth.currentUser.uid
 */
export async function loadSampleProject(explicitUserId) {
  const uid = getCurrentUserUid(explicitUserId);
  if (!uid) {
    throw new Error('User must be authenticated to load a sample project.');
  }

  // Get current user projects to choose an unseeded template
  const currentProjects = await getUserProjects(uid);
  const existingNames = new Set(currentProjects.map(p => p.name.trim().toLowerCase()));

  let chosen = null;
  let finalName = '';

  for (let i = 0; i < SAMPLE_TEMPLATES.length; i++) {
    const cand = SAMPLE_TEMPLATES[i];
    if (!existingNames.has(cand.name.toLowerCase())) {
      chosen = cand;
      finalName = cand.name;
      break;
    }
  }

  if (!chosen) {
    const idx = currentProjects.length % SAMPLE_TEMPLATES.length;
    chosen = SAMPLE_TEMPLATES[idx];
    const cycle = Math.floor(currentProjects.length / SAMPLE_TEMPLATES.length) + 1;
    finalName = `${chosen.name} (Phase ${cycle})`;
  }

  // Create project strictly assigned to current user's UID
  const createdProject = await createProject(uid, {
    name: finalName,
    description: chosen.description,
    startDate: new Date().toISOString().split('T')[0]
  });

  // Create tasks belonging to this project and current user
  const createdTasks = [];
  for (const t of chosen.tasks) {
    const taskRecord = await createTask(createdProject.id, {
      name: t.name,
      description: t.description || '',
      duration: t.duration,
      status: t.status
    });
    createdTasks.push(taskRecord);
  }

  // Create dependencies belonging to this project and current user
  for (const dep of chosen.dependencies) {
    const pred = createdTasks[dep.fromIndex];
    const succ = createdTasks[dep.toIndex];
    if (pred && succ) {
      await createDependency(createdProject.id, pred.id, succ.id);
    }
  }

  return createdProject;
}

// ----------------------------------------------------
// TASKS
// ----------------------------------------------------

export async function getTasks(projectId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('projectId', '==', projectId)
      );
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => !t.ownerId || !uid || t.ownerId === uid);

      return tasks;
    } catch (err) {
      console.warn('[Firestore] Error fetching tasks:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const apiTasks = await taskApi.getTasks(projectId);
      if (Array.isArray(apiTasks)) return apiTasks;
    } catch {}
  }

  if (uid) {
    const localTasks = getUserScopedItems('tasks', uid);
    return localTasks.filter(t => t.projectId === projectId);
  }

  return [];
}

export async function createTask(projectId, taskData) {
  const uid = getCurrentUserUid();
  const name = (taskData.name || '').trim();
  if (!name) throw new Error('Task name is required.');

  const payload = {
    projectId,
    ownerId: uid || '',
    name,
    description: (taskData.description || '').trim(),
    duration: Math.max(1, parseInt(taskData.duration, 10) || 1),
    status: taskData.status || 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.warn('[Firestore] Cloud createTask error, fallback:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const created = await taskApi.createTask(projectId, taskData);
      if (created) return created;
    } catch {}
  }

  const taskId = 'task_' + Math.random().toString(36).substring(2, 9);
  const newTask = { id: taskId, ...payload };

  if (uid) {
    const tasks = getUserScopedItems('tasks', uid);
    setUserScopedItems('tasks', uid, [...tasks, newTask]);
  }

  return newTask;
}

export async function updateTask(taskId, updateData) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { id: taskId, ...updateData };
    } catch (err) {
      console.warn('[Firestore] UpdateTask error:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const updated = await taskApi.updateTask(taskId, updateData);
      if (updated) return updated;
    } catch {}
  }

  if (uid) {
    const tasks = getUserScopedItems('tasks', uid);
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...updateData, updatedAt: new Date().toISOString() } : t);
    setUserScopedItems('tasks', uid, updated);
    return updated.find(t => t.id === taskId);
  }
}

export async function deleteTask(taskId, projectId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      // Delete dependencies referencing this task
      const depQ1 = query(collection(db, 'dependencies'), where('predecessorId', '==', taskId));
      const snap1 = await getDocs(depQ1);
      for (const d of snap1.docs) await deleteDoc(doc(db, 'dependencies', d.id));

      const depQ2 = query(collection(db, 'dependencies'), where('successorId', '==', taskId));
      const snap2 = await getDocs(depQ2);
      for (const d of snap2.docs) await deleteDoc(doc(db, 'dependencies', d.id));

      return true;
    } catch (err) {
      console.warn('[Firestore] DeleteTask error:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      await taskApi.deleteTask(taskId);
    } catch {}
  }

  if (uid) {
    const tasks = getUserScopedItems('tasks', uid).filter(t => t.id !== taskId);
    setUserScopedItems('tasks', uid, tasks);
    const deps = getUserScopedItems('dependencies', uid).filter(d => d.predecessorId !== taskId && d.successorId !== taskId);
    setUserScopedItems('dependencies', uid, deps);
  }

  return true;
}

// ----------------------------------------------------
// DEPENDENCIES
// ----------------------------------------------------

export async function getDependencies(projectId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'dependencies'),
        where('projectId', '==', projectId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('[Firestore] Error fetching dependencies:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const apiDeps = await depApi.getDependencies(projectId);
      if (Array.isArray(apiDeps)) return apiDeps;
    } catch {}
  }

  if (uid) {
    const localDeps = getUserScopedItems('dependencies', uid);
    return localDeps.filter(d => d.projectId === projectId);
  }

  return [];
}

export async function createDependency(projectId, predecessorId, successorId) {
  const uid = getCurrentUserUid();

  if (predecessorId === successorId) {
    throw new Error('A task cannot depend on itself.');
  }

  // Validate cycle using client graph algorithm
  const currentTasks = await getTasks(projectId);
  const currentDeps = await getDependencies(projectId);

  const graph = new DirectedGraph();
  for (const t of currentTasks) {
    graph.addVertex(t.id);
  }
  for (const d of currentDeps) {
    graph.addEdge(d.predecessorId, d.successorId);
  }

  // Speculatively add proposed edge
  graph.addEdge(predecessorId, successorId);
  const cycleResult = detectCycle(graph);
  if (cycleResult.hasCycle) {
    const cycleNames = cycleResult.cyclePath.map(id => {
      const found = currentTasks.find(t => t.id === id);
      return found ? found.name : id;
    });
    throw new Error(`Circular dependency detected: ${cycleNames.join(' -> ')}. DAG cannot contain cycles.`);
  }

  const payload = {
    projectId,
    ownerId: uid || '',
    predecessorId,
    successorId,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'dependencies'), {
        ...payload,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.warn('[Firestore] Cloud createDependency error:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      const created = await depApi.createDependency(projectId, predecessorId, successorId);
      if (created) return created;
    } catch {}
  }

  const depId = 'dep_' + Math.random().toString(36).substring(2, 9);
  const newDep = { id: depId, ...payload };

  if (uid) {
    const deps = getUserScopedItems('dependencies', uid);
    setUserScopedItems('dependencies', uid, [...deps, newDep]);
  }

  return newDep;
}

export async function deleteDependency(dependencyId) {
  const uid = getCurrentUserUid();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'dependencies', dependencyId));
      return true;
    } catch (err) {
      console.warn('[Firestore] DeleteDependency error:', err);
    }
  }

  const token = localStorage.getItem('dsa_planner_token');
  if (token) {
    try {
      await depApi.deleteDependency(dependencyId);
    } catch {}
  }

  if (uid) {
    const deps = getUserScopedItems('dependencies', uid).filter(d => d.id !== dependencyId);
    setUserScopedItems('dependencies', uid, deps);
  }

  return true;
}

export async function deleteDependenciesForTask(taskId, projectId) {
  return await deleteTask(taskId, projectId);
}

// ----------------------------------------------------
// DSA OPERATIONS (DAG, Kahn's Topological Sort, CPM)
// ----------------------------------------------------

export async function fetchSchedule(projectId) {
  const project = await getProject(projectId);
  const tasks = await getTasks(projectId);
  const dependencies = await getDependencies(projectId);

  if (tasks.length === 0) {
    return {
      success: true,
      projectDuration: 0,
      criticalPath: [],
      criticalTasks: [],
      tasks: [],
      executionOrder: [],
      hasCycle: false
    };
  }

  return generateSchedule(tasks, dependencies, project.startDate);
}

export async function fetchGraphTopology(projectId) {
  const tasks = await getTasks(projectId);
  const dependencies = await getDependencies(projectId);

  const graph = new DirectedGraph();
  for (const t of tasks) graph.addVertex(t.id);
  for (const d of dependencies) graph.addEdge(d.predecessorId, d.successorId);

  const vertices = {};
  for (const [id, neighbors] of graph.adjacencyList.entries()) {
    vertices[id] = Array.from(neighbors);
  }

  return {
    vertexCount: graph.getVerticesCount(),
    edgeCount: graph.getEdgesCount(),
    vertices,
    tasks
  };
}

export async function fetchCycleCheck(projectId) {
  const tasks = await getTasks(projectId);
  const dependencies = await getDependencies(projectId);

  const graph = new DirectedGraph();
  for (const t of tasks) graph.addVertex(t.id);
  for (const d of dependencies) graph.addEdge(d.predecessorId, d.successorId);

  const cycle = detectCycle(graph);
  return {
    hasCycle: cycle.hasCycle,
    cyclePath: cycle.cyclePath,
    cycleTaskNames: cycle.cyclePath.map(id => {
      const found = tasks.find(t => t.id === id);
      return found ? found.name : id;
    })
  };
}

export async function fetchCriticalPath(projectId) {
  const sched = await fetchSchedule(projectId);
  return {
    criticalPath: sched.criticalPath || [],
    criticalTasks: sched.criticalTasks || [],
    projectDuration: sched.projectDuration || 0
  };
}
