package src;

/**
 * Task.java
 * Represents a single project task with timing information used by the CPM scheduler.
 */
public class Task {
    private String taskId;
    private String taskName;
    private int duration;

    private int earliestStart;
    private int earliestFinish;
    private int latestStart;
    private int latestFinish;
    private int slack;
    private boolean critical;

    public Task(String taskId, String taskName, int duration) {
        this.taskId = taskId;
        this.taskName = taskName;
        this.duration = duration;
        this.earliestStart = 0;
        this.earliestFinish = 0;
        this.latestStart = 0;
        this.latestFinish = 0;
        this.slack = 0;
        this.critical = false;
    }

    public String getTaskId() {
        return taskId;
    }

    public String getTaskName() {
        return taskName;
    }

    public int getDuration() {
        return duration;
    }

    public int getEarliestStart() {
        return earliestStart;
    }

    public void setEarliestStart(int earliestStart) {
        this.earliestStart = earliestStart;
    }

    public int getEarliestFinish() {
        return earliestFinish;
    }

    public void setEarliestFinish(int earliestFinish) {
        this.earliestFinish = earliestFinish;
    }

    public int getLatestStart() {
        return latestStart;
    }

    public void setLatestStart(int latestStart) {
        this.latestStart = latestStart;
    }

    public int getLatestFinish() {
        return latestFinish;
    }

    public void setLatestFinish(int latestFinish) {
        this.latestFinish = latestFinish;
    }

    public int getSlack() {
        return slack;
    }

    public void setSlack(int slack) {
        this.slack = slack;
    }

    public boolean isCritical() {
        return critical;
    }

    public void setCritical(boolean critical) {
        this.critical = critical;
    }

    @Override
    public String toString() {
        return "Task{" +
                "taskId='" + taskId + '\'' +
                ", taskName='" + taskName + '\'' +
                ", duration=" + duration +
                ", earliestStart=" + earliestStart +
                ", earliestFinish=" + earliestFinish +
                ", latestStart=" + latestStart +
                ", latestFinish=" + latestFinish +
                ", slack=" + slack +
                ", critical=" + critical +
                '}';
    }
}
