// @title Running Sum of 1d Array (prefix sums in place)
// @leetcode running-sum-of-1d-array
// @expect [1, 3, 6, 10]
// @start runningSum
// @pointers nums: i
import java.util.Arrays;

public class RunningSum {
    public static int[] runningSum(int[] nums) {
        for (int i = 1; i < nums.length; i++) {
            nums[i] += nums[i - 1];      // each cell becomes the sum of everything up to it
        }
        return nums;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4};
        System.out.println(Arrays.toString(runningSum(nums)));
    }
}
