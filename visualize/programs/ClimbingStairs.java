// @title Climbing Stairs (1D dynamic programming)
// @leetcode climbing-stairs
// @expect 8
// @start climbStairs
// @pointers ways: i
public class ClimbingStairs {
    public static int climbStairs(int n) {
        int[] ways = new int[n + 1];                 // ways[i] = number of ways to reach step i
        ways[0] = 1;                                 // standing at the bottom: one way
        ways[1] = 1;
        for (int i = 2; i <= n; i++) {
            ways[i] = ways[i - 1] + ways[i - 2];     // the last move was 1 step or 2 steps
        }
        return ways[n];
    }

    public static void main(String[] args) {
        System.out.println(climbStairs(5));
    }
}
