package src;

import java.util.NoSuchElementException;
import java.util.Scanner;

/**
 * ProjectManager.java
 * Orchestrates user interactions for each menu option.
 * Acts as a Controller — bridges user input (Main.java) with
 * the domain model (Project, Graph, Scheduler, CriticalPath).
 */
public class ProjectManager {

    private Project      project;     // current project
    private Graph        graph;       // graph representation
    private Scheduler    scheduler;   // CPM scheduler
    private CriticalPath cp;          // critical path analyser
    private Scanner      scanner;

    public ProjectManager(Scanner scanner) {
        this.scanner = scanner;
    }

    // ================================================================
    //  SAFE INPUT HELPER
    // ================================================================

    /**
     * Safe wrapper around scanner.nextLine().
     * Returns empty string instead of throwing NoSuchElementException on EOF.
     */
    private String readLine() {
        try {
            return scanner.nextLine().trim();
        } catch (NoSuchElementException e) {
            return "";
        }
    }

    // ================================================================
    //  1. CREATE PROJECT
    // ================================================================

    public void createProject() {
        DisplayUtil.printHeader("CREATE PROJECT");

        System.out.print("  Enter Project Name       : ");
        String name = readLine();

        if (!InputValidator.isValidProjectName(name)) {
            DisplayUtil.printError("Project name cannot be empty.");
            return;
        }

        System.out.print("  Enter Project Description: ");
        String desc = readLine();

        project   = new Project(name, desc);
        graph     = null;
        scheduler = null;
        cp        = null;

        System.out.println();
        DisplayUtil.printSuccess("Project \"" + name + "\" created successfully!");
    }

    // ================================================================
    //  2. ADD TASK
    // ================================================================

    public void addTask() {
        if (!checkProjectExists()) return;
        DisplayUtil.printHeader("ADD TASK");

        System.out.print("  Enter Task ID   : ");
        String taskId = readLine();

        if (!InputValidator.isValidTaskId(taskId)) {
            DisplayUtil.printError("Invalid Task ID. Must be non-empty and contain no spaces.");
            return;
        }

        if (project.taskExists(taskId)) {
            DisplayUtil.printError("Task ID '" + taskId + "' already exists. Use a unique ID.");
            return;
        }

        System.out.print("  Enter Task Name : ");
        String taskName = readLine();

        if (!InputValidator.isValidTaskName(taskName)) {
            DisplayUtil.printError("Task name cannot be empty.");
            return;
        }

        System.out.print("  Enter Duration (days): ");
        String durStr = readLine();
        int duration = InputValidator.parseInt(durStr);

        if (!InputValidator.isValidDuration(duration)) {
            DisplayUtil.printError("Duration must be a positive integer (greater than 0).");
            return;
        }

        Task task = new Task(taskId, taskName, duration);
        project.addTask(task);
        project.setScheduleGenerated(false); // invalidate old schedule

        System.out.println();
        DisplayUtil.printSuccess("Task [" + taskId + "] '" + taskName + "' added successfully!");
    }

    // ================================================================
    //  3. ADD DEPENDENCY
    // ================================================================

    public void addDependency() {
        if (!checkProjectExists())  return;
        if (!checkTasksExist())     return;

        DisplayUtil.printHeader("ADD DEPENDENCY");
        System.out.println("  (Enter the task that must be completed FIRST, then the NEXT task)");
        System.out.println();

        System.out.print("  Enter PREVIOUS Task ID (must finish first): ");
        String fromId = readLine();

        System.out.print("  Enter NEXT Task ID    (starts after)      : ");
        String toId = readLine();

        // Validate existence
        if (!project.taskExists(fromId)) {
            DisplayUtil.printError("Task '" + fromId + "' does not exist.");
            return;
        }
        if (!project.taskExists(toId)) {
            DisplayUtil.printError("Task '" + toId + "' does not exist.");
            return;
        }
        if (fromId.equals(toId)) {
            DisplayUtil.printError("A task cannot depend on itself.");
            return;
        }

        boolean added = project.addDependency(fromId, toId);
        if (!added) {
            DisplayUtil.printError("Dependency " + fromId + " -> " + toId
                    + " already exists or is invalid.");
            return;
        }

        System.out.println();
        DisplayUtil.printSuccess("Dependency added: " + fromId + " -> " + toId);
        System.out.println("  ('" + project.getTask(fromId).getTaskName()
                + "' must finish before '"
                + project.getTask(toId).getTaskName() + "' starts)");
    }

