// @title Jump Game (greedy: how far can we reach?)
// @leetcode jump-game
// @expect true
// @start canJump
// @pointers nums: i reach
// @window nums: 0 reach
public class JumpGame {
    public static boolean canJump(int[] nums) {
        int reach = 0;                                // farthest index we can get to so far
        for (int i = 0; i < nums.length; i++) {
            if (i > reach) return false;              // i is out of reach: stuck
            reach = Math.max(reach, i + nums[i]);
        }
        return true;
    }

    public static void main(String[] args) {
        int[] nums = {2, 3, 1, 1, 4};
        System.out.println(canJump(nums));
    }
}
