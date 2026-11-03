// @title Maximum sum subarray of size K (fixed sliding window)
// @start maxSumOfK
// @pointers nums: right
// @window nums: right-k+1 right
public class MaxSumWindow {
    public static int maxSumOfK(int[] nums, int k) {
        if (k <= 0 || k > nums.length) throw new IllegalArgumentException("invalid k");
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];        // first window
        int best = windowSum;
        for (int right = k; right < nums.length; right++) {
            windowSum += nums[right] - nums[right - k];          // slide: add new, drop old
            best = Math.max(best, windowSum);
        }
        return best;
    }

    public static void main(String[] args) {
        int[] nums = {2, 1, 5, 1, 3, 2};
        System.out.println(maxSumOfK(nums, 3));
    }
}
