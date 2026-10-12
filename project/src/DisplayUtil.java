package src;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Scanner;

/**w
 * DisplayUtil.java
 * All terminal display / formatting utilities.
 * Keeps UI concerns out of business logic classes.
 *
 * Every method is static — no instance needed.
 */
public class DisplayUtil {

    // ================================================================
    //  HEADERS / DIVIDERS
    // ================================================================

    public static void printHeader(String title) {
        System.out.println();
        System.out.println("========================================");
        System.out.println("  " + title);
        System.out.println("========================================");
    }

    public static void printDivider() {
        System.out.println("----------------------------------------");
    }

    public static void printSuccess(String msg) {
        System.out.println("[OK]  " + msg);
    }

    public static void printError(String msg) {
        System.out.println("[ERR] " + msg);
    }

    // ================================================================
    //  MAIN MENU
    // ================================================================

    public static void printMainMenu() {
        System.out.println();
        System.out.println("========================================");
        System.out.println("  AUTOMATED PROJECT TASK PLANNING SYSTEM");
        System.out.println("========================================");
        System.out.println("  1. Create Project");
        System.out.println("  2. Add Task");
        System.out.println("  3. Add Dependency");
        System.out.println("  4. View Tasks");
        System.out.println("  5. View Dependencies");
        System.out.println("  6. Generate Schedule");
        System.out.println("  7. View Critical Path");
        System.out.println("  8. View Project Summary");
        System.out.println("  9. Load Demo Project");
        System.out.println("  0. Exit");
        System.out.println("========================================");
        System.out.print("  Enter your choice: ");
    }

    // ================================================================
    //  TASK LIST  (Option 4)
    // ================================================================

    public static void printTaskList(Project project) {
        printHeader("TASK LIST");
        if (project.getTotalTasks() == 0) {
            System.out.println("  No tasks have been added yet.");
            return;
        }
        System.out.printf("  %-8s %-26s %-10s%n", "ID", "TASK NAME", "DURATION");
        printDivider();
        for (Task task : project.getAllTasks()) {
            System.out.printf("  %-8s %-26s %d days%n",
                    task.getTaskId(),
                    task.getTaskName(),
                    task.getDuration());
        }
        printDivider();
        System.out.println("  Total Tasks: " + project.getTotalTasks());
    }

    // ================================================================
    //  DEPENDENCIES  (Option 5)
    // ================================================================

    public static void printDependencies(Project project) {
        printHeader("DEPENDENCIES");
        if (project.getTotalDependencies() == 0) {
            System.out.println("  No dependencies have been added yet.");
            return;
        }
        for (Dependency dep : project.getDependencies()) {
            System.out.println("  " + dep.toString());
        }
        printDivider();
        System.out.println("  Total Dependencies: " + project.getTotalDependencies());
    }

    // ================================================================
    //  ADJACENCY LIST  (informational / debug view)
    // ================================================================

    public static void printAdjacencyList(Graph graph, Project project) {
        printHeader("ADJACENCY LIST (GRAPH STRUCTURE)");
        List<String> order = graph.getTopologicalOrder();
        if (order.isEmpty()) {
            System.out.println("  Graph not built yet. Generate a schedule first.");
            return;
        }
        for (String taskId : order) {
            List<String> neighbors = graph.getAdjacencyList().get(taskId);
            System.out.print("  " + taskId);
            if (neighbors != null && !neighbors.isEmpty()) {
                System.out.print(" -> ");
                System.out.print(String.join(", ", neighbors));
            } else {
                System.out.print(" (no successors)");
            }
            System.out.println();
        }
    }

    // ================================================================
    //  SCHEDULE GENERATION STEPS  (Option 6 — animated steps)
    // ================================================================

    public static void printScheduleGenerationSteps() {
        printHeader("GENERATING PROJECT SCHEDULE");
        step("  [1/5] Checking dependencies...");
        step("  [2/5] Checking for circular dependencies...");
        step("  [3/5] Generating execution order (Topological Sort)...");
        step("  [4/5] Calculating task timings (Forward & Backward Pass)...");
        step("  [5/5] Finding critical tasks and critical path...");
        System.out.println();
        printSuccess("Schedule generated successfully!");
    }

    /** Print a step message with a short pause for readability. */
    private static void step(String msg) {
        System.out.println(msg);
        try { Thread.sleep(250); } catch (InterruptedException ignored) {}
    }

    // ================================================================
    //  EXECUTION ORDER  (shown as part of Option 6)
    // ================================================================

    public static void printExecutionOrder(Project project, Graph graph) {
        printHeader("EXECUTION ORDER  (Topological Sort)");
        List<String> topoOrder = graph.getTopologicalOrder();
        int stepNum = 1;
        for (String id : topoOrder) {
            Task task = project.getTask(id);
            if (task == null) continue;
            System.out.printf("  %2d. [%-4s]  %s  (%d days)%n",
                    stepNum++, id, task.getTaskName(), task.getDuration());
        }
    }

    // ================================================================
    //  PROJECT SCHEDULE TABLE  (shown as part of Option 6)
    // ================================================================

