Three queue types, three jobs: `ArrayDeque` for stacks and FIFO queues, `PriorityQueue` for "always give me the most important item", and `BlockingQueue` for handing work between threads. Today you'll use each one the way production code does.

<!-- exercise: d15_e1 | Easy | `ArrayDeque` as a stack and a queue -->
**Concepts:** `push`/`pop`/`peek` (stack) · `offer`/`poll` (queue) · throwing vs non-throwing method pairs (`add`/`offer`, `remove`/`poll`, `element`/`peek`) · why not `java.util.Stack`

**Task.**

1. `isBalanced(s)` — check brackets `()[]{}` with an `ArrayDeque` used as a stack.
2. `simplifyPath(path)` — LeetCode 71: turn `"/a/./b/../../c/"` into `"/c"` with a deque.
3. Show what each method pair does on an **empty** queue, and on a **full** bounded queue.

**Starter code** · `DequeBasics.java`

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Queue;
import java.util.concurrent.ArrayBlockingQueue;

public class DequeBasics {
    public static void main(String[] args) {
        for (String s : new String[]{"{[()]}", "([)]", "(("}) System.out.println(s + " balanced: " + isBalanced(s));
        for (String p : new String[]{"/a/./b/../../c/", "/home//foo/", "/../"}) System.out.println(p + " -> " + simplifyPath(p));

        Queue<String> empty = new ArrayDeque<>();
        System.out.println("poll: " + empty.poll() + ", peek: " + empty.peek());
        System.out.println("remove: " + attempt(empty::remove) + ", element: " + attempt(empty::element));

        Queue<String> full = new ArrayBlockingQueue<>(1);
        full.offer("only");
        System.out.println("offer when full: " + full.offer("more"));
        System.out.println("add when full: " + attempt(() -> full.add("more")));
    }

    static boolean isBalanced(String s) { return false; }     // TODO
    static String simplifyPath(String path) { return path; }  // TODO

    static String attempt(Runnable r) {
        try { r.run(); return "ok"; } catch (RuntimeException e) { return e.getClass().getSimpleName(); }
    }
}
```

**Expected output**

```text
{[()]} balanced: true
([)] balanced: false
(( balanced: false
/a/./b/../../c/ -> /c
/home//foo/ -> /home/foo
/../ -> /
poll: null, peek: null
remove: NoSuchElementException, element: NoSuchElementException
offer when full: false
add when full: IllegalStateException
```

<!-- hints -->
- Brackets: push every opener; on a closer, the stack must be non-empty and its top must be the matching opener. At the end the stack must be empty.
- Path: split on `"/"`; skip `""` and `"."`; `".."` pops (if not empty); anything else is pushed. Rebuild with `"/" + String.join("/", deque)` — iterate from the bottom using `addLast`/`pollLast` as the stack end.
- The non-throwing trio is **offer / poll / peek** (return `false`/`null`); the throwing trio is **add / remove / element**.
- `java.util.Stack` extends `Vector` — every method is synchronized and it allows random access. `ArrayDeque` is faster and is the recommended stack.

<!-- solution -->
```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Queue;
import java.util.concurrent.ArrayBlockingQueue;

public class DequeBasics {
    public static void main(String[] args) {
        for (String s : new String[]{"{[()]}", "([)]", "(("}) System.out.println(s + " balanced: " + isBalanced(s));
        for (String p : new String[]{"/a/./b/../../c/", "/home//foo/", "/../"}) System.out.println(p + " -> " + simplifyPath(p));

        Queue<String> empty = new ArrayDeque<>();
        System.out.println("poll: " + empty.poll() + ", peek: " + empty.peek());           // null, no exception
        System.out.println("remove: " + attempt(empty::remove) + ", element: " + attempt(empty::element));

        Queue<String> full = new ArrayBlockingQueue<>(1);
        full.offer("only");
        System.out.println("offer when full: " + full.offer("more"));                       // false
        System.out.println("add when full: " + attempt(() -> full.add("more")));            // throws
    }

    static boolean isBalanced(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '(', '[', '{' -> stack.push(c);
                case ')' -> { if (stack.isEmpty() || stack.pop() != '(') return false; }
                case ']' -> { if (stack.isEmpty() || stack.pop() != '[') return false; }
                case '}' -> { if (stack.isEmpty() || stack.pop() != '{') return false; }
                default -> { }
            }
        }
        return stack.isEmpty();                                   // leftover openers → unbalanced
    }

    static String simplifyPath(String path) {
        Deque<String> dirs = new ArrayDeque<>();
        for (String part : path.split("/")) {
            if (part.isEmpty() || part.equals(".")) continue;
            if (part.equals("..")) dirs.pollLast();               // go up (no-op at root)
            else dirs.addLast(part);
        }
        return "/" + String.join("/", dirs);                      // iterates first → last
    }

    static String attempt(Runnable r) {
        try { r.run(); return "ok"; } catch (RuntimeException e) { return e.getClass().getSimpleName(); }
    }
}
```

**Why `ArrayDeque` wins.** It's a circular array: `addFirst`/`addLast`/`pollFirst`/`pollLast` are all amortised O(1) with no node allocation, so it beats both `Stack` and `LinkedList`. It doesn't allow `null` elements (because `null` means "empty" from `poll`).

<!-- exercise: d15_e2 | Medium | `PriorityQueue`: task scheduling and top-K -->
**Concepts:** min-heap by default · custom `Comparator` with a FIFO tie-breaker · max-heap with `Collections.reverseOrder()` · k-th largest with a size-k min-heap · top-K frequent · `PriorityQueue` iteration is **not** sorted

**Task.**

1. Schedule tasks by priority (1 = most urgent); tasks with equal priority must come out in **arrival order**.
2. Pop numbers from a **max-heap**.
3. Find the 2nd largest of `[3, 2, 1, 5, 6, 4]` with a min-heap of size 2.
4. Find the 2 most frequent words.
5. Print a `PriorityQueue` directly and compare with polling — explain the difference.

**Starter code** · `PriorityQueueLab.java`

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class PriorityQueueLab {
    record Task(String name, int priority, long seq) { }

    public static void main(String[] args) {
        PriorityQueue<Task> tasks = new PriorityQueue<>();   // TODO: comparator — priority, then seq
        String[][] input = {{"email", "3"}, {"payment", "1"}, {"report", "3"}, {"alert", "1"}, {"cleanup", "5"}};
        long seq = 0;
        for (String[] t : input) tasks.offer(new Task(t[0], Integer.parseInt(t[1]), seq++));
        List<String> order = new ArrayList<>();
        // TODO: poll all tasks into order
        System.out.println("run order: " + order);

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>();   // TODO: max-heap
        maxHeap.addAll(List.of(5, 1, 4, 2, 3));
        List<Integer> popped = new ArrayList<>();
        while (!maxHeap.isEmpty()) popped.add(maxHeap.poll());
        System.out.println("max-heap pops: " + popped);

        System.out.println("2nd largest: " + kthLargest(new int[]{3, 2, 1, 5, 6, 4}, 2));
        System.out.println("top 2 words: " + topK(List.of("java", "kafka", "java", "spring", "kafka", "java"), 2));

        PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 4, 2, 3));
        System.out.println("printed pq: " + pq + " (heap array order, not sorted)");
    }

    static int kthLargest(int[] nums, int k) { return 0; }                    // TODO
    static List<String> topK(List<String> words, int k) { return List.of(); } // TODO
}
```

