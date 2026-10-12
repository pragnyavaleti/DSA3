/**
 * AutoScheduleDSA - Comprehensive Feature QA Test Suite
 * Validates: Auth, Project CRUD, Task Management, Dependencies,
 * Graph DSA, Cycle Detection, CPM Critical Path, Scheduling,
 * Sample Project, Cascading Deletion, and Multi-User Isolation.
 */

const BASE_URL = 'http://localhost:5005/api';

async function req(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runAllFeatureTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE FEATURE TEST SUITE');
  console.log('====================================================\n');

  const rand = Math.floor(Math.random() * 100000);
  const emailA = `qa_user_a_${rand}@test.com`;
  const emailB = `qa_user_b_${rand}@test.com`;
  const password = 'Password123!';

  // ==========================================
  // SUITE 1: AUTHENTICATION
  // ==========================================
  console.log('--- 1. AUTHENTICATION TESTS ---');
  
  // 1.1 Short password rejection
  const shortPassRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Short', email: emailA, password: '123' })
  });
  assert(shortPassRes.status === 400, 'Rejects password shorter than 6 characters');

  // 1.2 Valid registration
  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User QA Alpha', email: emailA, password })
  });
  assert(regRes.status === 201 && regRes.data.token, 'Registers new user and returns JWT token');
  const tokenA = regRes.data.token;
  const userA = regRes.data.user;

  // 1.3 Duplicate email rejection
  const dupRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User QA Alpha Dup', email: emailA, password })
  });
  assert(dupRes.status === 409, 'Rejects duplicate email registration (409 Conflict)');

  // 1.4 Invalid login credentials
  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password: 'WrongPassword!' })
  });
  assert(badLogin.status === 401, 'Rejects invalid login credentials (401 Unauthorized)');

  // 1.5 Valid login
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password })
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Logs in successfully with valid credentials');

  // 1.6 Profile endpoint
  const meRes = await req('/auth/me', {}, tokenA);
  assert(meRes.status === 200 && meRes.data.user.email === emailA, 'Fetches authenticated user profile');


  // ==========================================
  // SUITE 2: PROJECT MANAGEMENT
  // ==========================================
  console.log('\n--- 2. PROJECT CRUD TESTS ---');

  // 2.1 Reject project without name
  const emptyProj = await req('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: '', description: 'No name' })
  }, tokenA);
  assert(emptyProj.status === 400, 'Rejects project creation with empty name');

  // 2.2 Create valid project
  const createProjRes = await req('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Autonomous Delivery Drone',
      description: 'Firmware & pathfinding navigation project',
      startDate: '2026-10-01'
    })
  }, tokenA);
  assert(createProjRes.status === 201 && createProjRes.data.id, 'Creates project successfully');
  const projId = createProjRes.data.id;
  assert(createProjRes.data.ownerId === userA.id, 'Project ownerId matches User A ID');

  // 2.3 Fetch user projects
  const listRes = await req('/projects', {}, tokenA);
  assert(listRes.status === 200 && listRes.data.some(p => p.id === projId), 'Lists project in user project list');

  // 2.4 Fetch single project
  const singleProj = await req(`/projects/${projId}`, {}, tokenA);
  assert(singleProj.status === 200 && singleProj.data.name === 'Autonomous Delivery Drone', 'Fetches single project by ID');

  // 2.5 Update project
  const updateProj = await req(`/projects/${projId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Autonomous Delivery Drone V2',
      description: 'Upgraded sensor fusion & navigation'
    })
  }, tokenA);
  assert(updateProj.status === 200 && updateProj.data.name === 'Autonomous Delivery Drone V2', 'Updates project name & description');


  // ==========================================
  // SUITE 3: TASK MANAGEMENT
  // ==========================================
  console.log('\n--- 3. TASK MANAGEMENT TESTS ---');

  // 3.1 Reject task with missing name
  const badTask = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: '', duration: 3 })
  }, tokenA);
  assert(badTask.status === 400, 'Rejects task creation with missing name');

  // 3.2 Create linear chain tasks: T1 -> T2 -> T3 -> T4
  const t1Res = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: 'Spec & Requirements', duration: 3, status: 'Pending' })
  }, tokenA);
  assert(t1Res.status === 201, 'Creates Task 1 (Spec & Requirements, 3 days)');
  const t1 = t1Res.data;

  const t2Res = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: 'Hardware Assembly', duration: 5, status: 'Pending' })
  }, tokenA);
  assert(t2Res.status === 201, 'Creates Task 2 (Hardware Assembly, 5 days)');
  const t2 = t2Res.data;

  const t3Res = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: 'Firmware & PID Controller', duration: 6, status: 'Pending' })
  }, tokenA);
  assert(t3Res.status === 201, 'Creates Task 3 (Firmware & PID Controller, 6 days)');
  const t3 = t3Res.data;

  const t4Res = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: 'Flight Testing & Tuning', duration: 4, status: 'Pending' })
  }, tokenA);
  assert(t4Res.status === 201, 'Creates Task 4 (Flight Testing & Tuning, 4 days)');
  const t4 = t4Res.data;

  // 3.3 Update task status: Pending -> In Progress -> Completed
  const inProgRes = await req(`/tasks/${t1.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'In Progress' })
  }, tokenA);
  assert(inProgRes.status === 200 && inProgRes.data.status === 'In Progress', 'Transitions task status to In Progress');

  const compRes = await req(`/tasks/${t1.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Completed' })
  }, tokenA);
  assert(compRes.status === 200 && compRes.data.status === 'Completed', 'Transitions task status to Completed');

  // 3.4 Fetch all tasks
  const tasksList = await req(`/tasks/project/${projId}`, {}, tokenA);
  assert(tasksList.status === 200 && tasksList.data.length === 4, 'Fetches all 4 tasks for the project');


  // ==========================================
  // SUITE 4: DEPENDENCIES & CYCLE DETECTION
  // ==========================================
  console.log('\n--- 4. DEPENDENCY & GRAPH CYCLE TESTS ---');

  // 4.1 Reject self-dependency
  const selfDep = await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t1.id, successorId: t1.id })
  }, tokenA);
  assert(selfDep.status === 400, 'Rejects self-dependency (task depending on itself)');

  // 4.2 Create valid dependency chain: T1 -> T2 -> T3 -> T4
  const d1Res = await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t1.id, successorId: t2.id })
  }, tokenA);
  assert(d1Res.status === 201, 'Creates dependency T1 -> T2');

  const d2Res = await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t2.id, successorId: t3.id })
  }, tokenA);
  assert(d2Res.status === 201, 'Creates dependency T2 -> T3');

  const d3Res = await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t3.id, successorId: t4.id })
  }, tokenA);
  assert(d3Res.status === 201, 'Creates dependency T3 -> T4');

  // 4.3 Attempt cycle creation: T4 -> T1 (creates loop T1 -> T2 -> T3 -> T4 -> T1)
  const cycleAttempt = await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t4.id, successorId: t1.id })
  }, tokenA);
  assert(cycleAttempt.status === 400 && cycleAttempt.data?.error?.toLowerCase().includes('circular'),
    'Detects and blocks circular dependency (T4 -> T1)');

  // 4.4 Graph topology endpoint
  const graphRes = await req(`/dsa/project/${projId}/graph`, {}, tokenA);
  assert(graphRes.status === 200 && graphRes.data?.vertexCount === 4 && graphRes.data?.edgeCount === 3,
    'Graph topology correctly reports 4 vertices and 3 edges');

  // 4.5 Cycle check endpoint
  const cycleCheckRes = await req(`/dsa/project/${projId}/cycle-check`, {}, tokenA);
  assert(cycleCheckRes.status === 200 && cycleCheckRes.data.hasCycle === false,
    'Cycle-check endpoint confirms graph is an acyclic DAG (hasCycle: false)');


  // ==========================================
  // SUITE 5: CPM CRITICAL PATH & SCHEDULING
  // ==========================================
  console.log('\n--- 5. CPM & SCHEDULING TESTS ---');

  // Total linear path duration = 3 + 5 + 6 + 4 = 18 days
  const schedRes = await req(`/dsa/project/${projId}/schedule`, {}, tokenA);
  assert(schedRes.status === 200 && schedRes.data.totalDuration === 18,
    'Calculates minimum project completion time: 18 days (3 + 5 + 6 + 4)');

  const cpmRes = await req(`/dsa/project/${projId}/critical-path`, {}, tokenA);
  assert(cpmRes.status === 200 && cpmRes.data.criticalTasks.length === 4,
    'All 4 sequential tasks correctly identified as Critical Tasks (Slack = 0)');

  // Test parallel non-critical branch: Add Task T2B (duration 2) dependent on T1, leading into T4
  const t2bRes = await req('/tasks', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, name: 'Sponsorship Pitch Deck', duration: 2, status: 'Pending' })
  }, tokenA);
  const t2b = t2bRes.data;

  await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t1.id, successorId: t2b.id })
  }, tokenA);

  await req('/dependencies', {
    method: 'POST',
    body: JSON.stringify({ projectId: projId, predecessorId: t2b.id, successorId: t4.id })
  }, tokenA);

  const schedParallel = await req(`/dsa/project/${projId}/schedule`, {}, tokenA);
  const t2bScheduled = schedParallel.data.tasks.find(t => t.id === t2b.id);
  assert(t2bScheduled && t2bScheduled.slack > 0 && !t2bScheduled.isCritical,
    `Parallel branch Task 2B has Slack = ${t2bScheduled.slack} days and is NOT critical`);


  // ==========================================
  // SUITE 6: SAMPLE PROJECT GENERATION
  // ==========================================
  console.log('\n--- 6. SAMPLE PROJECT TESTS ---');

  const sampleRes = await req('/projects/sample', { method: 'POST' }, tokenA);
  assert(sampleRes.status === 201 && sampleRes.data.id, 'Loads sample project for User A');
  assert(sampleRes.data.ownerId === userA.id, 'Sample project ownerId belongs strictly to User A');

  const sampleTasks = await req(`/tasks/project/${sampleRes.data.id}`, {}, tokenA);
  assert(sampleTasks.status === 200 && sampleTasks.data.length >= 5,
    `Sample project automatically generated ${sampleTasks.data.length} tasks`);


  // ==========================================
  // SUITE 7: CASCADING DELETION
  // ==========================================
  console.log('\n--- 7. CASCADING DELETION TESTS ---');

  const delRes = await req(`/projects/${sampleRes.data.id}`, { method: 'DELETE' }, tokenA);
  assert(delRes.status === 200, 'Deletes project successfully');

  const checkSampleProj = await req(`/projects/${sampleRes.data.id}`, {}, tokenA);
  assert(checkSampleProj.status === 404, 'Deleted project no longer accessible (404)');

  const checkSampleTasks = await req(`/tasks/project/${sampleRes.data.id}`, {}, tokenA);
  assert(checkSampleTasks.status === 404, 'Associated tasks cascade deleted (no orphaned data)');


  // ==========================================
  // SUITE 8: USER DATA ISOLATION
  // ==========================================
  console.log('\n--- 8. MULTI-USER ISOLATION TESTS ---');

  // Register User B
  const regB = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User QA Beta', email: emailB, password })
  });
  const tokenB = regB.data.token;
  const userB = regB.data.user;

  // User B lists projects - must NOT see User A's project
  const bProjects = await req('/projects', {}, tokenB);
  assert(bProjects.status === 200 && bProjects.data.length === 0, 'New User B starts with 0 projects');
  assert(!bProjects.data.some(p => p.id === projId), 'User B CANNOT see User A project');

  // User B attempts direct access to User A's project
  const directGet = await req(`/projects/${projId}`, {}, tokenB);
  assert(directGet.status === 404, 'User B denied direct GET of User A project (404 Not Found)');

  // User B attempts direct access to User A's tasks
  const directTasks = await req(`/tasks/project/${projId}`, {}, tokenB);
  assert(directTasks.status === 404, 'User B denied fetching tasks of User A project (404)');

  // User B attempts deleting User A's project
  const directDel = await req(`/projects/${projId}`, { method: 'DELETE' }, tokenB);
  assert(directDel.status === 404, 'User B denied deleting User A project (404)');

  // User B creates Project B
  const bProjRes = await req('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'User B Secret Project', description: 'Classified' })
  }, tokenB);
  const projBId = bProjRes.data.id;
  assert(bProjRes.status === 201, 'User B created Project B');

  // User A lists projects - must NOT see User B's project
  const aProjects = await req('/projects', {}, tokenA);
  assert(aProjects.data.some(p => p.id === projId), 'User A still sees Project A');
  assert(!aProjects.data.some(p => p.id === projBId), 'User A CANNOT see Project B');

  console.log('\n====================================================');
  console.log('🎉 ALL FEATURE TESTS PASSED 100% SUCCESSFULLY!');
  console.log('====================================================\n');
}

runAllFeatureTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