    public static void printScheduleTable(Project project, Graph graph) {
        printHeader("PROJECT SCHEDULE");
        System.out.println("  (* = Critical Task)");
        System.out.println();
        System.out.printf("  %-26s %5s  %6s  %8s  %5s  %s%n",
                "TASK", "START", "FINISH", "DURATION", "SLACK", "");
        printDivider();

        List<String> topoOrder = graph.getTopologicalOrder();
        for (String id : topoOrder) {
            Task task = project.getTask(id);
            if (task == null) continue;
            String critFlag = task.isCritical() ? " *" : "  ";
            System.out.printf("  %-26s %5d  %6d  %8s  %5d  %s%n",
                    task.getTaskName(),
                    task.getEarliestStart(),
                    task.getEarliestFinish(),
                    task.getDuration() + "d",
                    task.getSlack(),
                    critFlag);
        }
        printDivider();
        System.out.println("  * = Critical task (Slack = 0, any delay extends the project)");
    }

    // ================================================================
    //  CRITICAL PATH ANALYSIS  (Option 7)
    // ================================================================

    public static void printCriticalPathAnalysis(Project project,
                                                  Graph graph,
                                                  CriticalPath cp) {
        printHeader("CRITICAL PATH ANALYSIS");

        // ---- Critical task list ----
        System.out.println("  Critical Tasks:");
        printDivider();
        List<String> critIds = cp.getCriticalTaskIds();
        if (critIds.isEmpty()) {
            System.out.println("  No critical tasks found.");
        } else {
            for (String id : critIds) {
                Task task = project.getTask(id);
                if (task == null) continue;
                System.out.printf("  %-8s  %s%n", id, task.getTaskName());
            }
        }

        // ---- Critical path visual ----
        System.out.println();
        System.out.println("  Critical Path:");
        printDivider();
        List<String> path = cp.getCriticalPath();
        if (path.isEmpty()) {
            System.out.println("  No critical path found.");
        } else {
            for (int i = 0; i < path.size(); i++) {
                Task task = project.getTask(path.get(i));
                if (task == null) continue;
                System.out.printf("  [%s]  %s  (%d days)%n",
                        task.getTaskId(), task.getTaskName(), task.getDuration());
                if (i < path.size() - 1) {
                    System.out.println("           |");
                    System.out.println("           v");
                }
            }

            // ---- Path string ----
            System.out.println();
            System.out.print("  Path: ");
            for (int i = 0; i < path.size(); i++) {
                System.out.print(path.get(i));
                if (i < path.size() - 1) System.out.print(" -> ");
            }
            System.out.println();
        }

        printDivider();
        System.out.println("  Project Duration : " + cp.getProjectDuration() + " days");
        System.out.println("  Critical Tasks   : " + critIds.size()
                + " out of " + project.getTotalTasks());
    }

    // ================================================================
    //  PROJECT SUMMARY  (Option 8)
    // ================================================================

    public static void printProjectSummary(Project project, CriticalPath cp) {
        printHeader("PROJECT SUMMARY");
        System.out.println("  Project Name    : " + project.getProjectName());
        System.out.println("  Description     : " + project.getDescription());
        System.out.println("  Total Tasks     : " + project.getTotalTasks());
        System.out.println("  Total Deps      : " + project.getTotalDependencies());
        printDivider();
        if (project.isScheduleGenerated() && cp != null) {
            System.out.println("  Project Duration: " + cp.getProjectDuration() + " days");
            System.out.println("  Critical Tasks  : " + cp.getCriticalTaskIds().size()
                    + " out of " + project.getTotalTasks());
            System.out.println("  Schedule Status : Valid  (Generated)");
        } else {
            System.out.println("  Project Duration: Not calculated yet");
            System.out.println("  Schedule Status : Not generated  -->  run Option 6 first");
        }
    }

    // ================================================================
    //  CYCLE ERROR
    // ================================================================

    public static void printCycleError() {
        printHeader("CIRCULAR DEPENDENCY DETECTED");
        System.out.println("  ERROR: A cycle was found in the dependency graph!");
        System.out.println();
        System.out.println("  A project schedule CANNOT be generated when tasks");
        System.out.println("  depend on each other in a circle.");
        System.out.println();
        System.out.println("  Example cycle:  T1 -> T2 -> T3 -> T1");
        System.out.println();
        System.out.println("  How to fix:");
        System.out.println("    1. Review your dependencies (Option 5).");
        System.out.println("    2. Remove the dependency that creates the cycle.");
        System.out.println("    3. Re-run Generate Schedule (Option 6).");
    }

    // ================================================================
    //  PAUSE  (used by Main.java — waits for Enter)
    // ================================================================

    public static void pressEnterToContinue(Scanner scanner) {
        System.out.println();
        System.out.print("  Press Enter to return to main menu...");
        try {
            if (scanner.hasNextLine()) {
                scanner.nextLine();
            }
        } catch (NoSuchElementException ignored) {
            // EOF reached — continue normally
        }
    }
}