**Expected output**

```text
run order: [payment, alert, email, report, cleanup]
max-heap pops: [5, 4, 3, 2, 1]
2nd largest: 5
top 2 words: [java, kafka]
printed pq: [1, 2, 4, 5, 3] (heap array order, not sorted)
```

<!-- hints -->
- `Comparator.comparingInt(Task::priority).thenComparingLong(Task::seq)` — `PriorityQueue` is **not stable** on its own, so the sequence number is what guarantees FIFO among equal priorities.
- `new PriorityQueue<>(Collections.reverseOrder())` or `(a, b) -> b - a` (careful: subtraction can overflow for large ints — prefer `Integer.compare(b, a)`).
- k-th largest: `offer` each number into a min-heap and `poll` whenever size exceeds k; the head is the answer. O(n log k).
- Top-K frequent: count with a `HashMap`, keep a min-heap of size k ordered by count, then reverse the polled list.
- `toString()` and iteration walk the internal array, which is only *heap-ordered* (parent ≤ children). Only `poll()` gives sorted order.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class PriorityQueueLab {
    record Task(String name, int priority, long seq) { }

    public static void main(String[] args) {
        PriorityQueue<Task> tasks = new PriorityQueue<>(
                Comparator.comparingInt(Task::priority).thenComparingLong(Task::seq));   // FIFO among equals
        String[][] input = {{"email", "3"}, {"payment", "1"}, {"report", "3"}, {"alert", "1"}, {"cleanup", "5"}};
        long seq = 0;
        for (String[] t : input) tasks.offer(new Task(t[0], Integer.parseInt(t[1]), seq++));
        List<String> order = new ArrayList<>();
        while (!tasks.isEmpty()) order.add(tasks.poll().name());                    // O(log n) each
        System.out.println("run order: " + order);

        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        maxHeap.addAll(List.of(5, 1, 4, 2, 3));
        List<Integer> popped = new ArrayList<>();
        while (!maxHeap.isEmpty()) popped.add(maxHeap.poll());
        System.out.println("max-heap pops: " + popped);

        System.out.println("2nd largest: " + kthLargest(new int[]{3, 2, 1, 5, 6, 4}, 2));
        System.out.println("top 2 words: " + topK(List.of("java", "kafka", "java", "spring", "kafka", "java"), 2));

        PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 4, 2, 3));
        System.out.println("printed pq: " + pq + " (heap array order, not sorted)");
    }

    static int kthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int n : nums) {
            minHeap.offer(n);
            if (minHeap.size() > k) minHeap.poll();          // drop the smallest → keep the k largest
        }
        return minHeap.peek();
    }

    static List<String> topK(List<String> words, int k) {
        Map<String, Integer> freq = new HashMap<>();
        for (String w : words) freq.merge(w, 1, Integer::sum);
        PriorityQueue<Map.Entry<String, Integer>> heap = new PriorityQueue<>(
                Map.Entry.<String, Integer>comparingByValue().thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder())));
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            heap.offer(e);
            if (heap.size() > k) heap.poll();                // evict the least frequent
        }
        List<String> result = new ArrayList<>();
        while (!heap.isEmpty()) result.add(heap.poll().getKey());
        Collections.reverse(result);                         // most frequent first
        return result;
    }
}
```

**Complexities to quote:** `offer`/`poll` O(log n), `peek` O(1), `remove(Object)`/`contains` O(n), building from a collection O(n) (heapify). For a thread-safe version use `PriorityBlockingQueue`; for "run this at time T" use `DelayQueue` or a `ScheduledExecutorService`.

<!-- exercise: d15_e3 | Medium | Producer–consumer pipeline with `BlockingQueue` -->
**Concepts:** `LinkedBlockingQueue` with a capacity (back-pressure) · `put` blocks when full, `take` blocks when empty · one poison pill **per consumer** · `ConcurrentLinkedQueue` for lock-free results · no `wait`/`notify` needed

**Task.** Rebuild Day 8's producer–consumer with the JDK instead of hand-written `wait`/`notify`:

- One producer `put`s 1..100 into a `LinkedBlockingQueue` of capacity 5, then one poison pill (`-1`) **per consumer**.
- Three consumers `take` numbers, square them, and add the results to a `ConcurrentLinkedQueue`.
- Prove every number was processed exactly once and every consumer stopped.

**Starter code** · `BlockingPipeline.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;

