// A program that reads input. When you visualize it, you're asked what to type, for example:
//   5\n3 9 2 7 4
// (\n starts a new line). It finds the sum and the largest number as it reads them.
// Change the input later with: Ctrl+Shift+P → "Java Visualizer: Set the program's input…"
import java.util.Scanner;

public class ReadNumbers {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();                 // how many numbers follow
        int sum = 0;
        int largest = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            sum += x;
            if (x > largest) {
                largest = x;                  // a new largest
            }
        }
        System.out.println("sum = " + sum);
        System.out.println("largest = " + largest);
    }
}
