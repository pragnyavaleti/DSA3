package src;

import java.util.Scanner;
import java.util.NoSuchElementException;

/**
 * Main.java
 * Entry point of the Automated Project Task Planning System.
 *
 * Responsibilities:
 *   - Display the main menu in a loop
 *   - Read user input
 *   - Delegate to ProjectManager
 *   - Handle invalid input gracefully (including piped / EOF input)
 *
 * To compile and run:
 *   javac src/*.java
 *   java  src.Main
 */
public class Main {

    public static void main(String[] args) {

        Scanner        scanner = new Scanner(System.in);
        ProjectManager manager = new ProjectManager(scanner);

        System.out.println();
        System.out.println("  Welcome to the Automated Project Task Planning System");
        System.out.println("  Powered by: Directed Graph + Kahn's Algorithm + CPM");

        boolean running = true;

        while (running) {
            DisplayUtil.printMainMenu();

            String input;
            try {
                input = scanner.nextLine().trim();
            } catch (NoSuchElementException e) {
                // Input stream ended (EOF / piped input exhausted) — exit cleanly
                break;
            }

            switch (input) {
                case "1":
                    manager.createProject();
                    break;
                case "2":
                    manager.addTask();
                    break;
                case "3":
                    manager.addDependency();
                    break;
                case "4":
                    manager.viewTasks();
                    break;
                case "5":
                    manager.viewDependencies();
                    break;
                case "6":
                    manager.generateSchedule();
                    break;
                case "7":
                    manager.viewCriticalPath();
                    break;
                case "8":
                    manager.viewProjectSummary();
                    break;
                case "9":
                    manager.loadDemoProject();
                    break;
                case "0":
                    System.out.println();
                    System.out.println("  Thank you for using the Task Planning System. Goodbye!");
                    System.out.println();
                    running = false;
                    break;
                default:
                    DisplayUtil.printError("Invalid choice. Please enter a number from 0 to 9.");
                    break;
            }

            if (running) {
                pauseForUser(scanner);
            }
        }

        scanner.close();
    }

    /**
     * Pause and wait for the user to press Enter before re-showing the menu.
     * Handles EOF gracefully (piped input / end of stream).
     */
    private static void pauseForUser(Scanner scanner) {
        System.out.println();
        System.out.print("  Press Enter to return to main menu...");
        try {
            scanner.nextLine();
        } catch (NoSuchElementException e) {
            // EOF reached — continue, outer loop will exit on next read
        }
    }
}
