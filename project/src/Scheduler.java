package src;

import java.util.List;
import java.util.Map;

/**
 * Scheduler.java
 * Implements the Critical Path Method (CPM).
 *
 * DSA Concepts:
 *   - Forward Pass: calculates Earliest Start Time (EST) & Earliest Finish Time (EFT)
 *   - Backward Pass: calculates Latest Finish Time (LFT) & Latest Start Time (LST)
 *   - Slack calculation: Slack = LST - EST
 *
 * Algorithm:
 *
 * FORWARD PASS (left to right in topological order):
 *   EST(task) = max(EFT of all predecessors)
 *   EFT(task) = EST(task) + duration
 *   Tasks with no predecessors: EST = 0
 *
 * BACKWARD PASS (right to left — reverse topological order):
 *   LFT(last task) = project duration
 *   LST(task)      = LFT(task) - duration
 *   LFT(pred)      = min(LST of all successors of pred)
 *
 * SLACK:
 *   Slack = LST - EST
 *   Critical Task: Slack == 0
 *
 * Time Complexity:  O(V + E)
 * Space Complexity: O(V)
 */
public class Scheduler {

    private Project project;
    private Graph   graph;

    public Scheduler(Project project, Graph graph) {
        this.project = project;
        this.graph   = graph;
    }

    /**
     * Run full CPM scheduling.
     * Assumes topologicalSort() has already been called on the graph.
     */
    public void schedule() {
        List<String>              topoOrder   = graph.getTopologicalOrder();
        Map<String, List<String>> adjList     = graph.getAdjacencyList();
        Map<String, List<String>> revAdjList  = graph.getReverseAdjacencyList();

        // ---- FORWARD PASS ----
        forwardPass(topoOrder, revAdjList);

        // ---- Determine Project Duration ----
        int projectDuration = calculateProjectDuration();

        // ---- BACKWARD PASS ----
        backwardPass(topoOrder, adjList, projectDuration);

        // ---- SLACK & CRITICAL FLAG ----
        computeSlackAndCritical();

        project.setScheduleGenerated(true);
    }

    // ----------------------------------------------------------------
    //  FORWARD PASS
    // ----------------------------------------------------------------
    private void forwardPass(List<String> topoOrder,
                             Map<String, List<String>> revAdjList) {

        for (String taskId : topoOrder) {
            Task task = project.getTask(taskId);

            List<String> predecessors = revAdjList.get(taskId);

            int est = 0; // default for tasks with no predecessors

            // EST = max EFT of all predecessors
            if (predecessors != null && !predecessors.isEmpty()) {
                for (String predId : predecessors) {
                    Task pred = project.getTask(predId);
                    if (pred.getEarliestFinish() > est) {
                        est = pred.getEarliestFinish();
                    }
                }
            }

            task.setEarliestStart(est);
            task.setEarliestFinish(est + task.getDuration());
        }
    }

    // ----------------------------------------------------------------
    //  PROJECT DURATION
    // ----------------------------------------------------------------
    private int calculateProjectDuration() {
        int maxFinish = 0;
        for (Task task : project.getAllTasks()) {
            if (task.getEarliestFinish() > maxFinish) {
                maxFinish = task.getEarliestFinish();
            }
        }
        return maxFinish;
    }

    public int getProjectDuration() {
        return calculateProjectDuration();
    }

    // ----------------------------------------------------------------
    //  BACKWARD PASS
    // ----------------------------------------------------------------
    private void backwardPass(List<String> topoOrder,
                              Map<String, List<String>> adjList,
                              int projectDuration) {

        // Initialise all LFT to project duration (conservative upper bound)
        for (Task task : project.getAllTasks()) {
            task.setLatestFinish(projectDuration);
        }

        // Traverse in REVERSE topological order
        for (int i = topoOrder.size() - 1; i >= 0; i--) {
            String taskId = topoOrder.get(i);
            Task   task   = project.getTask(taskId);

            List<String> successors = adjList.get(taskId);

            if (successors == null || successors.isEmpty()) {
                // Terminal task: LFT = project duration
                task.setLatestFinish(projectDuration);
            } else {
                // LFT = min(LST of all successors)
                int minLST = Integer.MAX_VALUE;
                for (String succId : successors) {
                    Task succ = project.getTask(succId);
                    int succLST = succ.getLatestFinish() - succ.getDuration();
                    if (succLST < minLST) {
                        minLST = succLST;
                    }
                }
                task.setLatestFinish(minLST);
            }

            // LST = LFT - duration
            task.setLatestStart(task.getLatestFinish() - task.getDuration());
        }
    }

    // ----------------------------------------------------------------
    //  SLACK & CRITICAL
    // ----------------------------------------------------------------
    private void computeSlackAndCritical() {
        for (Task task : project.getAllTasks()) {
            int slack = task.getLatestStart() - task.getEarliestStart();
            task.setSlack(slack);
            task.setCritical(slack == 0);
        }
    }
}
