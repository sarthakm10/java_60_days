// @title Spiral Matrix (shrink four borders)
// @leetcode spiral-matrix
// @expect [1, 2, 3, 6, 9, 8, 7, 4, 5]
// @start spiralOrder
import java.util.ArrayList;
import java.util.List;

public class SpiralMatrix {
    public static List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> order = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) order.add(matrix[top][c]);        // along the top, left to right
            top++;
            for (int r = top; r <= bottom; r++) order.add(matrix[r][right]);      // down the right side
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) order.add(matrix[bottom][c]); // along the bottom, right to left
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) order.add(matrix[r][left]);   // up the left side
                left++;
            }
        }
        return order;
    }

    public static void main(String[] args) {
        int[][] matrix = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        System.out.println(spiralOrder(matrix));
    }
}
