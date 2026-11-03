// @title Move Zeroes (read and write pointers)
// @leetcode move-zeroes
// @expect [1, 3, 12, 0, 0]
// @start moveZeroes
// @pointers nums: write read
import java.util.Arrays;

public class MoveZeroes {
    public static void moveZeroes(int[] nums) {
        int write = 0;                                    // where the next non-zero goes
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                int tmp = nums[write];
                nums[write] = nums[read];
                nums[read] = tmp;
                write++;
            }
        }
    }

    public static void main(String[] args) {
        int[] nums = {0, 1, 0, 3, 12};
        moveZeroes(nums);
        System.out.println(Arrays.toString(nums));
    }
}
