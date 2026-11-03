// @title Unique Paths (2D dynamic programming on a grid)
// @leetcode unique-paths
// @expect 28
// @start uniquePaths
// @cell dp: r c
public class UniquePaths {
    public static int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];                                  // dp[r][c] = paths from the start to (r, c)
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (r == 0 || c == 0) dp[r][c] = 1;                  // top row and left column: one way
                else dp[r][c] = dp[r - 1][c] + dp[r][c - 1];        // from above + from the left
            }
        }
        return dp[m - 1][n - 1];
    }

    public static void main(String[] args) {
        System.out.println(uniquePaths(3, 7));
    }
}