public class BlockingPipeline {
    static final int POISON = -1, CONSUMERS = 3;

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(5);
        ConcurrentLinkedQueue<Long> results = new ConcurrentLinkedQueue<>();
        AtomicInteger finished = new AtomicInteger();

        Thread producer = new Thread(() -> {
            // TODO: put 1..100, then CONSUMERS poison pills
        });

        List<Thread> consumers = new ArrayList<>();
        for (int c = 0; c < CONSUMERS; c++) {
            consumers.add(new Thread(() -> {
                // TODO: take until POISON; add n*n to results; increment finished at the end
            }));
        }

        producer.start();
        consumers.forEach(Thread::start);
        producer.join();
        for (Thread t : consumers) t.join();

        System.out.println("processed: " + results.size());
        System.out.println("sum of squares: " + results.stream().mapToLong(Long::longValue).sum());
        System.out.println("consumers finished: " + finished.get() + "/" + CONSUMERS);
        System.out.println("queue empty: " + queue.isEmpty());
    }
}
```

**Expected output**

```text
processed: 100
sum of squares: 338350
consumers finished: 3/3
queue empty: true
```

<!-- hints -->
- `put` and `take` throw `InterruptedException` — catch it in the lambda and call `Thread.currentThread().interrupt()`.
- With N consumers you need N poison pills: each consumer stops after taking exactly one.
- The bounded queue gives **back-pressure**: a fast producer blocks on `put` instead of filling memory.
- Squares of numbers up to 100 fit in an `int`, but store `long` to be safe when you scale the input up.
- Sum of squares 1..n = n(n+1)(2n+1)/6 = 338,350 for n = 100.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;

public class BlockingPipeline {
    static final int POISON = -1, CONSUMERS = 3;

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(5);          // bounded → back-pressure
        ConcurrentLinkedQueue<Long> results = new ConcurrentLinkedQueue<>();   // lock-free (CAS)
        AtomicInteger finished = new AtomicInteger();

        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 100; i++) queue.put(i);                   // blocks while full
                for (int c = 0; c < CONSUMERS; c++) queue.put(POISON);         // one pill per consumer
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        List<Thread> consumers = new ArrayList<>();
        for (int c = 0; c < CONSUMERS; c++) {
            consumers.add(new Thread(() -> {
                try {
                    while (true) {
                        int n = queue.take();                                  // blocks while empty
                        if (n == POISON) break;
                        results.add((long) n * n);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    finished.incrementAndGet();
                }
            }));
        }

        producer.start();
        consumers.forEach(Thread::start);
        producer.join();
        for (Thread t : consumers) t.join();

        System.out.println("processed: " + results.size());
        System.out.println("sum of squares: " + results.stream().mapToLong(Long::longValue).sum());
        System.out.println("consumers finished: " + finished.get() + "/" + CONSUMERS);
        System.out.println("queue empty: " + queue.isEmpty());
    }
}
```

**This is a thread pool.** `ThreadPoolExecutor` is exactly this pattern: a `BlockingQueue<Runnable>` of tasks and worker threads looping on `take()`. Choosing `ArrayBlockingQueue` (bounded, one lock) vs `LinkedBlockingQueue` (optionally bounded, separate put/take locks) vs `SynchronousQueue` (no capacity — direct hand-off) is what distinguishes the `Executors` factory methods.
