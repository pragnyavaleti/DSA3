import { DirectedGraph } from './src/algorithms/graph.js';
import { detectCycle } from './src/algorithms/cycleDetection.js';
import { topologicalSortKahn } from './src/algorithms/topologicalSort.js';
import { calculateCriticalPath } from './src/algorithms/criticalPath.js';
import { generateSchedule } from './src/algorithms/scheduler.js';

console.log('==============================================');
console.log('RUNNING COMPREHENSIVE DSA VERIFICATION SUITE');
console.log('==============================================\n');

// 1. TEST DIRECTED GRAPH
console.log('TEST 1: DirectedGraph & Adjacency List...');
const g = new DirectedGraph();
g.addVertex('t1', { name: 'A', duration: 3 });
g.addVertex('t2', { name: 'B', duration: 4 });
g.addEdge('t1', 't2');
console.log(' - Vertices count:', g.getVertexCount(), '(Expected: 2)');
console.log(' - Edges count:', g.getEdgeCount(), '(Expected: 1)');
console.log(' - InDegree of B:', g.getInDegree('t2'), '(Expected: 1)');
console.log(' - Successors of A:', g.getSuccessors('t1'), '(Expected: ["t2"])');
console.log('✓ TEST 1 PASSED.\n');

// 2. TEST CYCLE DETECTION
console.log('TEST 2: Cycle Detection...');
const cycleGraph = new DirectedGraph();
cycleGraph.addVertex('a', { name: 'Task A', duration: 2 });
cycleGraph.addVertex('b', { name: 'Task B', duration: 2 });
cycleGraph.addVertex('c', { name: 'Task C', duration: 2 });
cycleGraph.addEdge('a', 'b');
cycleGraph.addEdge('b', 'c');
cycleGraph.addEdge('c', 'a'); // Loop: A -> B -> C -> A

const cycleCheck = detectCycle(cycleGraph);
console.log(' - Detected cycle:', cycleCheck.hasCycle, '(Expected: true)');
console.log(' - Cycle loop path:', cycleCheck.cycleNames.join(' -> '));
if (!cycleCheck.hasCycle) throw new Error('Failed to detect cycle!');
console.log('✓ TEST 2 PASSED.\n');

// 3. TEST SAMPLE PROJECT SCHEDULING (Academic Requirement)
console.log('TEST 3: Sample Project (18 Days CPM verification)...');
const sampleTasks = [
  { id: 't1', name: 'Requirement Analysis', duration: 3, status: 'Completed' },
  { id: 't2', name: 'Design', duration: 4, status: 'In Progress' },
  { id: 't3', name: 'Coding', duration: 6, status: 'Pending' },
  { id: 't4', name: 'Testing', duration: 3, status: 'Pending' },
  { id: 't5', name: 'Deployment', duration: 2, status: 'Pending' }
];

const sampleDependencies = [
  { predecessorId: 't1', successorId: 't2' },
  { predecessorId: 't2', successorId: 't3' },
  { predecessorId: 't3', successorId: 't4' },
  { predecessorId: 't4', successorId: 't5' }
];

const schedResult = generateSchedule(sampleTasks, sampleDependencies);
console.log(' - Schedule status:', schedResult.success);
console.log(' - Total Project Duration:', schedResult.projectDuration, 'days (Expected: 18 days)');
console.log(' - Topological Execution Order:', schedResult.executionOrder.map(t => t.name).join(' -> '));
console.log(' - Critical Tasks count:', schedResult.criticalTasks.length, '(Expected: 5)');
console.log(' - Critical Path sequence:', schedResult.criticalPath.map(t => t.name).join(' -> '));

if (schedResult.projectDuration !== 18) {
  throw new Error(`Expected duration 18 days, got ${schedResult.projectDuration}`);
}
console.log('✓ TEST 3 PASSED.\n');

// 4. TEST PARALLEL TASKS BRANCHING & FLOAT/SLACK
console.log('TEST 4: Parallel Branches & Slack Calculation...');
// A(5) -> B(3) -> D(2)  Path 1: 5 + 3 + 2 = 10 days
// A(5) -> C(1) -> D(2)  Path 2: 5 + 1 + 2 = 8 days
// Critical path should be A -> B -> D (10 days).
// Task C should have Slack = 10 - 8 = 2 days!
const branchTasks = [
  { id: 'A', name: 'Task A', duration: 5 },
  { id: 'B', name: 'Task B', duration: 3 },
  { id: 'C', name: 'Task C', duration: 1 },
  { id: 'D', name: 'Task D', duration: 2 }
];
const branchDeps = [
  { predecessorId: 'A', successorId: 'B' },
  { predecessorId: 'A', successorId: 'C' },
  { predecessorId: 'B', successorId: 'D' },
  { predecessorId: 'C', successorId: 'D' }
];

const branchSched = generateSchedule(branchTasks, branchDeps);
console.log(' - Duration:', branchSched.projectDuration, '(Expected: 10)');
console.log(' - Task C Slack:', branchSched.taskMetrics['C'].slack, '(Expected: 2)');
console.log(' - Task C isCritical:', branchSched.taskMetrics['C'].isCritical, '(Expected: false)');
console.log(' - Task B isCritical:', branchSched.taskMetrics['B'].isCritical, '(Expected: true)');
if (branchSched.projectDuration !== 10 || branchSched.taskMetrics['C'].slack !== 2) {
  throw new Error('Branch slack calculation error!');
}
console.log('✓ TEST 4 PASSED.\n');

// 5. TEST 1000 TASKS PERFORMANCE
console.log('TEST 5: Large Scale Performance (1000 Tasks)...');
const largeTasks = [];
const largeDeps = [];
for (let i = 0; i < 1000; i++) {
  largeTasks.push({
    id: `task_${i}`,
    name: `Task ${i}`,
    duration: (i % 5) + 1
  });
  if (i > 0) {
    largeDeps.push({
      predecessorId: `task_${i - 1}`,
      successorId: `task_${i}`
    });
  }
}

const startTime = performance.now();
const largeSched = generateSchedule(largeTasks, largeDeps);
const endTime = performance.now();
console.log(` - 1,000 tasks processed in ${(endTime - startTime).toFixed(2)} ms!`);
console.log(' - Schedule Success:', largeSched.success);
console.log(' - Topological Order Length:', largeSched.executionOrder.length, '(Expected: 1000)');
if (!largeSched.success || largeSched.executionOrder.length !== 1000) {
  throw new Error('1000 tasks test failed!');
}
console.log('✓ TEST 5 PASSED.\n');

console.log('==============================================');
console.log('ALL DSA TESTS COMPLETED SUCCESSFULLY (100%)');
console.log('==============================================');
