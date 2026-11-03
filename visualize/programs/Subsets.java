// @title Subsets (backtracking: choose, explore, un-choose)
// @leetcode subsets
// @expect [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
// @start subsets
// @pointers nums: start i
import java.util.ArrayList;
import java.util.List;

public class Subsets {
    public static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        result.add(new ArrayList<>(path));              // every path is a subset: save a copy
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);                          // choose nums[i]
            backtrack(nums, i + 1, path, result);       // explore with it
            path.remove(path.size() - 1);               // un-choose, try the next one
        }
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        System.out.println(subsets(nums));
    }
}
