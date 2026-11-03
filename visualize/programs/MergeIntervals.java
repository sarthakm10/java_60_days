// @title Merge Intervals (sort by start, then stretch or add)
// @leetcode merge-intervals
// @expect [[1, 6], [8, 10], [15, 18]]
// @start merge
// @hide lambdas
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MergeIntervals {
    public static int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));    // by start time
        List<int[]> merged = new ArrayList<>();
        for (int[] cur : intervals) {
            int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
            if (last != null && cur[0] <= last[1]) {
                last[1] = Math.max(last[1], cur[1]);       // overlaps the last one: stretch it
            } else {
                merged.add(new int[]{cur[0], cur[1]});     // a gap: start a new interval
            }
        }
        return merged.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        int[][] intervals = {{1, 3}, {2, 6}, {8, 10}, {15, 18}};
        System.out.println(Arrays.deepToString(merge(intervals)));
    }
}
