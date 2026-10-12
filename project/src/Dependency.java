package src;

/**
 * Dependency.java
 * Represents a directed edge: fromTask must finish before toTask starts.
 *
 * DSA Concept: Edge in a Directed Graph (Adjacency List representation).
 */
public class Dependency {

    private String fromTaskId; // predecessor
    private String toTaskId;   // successor

    public Dependency(String fromTaskId, String toTaskId) {
        this.fromTaskId = fromTaskId;
        this.toTaskId   = toTaskId;
    }

    public String getFromTaskId() { return fromTaskId; }
    public String getToTaskId()   { return toTaskId; }

    @Override
    public String toString() {
        return fromTaskId + " -> " + toTaskId;
    }
}
