// This one has a bug. Visualize it: the panel shows where it crashes and what i was at that moment.
// Can you see why? Fix it, save, and the visualizer records the fixed version.
//
// @pointers scores: i
public class FindTheBug {
    static int total(int[] scores) {
        int sum = 0;
        for (int i = 0; i <= scores.length; i++) {
            sum += scores[i];
        }
        return sum;
    }

    public static void main(String[] args) {
        int[] scores = {70, 85, 90};
        System.out.println("total = " + total(scores));
    }
}