    // ================================================================
    //  4. VIEW TASKS
    // ================================================================

    public void viewTasks() {
        if (!checkProjectExists()) return;
        DisplayUtil.printTaskList(project);
    }

    // ================================================================
    //  5. VIEW DEPENDENCIES
    // ================================================================

    public void viewDependencies() {
        if (!checkProjectExists()) return;
        DisplayUtil.printDependencies(project);
    }

    // ================================================================
    //  6. GENERATE SCHEDULE
    // ================================================================

    public void generateSchedule() {
        if (!checkProjectExists()) return;
        if (!checkTasksExist())    return;

        DisplayUtil.printScheduleGenerationSteps();

        // Build graph
        graph = new Graph();
        graph.buildFromProject(project);

        // Detect cycle
        if (graph.detectCycle()) {
            DisplayUtil.printCycleError();
            project.setScheduleGenerated(false);
            return;
        }

        // Topological sort
        graph.topologicalSort();

        // Print execution order
        DisplayUtil.printExecutionOrder(project, graph);

        // Schedule (CPM)
        scheduler = new Scheduler(project, graph);
        scheduler.schedule();

        // Critical path
        cp = new CriticalPath(project, graph);
        cp.compute();

        // Print schedule table
        DisplayUtil.printScheduleTable(project, graph);
    }

    // ================================================================
    //  7. VIEW CRITICAL PATH
    // ================================================================

    public void viewCriticalPath() {
        if (!checkProjectExists())       return;
        if (!checkScheduleGenerated())   return;
        DisplayUtil.printCriticalPathAnalysis(project, graph, cp);
    }

    // ================================================================
    //  8. PROJECT SUMMARY
    // ================================================================

    public void viewProjectSummary() {
        if (!checkProjectExists()) return;
        // cp may be null if schedule has not been generated yet — DisplayUtil handles it
        DisplayUtil.printProjectSummary(project, cp);
    }

    // ================================================================
    //  9. LOAD DEMO PROJECT
    // ================================================================

    public void loadDemoProject() {
        DisplayUtil.printHeader("LOADING DEMO PROJECT");
        System.out.println("  Project: College Management System");
        System.out.println("  Tasks  : 7");
        System.out.println("  Deps   : 7");
        System.out.println();

        // Create project
        project = new Project("College Management System",
                "A complete system for managing college operations");
        graph     = null;
        scheduler = null;
        cp        = null;

        // Add tasks
        project.addTask(new Task("T1", "Requirement Analysis",  3));
        project.addTask(new Task("T2", "System Design",         4));
        project.addTask(new Task("T3", "Backend Development",   5));
        project.addTask(new Task("T4", "Frontend Development",  4));
        project.addTask(new Task("T5", "Database Integration",  3));
        project.addTask(new Task("T6", "Testing",               3));
        project.addTask(new Task("T7", "Deployment",            2));

        // Add dependencies
        project.addDependency("T1", "T2");
        project.addDependency("T2", "T3");
        project.addDependency("T2", "T4");
        project.addDependency("T3", "T5");
        project.addDependency("T4", "T6");
        project.addDependency("T5", "T6");
        project.addDependency("T6", "T7");

        DisplayUtil.printSuccess("Demo project loaded!");
        System.out.println("  Use option 6 to generate the schedule.");
    }

    // ================================================================
    //  GUARD HELPERS
    // ================================================================

    private boolean checkProjectExists() {
        if (project == null) {
            DisplayUtil.printError("No project exists. Please create a project first (Option 1).");
            return false;
        }
        return true;
    }

    private boolean checkTasksExist() {
        if (project.getTotalTasks() == 0) {
            DisplayUtil.printError("No tasks found. Please add tasks first (Option 2).");
            return false;
        }
        return true;
    }

    private boolean checkScheduleGenerated() {
        if (!project.isScheduleGenerated() || graph == null || cp == null) {
            DisplayUtil.printError("Schedule not generated yet. Please run Option 6 first.");
            return false;
        }
        return true;
    }

    // ================================================================
    //  GETTER
    // ================================================================

    public Project getProject() { return project; }
}
