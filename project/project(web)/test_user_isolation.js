// Automated User Data Isolation Verification Script
const API_URL = 'http://localhost:5005';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ ${message}`);
  }
}

async function run() {
  console.log('====================================================');
  console.log('STARTING USER DATA ISOLATION VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  const rand = Math.floor(Math.random() * 100000);
  const emailA = `user_a_${rand}@test.com`;
  const emailB = `user_b_${rand}@test.com`;
  const emailC = `user_c_${rand}@test.com`;
  const password = 'Password123!';

  // ----------------------------------------------------
  // TEST 1: Register Account A & Create Projects A1, A2
  // ----------------------------------------------------
  console.log('--- TEST 1: Register Account A ---');
  const regA = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User Alpha', email: emailA, password })
  });
  assert(regA.status === 201, `Account A created (${regA.status})`);
  const tokenA = regA.data.token;
  const userA = regA.data.user;

  // Verify newly created Account A has ZERO projects
  const initProjectsA = await request('/api/projects', { method: 'GET' }, tokenA);
  assert(initProjectsA.status === 200, 'Fetched Account A initial projects');
  assert(Array.isArray(initProjectsA.data) && initProjectsA.data.length === 0, 'New Account A starts with 0 projects');

  // Create Project A1
  const createA1 = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'Project A1', description: 'Desc A1' })
  }, tokenA);
  assert(createA1.status === 201, 'Project A1 created');
  assert(createA1.data.ownerId === userA.id, `Project A1 ownerId is User A (${userA.id})`);
  const projA1Id = createA1.data.id;

  // Create Project A2
  const createA2 = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'Project A2', description: 'Desc A2' })
  }, tokenA);
  assert(createA2.status === 201, 'Project A2 created');
  assert(createA2.data.ownerId === userA.id, `Project A2 ownerId is User A (${userA.id})`);
  const projA2Id = createA2.data.id;

  // Verify Account A sees A1 and A2
  const projectsA = await request('/api/projects', { method: 'GET' }, tokenA);
  assert(projectsA.data.length === 2, `Account A sees exactly 2 projects (saw: ${projectsA.data.length})`);
  const namesA = projectsA.data.map(p => p.name);
  assert(namesA.includes('Project A1') && namesA.includes('Project A2'), 'Account A sees both Project A1 and Project A2');

  // ----------------------------------------------------
  // TEST 2: Logout A, Register Account B -> Sees 0 projects
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Logout A, Register Account B ---');
  const regB = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User Beta', email: emailB, password })
  });
  assert(regB.status === 201, `Account B created (${regB.status})`);
  const tokenB = regB.data.token;
  const userB = regB.data.user;

  // Verify Account B sees ZERO projects (A1 and A2 must NOT appear)
  const projectsBInit = await request('/api/projects', { method: 'GET' }, tokenB);
  assert(projectsBInit.status === 200, 'Fetched Account B initial projects');
  assert(projectsBInit.data.length === 0, `Account B sees 0 projects (saw: ${projectsBInit.data.length})`);
  assert(!projectsBInit.data.some(p => p.name === 'Project A1' || p.name === 'Project A2'), 'Account B MUST NOT see Project A1 or Project A2');

  // ----------------------------------------------------
  // TEST 3: Create Project B1 for Account B
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Create Project B1 for Account B ---');
  const createB1 = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'Project B1', description: 'Desc B1' })
  }, tokenB);
  assert(createB1.status === 201, 'Project B1 created');
  assert(createB1.data.ownerId === userB.id, `Project B1 ownerId is User B (${userB.id})`);

  // Verify Account B sees ONLY B1
  const projectsBAfter = await request('/api/projects', { method: 'GET' }, tokenB);
  assert(projectsBAfter.data.length === 1, `Account B sees exactly 1 project (saw: ${projectsBAfter.data.length})`);
  assert(projectsBAfter.data[0].name === 'Project B1', 'Account B sees Project B1');
  assert(!projectsBAfter.data.some(p => p.name === 'Project A1' || p.name === 'Project A2'), 'Account B still cannot see Project A1 or A2');

  // ----------------------------------------------------
  // TEST 4: Logout B, Login A -> Sees A1, A2, and NOT B1
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Logout B, Login Account A ---');
  const loginA = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailA, password })
  });
  assert(loginA.status === 200, 'Account A logged back in');
  const tokenALoggedIn = loginA.data.token;

  const projectsARelogin = await request('/api/projects', { method: 'GET' }, tokenALoggedIn);
  assert(projectsARelogin.data.length === 2, `Account A sees 2 projects (saw: ${projectsARelogin.data.length})`);
  const namesARelogin = projectsARelogin.data.map(p => p.name);
  assert(namesARelogin.includes('Project A1') && namesARelogin.includes('Project A2'), 'Account A sees Project A1 and A2');
  assert(!namesARelogin.includes('Project B1'), 'Account A does NOT see Project B1');

  // ----------------------------------------------------
  // TEST 5: Login B -> Sees B1, and NOT A1, A2
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Login Account B ---');
  const loginB = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: emailB, password })
  });
  assert(loginB.status === 200, 'Account B logged back in');
  const tokenBLoggedIn = loginB.data.token;

  const projectsBRelogin = await request('/api/projects', { method: 'GET' }, tokenBLoggedIn);
  assert(projectsBRelogin.data.length === 1, `Account B sees 1 project (saw: ${projectsBRelogin.data.length})`);
  assert(projectsBRelogin.data[0].name === 'Project B1', 'Account B sees Project B1');
  assert(!projectsBRelogin.data.some(p => p.name === 'Project A1' || p.name === 'Project A2'), 'Account B does NOT see A1 or A2');

  // ----------------------------------------------------
  // TEST 6: Unauthorized Cross-Account Access Security
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Cross-Account Direct Access Security ---');
  const directGetA1ByB = await request(`/api/projects/${projA1Id}`, { method: 'GET' }, tokenBLoggedIn);
  assert(directGetA1ByB.status === 404, `User B denied direct GET of User A project (status: ${directGetA1ByB.status})`);

  const directTasksA1ByB = await request(`/api/tasks/project/${projA1Id}`, { method: 'GET' }, tokenBLoggedIn);
  assert(directTasksA1ByB.status === 404, `User B denied fetching tasks of User A project (status: ${directTasksA1ByB.status})`);

  const directDepsA1ByB = await request(`/api/dependencies/project/${projA1Id}`, { method: 'GET' }, tokenBLoggedIn);
  assert(directDepsA1ByB.status === 404, `User B denied fetching dependencies of User A project (status: ${directDepsA1ByB.status})`);

  const directDeleteA1ByB = await request(`/api/projects/${projA1Id}`, { method: 'DELETE' }, tokenBLoggedIn);
  assert(directDeleteA1ByB.status === 404, `User B denied deleting User A project (status: ${directDeleteA1ByB.status})`);

  // ----------------------------------------------------
  // TEST 7: Sample Project Isolation for Brand-New Account
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Sample Project Isolation ---');
  const regC = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'User Gamma', email: emailC, password })
  });
  const tokenC = regC.data.token;
  const userC = regC.data.user;

  // New account C starts with 0 projects
  const initC = await request('/api/projects', { method: 'GET' }, tokenC);
  assert(initC.data.length === 0, 'New Account C starts with 0 projects');

  // Load sample project for Account C
  const sampleC = await request('/api/projects/sample', { method: 'POST' }, tokenC);
  assert(sampleC.status === 201, 'Sample project created for Account C');
  assert(sampleC.data.ownerId === userC.id, `Sample project ownerId is User C (${userC.id})`);

  // Verify Account C sees sample project
  const projectsC = await request('/api/projects', { method: 'GET' }, tokenC);
  assert(projectsC.data.length === 1, 'Account C sees exactly 1 sample project');

  // Verify Account B STILL only sees Project B1 and NOT Account C's sample project
  const projectsBFinal = await request('/api/projects', { method: 'GET' }, tokenBLoggedIn);
  assert(projectsBFinal.data.length === 1 && projectsBFinal.data[0].name === 'Project B1', 'Account B does NOT see Account C sample project');

  console.log('\n====================================================');
  console.log('🎉 ALL DATA ISOLATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
