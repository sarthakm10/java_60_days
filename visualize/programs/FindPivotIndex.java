// @title Find Pivot Index (prefix sum: left side vs right side)
// @leetcode find-pivot-index
// @expect 3
// @start pivotIndex
// @pointers nums: i
// @window nums: 0 i-1
public class FindPivotIndex {
    public static int pivotIndex(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        int leftSum = 0;                                  // sum of everything left of i
        for (int i = 0; i < nums.length; i++) {
            int rightSum = total - leftSum - nums[i];
            if (leftSum == rightSum) return i;
            leftSum += nums[i];
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] nums = {1, 7, 3, 6, 5, 6};
        System.out.println(pivotIndex(nums));
    }
}
