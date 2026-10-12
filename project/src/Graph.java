package src;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

/**
 * Graph.java
 * Core DSA component: Directed Graph using Adjacency List.
 *
 * DSA Concepts Used:
 *   - Directed Graph
 *   - Adjacency List (HashMap<String, List<String>>)
 *   - In-degree Array (HashMap<String, Integer>)
 *   - Queue (LinkedList) for BFS-based Kahn's Algorithm
 *   - HashSet for visited nodes in cycle detection
 *
 * Responsibilities:
 *   1. Build graph from Project tasks and dependencies
 *   2. Detect circular dependencies (Kahn's Algorithm)
 *   3. Produce topological order (Kahn's Algorithm)
 */
public class Graph {

    // ---- Adjacency List: taskId -> list of successor taskIds ----
    // DSA: HashMap<String, List<String>> — O(1) lookup per node
    private Map<String, List<String>> adjacencyList;

    // ---- Reverse Adjacency List: taskId -> list of predecessor taskIds ----
    // Used for backward pass in CPM
    private Map<String, List<String>> reverseAdjacencyList;

    // ---- In-degree: taskId -> number of incoming edges ----
    // DSA: HashMap<String, Integer>
    private Map<String, Integer> inDegree;

    // ---- All task IDs (nodes in the graph) ----
    private Set<String> taskIds;

    // ---- Result of topological sort ----
    private List<String> topologicalOrder;

    // ---- Constructor ----
    public Graph() {
        adjacencyList        = new HashMap<>();
        reverseAdjacencyList = new HashMap<>();
        inDegree             = new HashMap<>();
        taskIds              = new HashSet<>();
        topologicalOrder     = new ArrayList<>();
    }

    // ----------------------------------------------------------------
    //  BUILD GRAPH
    // ----------------------------------------------------------------

    /**
     * Add a node (task) to the graph.
     */
    public void addTask(String taskId) {
        taskIds.add(taskId);
        adjacencyList.putIfAbsent(taskId, new ArrayList<>());
        reverseAdjacencyList.putIfAbsent(taskId, new ArrayList<>());
        inDegree.putIfAbsent(taskId, 0);
    }

    /**
     * Add a directed edge from -> to.
     * Increments in-degree of 'to'.
     */
    public void addEdge(String from, String to) {
        adjacencyList.get(from).add(to);
        reverseAdjacencyList.get(to).add(from);
        inDegree.put(to, inDegree.get(to) + 1);
    }

    /**
     * Build the graph from a Project object.
     */
    public void buildFromProject(Project project) {
        // Reset graph
        adjacencyList.clear();
        reverseAdjacencyList.clear();
        inDegree.clear();
        taskIds.clear();
        topologicalOrder.clear();

        // Add all tasks as nodes
        for (Task task : project.getAllTasks()) {
            addTask(task.getTaskId());
        }

        // Add all dependencies as edges
        for (Dependency dep : project.getDependencies()) {
            addEdge(dep.getFromTaskId(), dep.getToTaskId());
        }
    }

    // ----------------------------------------------------------------
    //  KAHN'S ALGORITHM — Cycle Detection + Topological Sort
    // ----------------------------------------------------------------

    /**
     * Detect cycle using Kahn's Algorithm.
     *
     * Algorithm Steps:
     *   1. Calculate in-degree for all nodes.
     *   2. Enqueue all nodes with in-degree 0.
     *   3. Dequeue a node, add to result, decrement in-degree of its neighbors.
     *   4. If a neighbor's in-degree becomes 0, enqueue it.
     *   5. If processed count < total nodes → cycle exists.
     *
     * Time Complexity:  O(V + E) where V = tasks, E = dependencies
     * Space Complexity: O(V)
     *
     * @return true if a cycle exists, false otherwise
     */
    public boolean detectCycle() {
        // Work with a copy of in-degrees so the original is preserved
        Map<String, Integer> tempInDegree = new HashMap<>(inDegree);

        // DSA: Queue (LinkedList) for BFS
        Queue<String> queue = new LinkedList<>();

        // Step 1: Enqueue all zero-indegree nodes
        for (String id : taskIds) {
            if (tempInDegree.get(id) == 0) {
                queue.offer(id);
            }
        }

        int processedCount = 0;

        // Step 2: BFS
        while (!queue.isEmpty()) {
            String current = queue.poll();
            processedCount++;

            for (String neighbor : adjacencyList.get(current)) {
                int newDegree = tempInDegree.get(neighbor) - 1;
                tempInDegree.put(neighbor, newDegree);
                if (newDegree == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        // Step 3: If not all nodes processed → cycle
        return processedCount != taskIds.size();
    }

    /**
     * Perform Topological Sort using Kahn's Algorithm.
     * Must call detectCycle() first and confirm no cycle.
     *
     * @return ordered list of task IDs in topological order
     */
    public List<String> topologicalSort() {
        topologicalOrder.clear();

        Map<String, Integer> tempInDegree = new HashMap<>(inDegree);

        // DSA: Queue for BFS
        Queue<String> queue = new LinkedList<>();

        // Enqueue all zero-indegree nodes
        for (String id : taskIds) {
            if (tempInDegree.get(id) == 0) {
                queue.offer(id);
            }
        }

        // Process queue
        while (!queue.isEmpty()) {
            String current = queue.poll();
            topologicalOrder.add(current);

            for (String neighbor : adjacencyList.get(current)) {
                int newDegree = tempInDegree.get(neighbor) - 1;
                tempInDegree.put(neighbor, newDegree);
                if (newDegree == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        return new ArrayList<>(topologicalOrder);
    }

    // ----------------------------------------------------------------
    //  GETTERS
    // ----------------------------------------------------------------

    public Map<String, List<String>> getAdjacencyList()        { return adjacencyList; }
    public Map<String, List<String>> getReverseAdjacencyList() { return reverseAdjacencyList; }
    public Map<String, Integer>      getInDegree()             { return inDegree; }
    public Set<String>               getTaskIds()              { return taskIds; }
    public List<String>              getTopologicalOrder()     { return topologicalOrder; }
}
