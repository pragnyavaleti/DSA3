package src;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * CriticalPath.java
 * Identifies critical tasks and constructs the critical path.
 *
 * DSA Concepts:
 *   - Graph traversal on the adjacency list (only following critical nodes)
 *   - ArrayList for maintaining the critical path sequence
 *
 * A Critical Task is one where Slack == 0.
 * The Critical Path is the longest path through the project network
 * connecting only critical tasks.
 *
 * Time Complexity:  O(V + E) for path tracing
 * Space Complexity: O(V)
 */
public class CriticalPath {

    private Project       project;
    private Graph         graph;
    private List<String>  criticalTaskIds;   // IDs of critical tasks in topo order
    private List<String>  criticalPath;      // Ordered IDs forming the critical path
    private int           projectDuration;

    public CriticalPath(Project project, Graph graph) {
        this.project        = project;
        this.graph          = graph;
        this.criticalTaskIds = new ArrayList<>();
        this.criticalPath    = new ArrayList<>();
        this.projectDuration = 0;
    }

    /**
     * Main method: find critical tasks and build the critical path.
     * Must be called AFTER Scheduler.schedule() has run.
     */
    public void compute() {
        criticalTaskIds.clear();
        criticalPath.clear();

        // Step 1: Collect all critical tasks (in topological order)
        List<String> topoOrder = graph.getTopologicalOrder();
        for (String id : topoOrder) {
            Task task = project.getTask(id);
            if (task != null && task.isCritical()) {
                criticalTaskIds.add(id);
            }
        }

        // Step 2: Calculate project duration
        projectDuration = 0;
        for (Task task : project.getAllTasks()) {
            if (task.getEarliestFinish() > projectDuration) {
                projectDuration = task.getEarliestFinish();
            }
        }

        // Step 3: Build the critical path by traversal
        //         Start from critical tasks with EST == 0 and trace through
        //         critical successors.
        buildCriticalPath();
    }

    /**
     * Build the critical path as an ordered list of task IDs.
     *
     * Algorithm:
     *   1. Start from every critical task with no critical predecessors.
     *   2. At each step, follow the critical successor (a successor that is also critical
     *      and whose EST == current task's EFT).
     *   3. Stop when no more critical successors exist.
     *   4. Pick the path with the maximum total duration.
     */
    private void buildCriticalPath() {
        Map<String, List<String>> adjList    = graph.getAdjacencyList();
        Map<String, List<String>> revAdjList = graph.getReverseAdjacencyList();

        // Find starting critical tasks: critical + no critical predecessor
        List<String> startNodes = new ArrayList<>();
        for (String id : criticalTaskIds) {
            List<String> preds = revAdjList.get(id);
            boolean hasCriticalPred = false;
            if (preds != null) {
                for (String predId : preds) {
                    Task pred = project.getTask(predId);
                    if (pred != null && pred.isCritical()) {
                        hasCriticalPred = true;
                        break;
                    }
                }
            }
            if (!hasCriticalPred) {
                startNodes.add(id);
            }
        }

        // Trace the longest critical path from each start node
        List<String> bestPath = new ArrayList<>();
        int bestDuration = -1;

        for (String start : startNodes) {
            List<String> path = tracePath(start, adjList);
            int dur = pathDuration(path);
            if (dur > bestDuration) {
                bestDuration = dur;
                bestPath = path;
            }
        }

        criticalPath = bestPath;
    }

    /**
     * Trace a critical path starting from a given node by always following
     * a critical successor whose EST matches the current task's EFT.
     */
    private List<String> tracePath(String startId, Map<String, List<String>> adjList) {
        List<String> path = new ArrayList<>();
        String current = startId;

        while (current != null) {
            path.add(current);
            Task currentTask = project.getTask(current);
            String nextId = null;

            // Find the next critical successor
            List<String> successors = adjList.get(current);
            if (successors != null) {
                for (String succId : successors) {
                    Task succ = project.getTask(succId);
                    if (succ != null && succ.isCritical()
                            && succ.getEarliestStart() == currentTask.getEarliestFinish()) {
                        nextId = succId;
                        break; // follow first matching critical successor
                    }
                }
            }
            current = nextId;
        }
        return path;
    }

    /** Calculate the total duration of a path. */
    private int pathDuration(List<String> path) {
        int total = 0;
        for (String id : path) {
            Task t = project.getTask(id);
            if (t != null) total += t.getDuration();
        }
        return total;
    }

    // ---- Getters ----
    public List<String> getCriticalTaskIds() { return criticalTaskIds; }
    public List<String> getCriticalPath()    { return criticalPath; }
    public int          getProjectDuration() { return projectDuration; }
}
