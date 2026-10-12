package src;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Project.java
 * Aggregates all project data: name, description, tasks, and dependencies.
 * Acts as the central data store passed between all components.
 */
public class Project {

    private String projectName;
    private String description;

    // DSA: HashMap for O(1) task lookup by taskId
    private Map<String, Task> taskMap;

    // DSA: ArrayList for ordered task list
    private List<Dependency> dependencies;

    // Flag: has schedule been generated?
    private boolean scheduleGenerated;

    // ---- Constructor ----
    public Project(String projectName, String description) {
        this.projectName       = projectName;
        this.description       = description;
        this.taskMap           = new HashMap<>();
        this.dependencies      = new ArrayList<>();
        this.scheduleGenerated = false;
    }

    // ---- Task Management ----

    /**
     * Add a task to the project. Returns false if taskId already exists.
     */
    public boolean addTask(Task task) {
        if (taskMap.containsKey(task.getTaskId())) {
            return false; // duplicate
        }
        taskMap.put(task.getTaskId(), task);
        return true;
    }

    /**
     * Add a dependency (directed edge) to the project.
     */
    public boolean addDependency(String fromId, String toId) {
        // Validate both tasks exist
        if (!taskMap.containsKey(fromId) || !taskMap.containsKey(toId)) {
            return false;
        }
        // Self-dependency check
        if (fromId.equals(toId)) {
            return false;
        }
        // Duplicate dependency check
        for (Dependency dep : dependencies) {
            if (dep.getFromTaskId().equals(fromId) && dep.getToTaskId().equals(toId)) {
                return false;
            }
        }
        dependencies.add(new Dependency(fromId, toId));
        scheduleGenerated = false; // invalidate schedule
        return true;
    }

    // ---- Getters ----
    public String          getProjectName()    { return projectName; }
    public String          getDescription()    { return description; }
    public Map<String, Task> getTaskMap()      { return taskMap; }
    public List<Task>      getAllTasks()        { return new ArrayList<>(taskMap.values()); }
    public List<Dependency> getDependencies()  { return dependencies; }
    public boolean         isScheduleGenerated() { return scheduleGenerated; }

    public void setScheduleGenerated(boolean v) { this.scheduleGenerated = v; }

    // ---- Convenience ----
    public boolean taskExists(String taskId) {
        return taskMap.containsKey(taskId);
    }

    public Task getTask(String taskId) {
        return taskMap.get(taskId);
    }

    public int getTotalTasks()        { return taskMap.size(); }
    public int getTotalDependencies() { return dependencies.size(); }
}
