// @title Two Sum II — sorted array (two pointers)
// @leetcode two-sum-ii-input-array-is-sorted
// @expect [1, 2]
// @start twoSum
// @pointers numbers: left right
import java.util.Arrays;

public class TwoSumSorted {
    public static int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) return new int[]{left + 1, right + 1};   // 1-indexed
            if (sum < target) left++;       // need a bigger sum
            else right--;                   // need a smaller sum
        }
        return new int[]{-1, -1};
    }

    public static void main(String[] args) {
        int[] numbers = {2, 7, 11, 15};
        System.out.println(Arrays.toString(twoSum(numbers, 9)));
    }
}
