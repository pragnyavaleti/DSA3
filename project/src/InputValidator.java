package src;

/**
 * InputValidator.java
 * Centralised input validation utility.
 * Prevents invalid data from entering the system.
 */
public class InputValidator {

    /**
     * Validate a Task ID:
     *   - Must not be null or blank
     *   - Must not contain spaces
     */
    public static boolean isValidTaskId(String taskId) {
        if (taskId == null || taskId.trim().isEmpty()) return false;
        if (taskId.contains(" ")) return false;
        return true;
    }

    /**
     * Validate a Task Name:
     *   - Must not be null or blank
     */
    public static boolean isValidTaskName(String name) {
        return name != null && !name.trim().isEmpty();
    }

    /**
     * Validate duration:
     *   - Must be > 0
     */
    public static boolean isValidDuration(int duration) {
        return duration > 0;
    }

    /**
     * Try to parse an integer from a string.
     * Returns Integer.MIN_VALUE on failure.
     */
    public static int parseInt(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return Integer.MIN_VALUE;
        }
    }

    /**
     * Validate project name: non-empty.
     */
    public static boolean isValidProjectName(String name) {
        return name != null && !name.trim().isEmpty();
    }
}
