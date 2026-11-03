// @title Number of Islands (flood fill with DFS on a grid)
// @leetcode number-of-islands
// @expect 3
// @start numIslands
// @cell grid: r c
public class NumberOfIslands {
    public static int numIslands(char[][] grid) {
        int islands = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    islands++;
                    sink(grid, r, c);              // flood the whole island so it's counted once
                }
            }
        }
        return islands;
    }

    static void sink(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';                          // visited: water now
        sink(grid, r + 1, c);
        sink(grid, r - 1, c);
        sink(grid, r, c + 1);
        sink(grid, r, c - 1);
    }

    public static void main(String[] args) {
        String[] rows = {"11000", "11000", "00100", "00011"};
        char[][] grid = new char[rows.length][];
        for (int i = 0; i < rows.length; i++) grid[i] = rows[i].toCharArray();
        System.out.println(numIslands(grid));
    }
}
