// @title Number of Recent Calls (a queue of timestamps)
// @leetcode number-of-recent-calls
// @expect 1 2 3 3
// @start ping
import java.util.ArrayDeque;
import java.util.Queue;

public class RecentCounter {
    private final Queue<Integer> requests = new ArrayDeque<>();

    public int ping(int t) {
        requests.offer(t);
        while (requests.peek() < t - 3000) {      // drop calls older than 3000 ms
            requests.poll();
        }
        return requests.size();
    }

    public static void main(String[] args) {
        RecentCounter counter = new RecentCounter();
        int a = counter.ping(1);
        int b = counter.ping(100);
        int c = counter.ping(3001);
        int d = counter.ping(3002);
        System.out.println(a + " " + b + " " + c + " " + d);
    }
}
