// @title Single Number (XOR cancels pairs)
// @leetcode single-number
// @expect 4
// @start singleNumber
public class SingleNumber {
    public static int singleNumber(int[] nums) {
        int result = 0;
        for (int x : nums) {
            result ^= x;          // a ^ a = 0 and a ^ 0 = a, so pairs cancel out
        }
        return result;
    }

    public static void main(String[] args) {
        int[] nums = {4, 1, 2, 1, 2};
        System.out.println(singleNumber(nums));
    }
}
