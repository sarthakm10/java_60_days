// @title Sort Colors (Dutch national flag: low / mid / high)
// @leetcode sort-colors
// @expect [0, 0, 1, 1, 2, 2]
// @start sortColors
// @hide swap
// @pointers nums: low mid high
import java.util.Arrays;

public class SortColors {
    public static void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) swap(nums, low++, mid++);         // 0s go to the front
            else if (nums[mid] == 2) swap(nums, mid, high--);     // 2s go to the back
            else mid++;                                           // 1s stay in the middle
        }
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    public static void main(String[] args) {
        int[] nums = {2, 0, 2, 1, 1, 0};
        sortColors(nums);
        System.out.println(Arrays.toString(nums));
    }
}
