// @title Kth Largest Element in an Array (a min-heap of size k)
// @leetcode kth-largest-element-in-an-array
// @expect 5
// @start findKthLargest
import java.util.PriorityQueue;

public class KthLargest {
    public static int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap: the k largest seen so far
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();                    // too many: drop the smallest
        }
        return heap.peek();                                      // the smallest of the k largest
    }

    public static void main(String[] args) {
        int[] nums = {3, 2, 1, 5, 6, 4};
        System.out.println(findKthLargest(nums, 2));
    }
}
