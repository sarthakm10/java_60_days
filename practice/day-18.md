Phase 2 wraps up with trees — the structure behind `TreeMap`, `TreeSet` and database indexes — and a capstone that combines collections with concurrency: a thread-safe LRU cache.

<!-- exercise: d18_e1 | Medium | Build a binary search tree -->
**Concepts:** BST invariant (left < node < right) · recursive insert / search · in-order traversal gives sorted order · min / max · height · delete with 0, 1 or 2 children (in-order successor) · validating a BST with min/max bounds

**Task.** Implement `IntBst` with `insert`, `contains`, `inorder`, `min`, `max`, `height` (number of levels), `delete` and `root`. Then write `isValidBst(node)` and test it on a tree that *looks* fine locally but breaks the invariant deeper down.

**Starter code** · `BstDemo.java`

```java
import java.util.ArrayList;
import java.util.List;

public class BstDemo {
    public static void main(String[] args) {
        IntBst bst = new IntBst();
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80, 35, 45}) bst.insert(v);
        System.out.println("inorder: " + bst.inorder());
        System.out.println("contains 45: " + bst.contains(45) + ", contains 55: " + bst.contains(55));
        System.out.println("min " + bst.min() + ", max " + bst.max() + ", height " + bst.height());

        bst.delete(20);   // leaf
        bst.delete(30);   // now has one child
        bst.delete(50);   // root with two children
        System.out.println("after deletes: " + bst.inorder() + " root=" + bst.root().val + " height=" + bst.height());
        System.out.println("valid BST: " + IntBst.isValidBst(bst.root()));

        Node bad = new Node(10);
        bad.left = new Node(5);
        bad.right = new Node(15);
        bad.right.left = new Node(6);    // 6 < 10 but sits in the right subtree
        System.out.println("hand-built tree valid: " + IntBst.isValidBst(bad));
    }
}

class Node {
    int val;
    Node left, right;
    Node(int val) { this.val = val; }
}

class IntBst {
    private Node root;

    Node root() { return root; }
    void insert(int v) { }                         // TODO
    boolean contains(int v) { return false; }      // TODO
    List<Integer> inorder() { return new ArrayList<>(); }   // TODO
    int min() { return 0; }                        // TODO
    int max() { return 0; }                        // TODO
    int height() { return 0; }                     // TODO: levels; empty tree = 0
    void delete(int v) { }                         // TODO

    static boolean isValidBst(Node n) { return false; }    // TODO: pass down (min, max) bounds
}
```

**Expected output**

```text
inorder: [20, 30, 35, 40, 45, 50, 60, 70, 80]
contains 45: true, contains 55: false
min 20, max 80, height 4
after deletes: [35, 40, 45, 60, 70, 80] root=60 height=3
valid BST: true
hand-built tree valid: false
```

<!-- hints -->
- Recursive insert: `node = insert(node, v)` returning the (possibly new) subtree root keeps the code short: `if (n == null) return new Node(v); if (v < n.val) n.left = insert(n.left, v); else if (v > n.val) n.right = insert(n.right, v); return n;`
- Delete with two children: copy the **in-order successor** (minimum of the right subtree) into the node, then delete that successor from the right subtree.
- Height: `1 + max(height(left), height(right))`, with `null` → 0.
- Validation: checking only `left.val < node.val < right.val` misses the hand-built case. Pass bounds down: everything in the right subtree must be `> node.val`. Use `long` (or `Integer` with null) bounds so `Integer.MIN_VALUE` values still work.
- Operations are O(h): O(log n) when balanced, O(n) when you insert sorted data (a "linked list" tree). That's why `TreeMap` uses a self-balancing red-black tree.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

public class BstDemo {
    public static void main(String[] args) {
        IntBst bst = new IntBst();
        for (int v : new int[]{50, 30, 70, 20, 40, 60, 80, 35, 45}) bst.insert(v);
        System.out.println("inorder: " + bst.inorder());
        System.out.println("contains 45: " + bst.contains(45) + ", contains 55: " + bst.contains(55));
        System.out.println("min " + bst.min() + ", max " + bst.max() + ", height " + bst.height());

        bst.delete(20);
        bst.delete(30);
        bst.delete(50);
        System.out.println("after deletes: " + bst.inorder() + " root=" + bst.root().val + " height=" + bst.height());
        System.out.println("valid BST: " + IntBst.isValidBst(bst.root()));

        Node bad = new Node(10);
        bad.left = new Node(5);
        bad.right = new Node(15);
        bad.right.left = new Node(6);
        System.out.println("hand-built tree valid: " + IntBst.isValidBst(bad));
    }
}

class Node {
    int val;
    Node left, right;
    Node(int val) { this.val = val; }
}

class IntBst {
    private Node root;

    Node root() { return root; }

    void insert(int v) { root = insert(root, v); }

    private Node insert(Node n, int v) {
        if (n == null) return new Node(v);
        if (v < n.val) n.left = insert(n.left, v);
        else if (v > n.val) n.right = insert(n.right, v);   // duplicates ignored
        return n;
    }

    boolean contains(int v) {
        Node n = root;
        while (n != null) {
            if (v == n.val) return true;
            n = v < n.val ? n.left : n.right;                  // discard half the tree each step
        }
        return false;
    }

    List<Integer> inorder() {
        List<Integer> out = new ArrayList<>();
        inorder(root, out);
        return out;
    }

    private void inorder(Node n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);                                        // left, node, right → sorted
        inorder(n.right, out);
    }

    int min() { Node n = root; while (n.left != null) n = n.left; return n.val; }
    int max() { Node n = root; while (n.right != null) n = n.right; return n.val; }

    int height() { return height(root); }

    private int height(Node n) { return n == null ? 0 : 1 + Math.max(height(n.left), height(n.right)); }

    void delete(int v) { root = delete(root, v); }

    private Node delete(Node n, int v) {
        if (n == null) return null;
        if (v < n.val) n.left = delete(n.left, v);
        else if (v > n.val) n.right = delete(n.right, v);
        else {
            if (n.left == null) return n.right;                // 0 or 1 child
            if (n.right == null) return n.left;
            Node succ = n.right;                               // 2 children: in-order successor
            while (succ.left != null) succ = succ.left;
            n.val = succ.val;
            n.right = delete(n.right, succ.val);
        }
        return n;
    }

    static boolean isValidBst(Node n) { return valid(n, Long.MIN_VALUE, Long.MAX_VALUE); }

    private static boolean valid(Node n, long low, long high) {
        if (n == null) return true;
        if (n.val <= low || n.val >= high) return false;       // must fit the bounds from ALL ancestors
        return valid(n.left, low, n.val) && valid(n.right, n.val, high);
    }
}
```

**Connect it to Java and databases.** `TreeMap`/`TreeSet` are red-black trees: they rebalance with rotations so height stays ≤ 2·log₂(n+1). Database indexes use **B-trees** (Day 53) — many keys per node, so a tree with millions of rows is only 3–4 levels deep and each level is one disk page.

<!-- exercise: d18_e2 | Medium | Tree traversals: iterative and level by level -->
**Concepts:** pre-order / in-order / post-order · iterative traversal with an explicit `ArrayDeque` stack · level-order BFS with a queue and level size · zigzag order · right-side view · building a tree from a level-order array with nulls

**Task.** Build the tree `[1, 2, 3, 4, 5, null, 6]` (LeetCode's level-order format) and implement:

1. Pre-, in- and post-order **iteratively** (no recursion).
2. Level-order grouped by level (LeetCode 102), zigzag (103) and right-side view (199).

```text
        1
       / \
      2   3
     / \   \
    4   5   6
```

**Starter code** · `Traversals.java`

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;

public class Traversals {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    public static void main(String[] args) {
        TreeNode root = build(new Integer[]{1, 2, 3, 4, 5, null, 6});
        System.out.println("preorder:  " + preorder(root));
        System.out.println("inorder:   " + inorder(root));
        System.out.println("postorder: " + postorder(root));
        System.out.println("levels:    " + levels(root));
        System.out.println("zigzag:    " + zigzag(root));
        System.out.println("right view: " + rightView(root));
    }

    static TreeNode build(Integer[] values) {
        return null; // TODO: queue of parents; attach children left to right, skipping nulls
    }

    static List<Integer> preorder(TreeNode root) { return List.of(); }        // TODO: stack
    static List<Integer> inorder(TreeNode root) { return List.of(); }         // TODO: stack + pointer
    static List<Integer> postorder(TreeNode root) { return List.of(); }       // TODO
    static List<List<Integer>> levels(TreeNode root) { return List.of(); }    // TODO: queue
    static List<List<Integer>> zigzag(TreeNode root) { return List.of(); }    // TODO
    static List<Integer> rightView(TreeNode root) { return List.of(); }       // TODO
}
```

**Expected output**

```text
preorder:  [1, 2, 4, 5, 3, 6]
inorder:   [4, 2, 5, 1, 3, 6]
postorder: [4, 5, 2, 6, 3, 1]
levels:    [[1], [2, 3], [4, 5, 6]]
zigzag:    [[1], [3, 2], [4, 5, 6]]
right view: [1, 3, 6]
```

<!-- hints -->
- Pre-order with a stack: pop a node, record it, push **right then left** (so left is processed first).
- In-order: go left as far as possible pushing nodes; pop, record, then move to the popped node's right child.
- Post-order trick: do a "root, right, left" pre-order and **reverse** the result — that gives "left, right, root".
- Level order: `for (int size = q.size(); size > 0; size--)` processes exactly one level per outer loop.
- Zigzag: build each level normally, then reverse every second level. Right view: the **last** node of each level.

<!-- solution -->
```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;

public class Traversals {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    public static void main(String[] args) {
        TreeNode root = build(new Integer[]{1, 2, 3, 4, 5, null, 6});
        System.out.println("preorder:  " + preorder(root));
        System.out.println("inorder:   " + inorder(root));
        System.out.println("postorder: " + postorder(root));
        System.out.println("levels:    " + levels(root));
        System.out.println("zigzag:    " + zigzag(root));
        System.out.println("right view: " + rightView(root));
    }

    static TreeNode build(Integer[] values) {
        if (values.length == 0 || values[0] == null) return null;
        TreeNode root = new TreeNode(values[0]);
        Deque<TreeNode> parents = new ArrayDeque<>();
        parents.offer(root);
        int i = 1;
        while (i < values.length) {
            TreeNode p = parents.poll();
            if (values[i] != null) { p.left = new TreeNode(values[i]); parents.offer(p.left); }
            i++;
            if (i < values.length && values[i] != null) { p.right = new TreeNode(values[i]); parents.offer(p.right); }
            i++;
        }
        return root;
    }

    static List<Integer> preorder(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        if (root != null) stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode n = stack.pop();
            out.add(n.val);
            if (n.right != null) stack.push(n.right);            // right first → left is popped first
            if (n.left != null) stack.push(n.left);
        }
        return out;
    }

    static List<Integer> inorder(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (cur != null || !stack.isEmpty()) {
            while (cur != null) { stack.push(cur); cur = cur.left; }   // go all the way left
            cur = stack.pop();
            out.add(cur.val);
            cur = cur.right;
        }
        return out;
    }

    static List<Integer> postorder(TreeNode root) {
        LinkedList<Integer> out = new LinkedList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        if (root != null) stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode n = stack.pop();
            out.addFirst(n.val);                                 // root-right-left, built backwards
            if (n.left != null) stack.push(n.left);
            if (n.right != null) stack.push(n.right);
        }
        return out;
    }

    static List<List<Integer>> levels(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        Deque<TreeNode> q = new ArrayDeque<>();
        if (root != null) q.offer(root);
        while (!q.isEmpty()) {
            List<Integer> level = new ArrayList<>();
            for (int size = q.size(); size > 0; size--) {        // exactly one level
                TreeNode n = q.poll();
                level.add(n.val);
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
            out.add(level);
        }
        return out;
    }

    static List<List<Integer>> zigzag(TreeNode root) {
        List<List<Integer>> out = levels(root);
        for (int i = 1; i < out.size(); i += 2) Collections.reverse(out.get(i));
        return out;
    }

    static List<Integer> rightView(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        for (List<Integer> level : levels(root)) out.add(level.get(level.size() - 1));
        return out;
    }
}
```

**Choosing a traversal.** In-order — sorted output of a BST, validate a BST, k-th smallest. Pre-order — copy/serialise a tree. Post-order — delete a tree or compute something from the children first (height, diameter, max path sum). Level-order — shortest depth, views, anything "per level". Iterative versions matter when trees can be deep enough to overflow the call stack.

<!-- exercise: d18_e3 | Hard | Capstone: a thread-safe LRU cache -->
**Concepts:** `LinkedHashMap` access order **mutates on `get`** · why a `ReadWriteLock` read lock is **not** enough here · `ReentrantLock` guarding compound operations · `getOrLoad` (cache-aside) without double-loading · hit/miss counters with `LongAdder` · invariants checked under concurrency

**Task.** Build `SafeLruCache<K, V>` that many threads can share:

1. Wrap an access-ordered `LinkedHashMap` (capacity-bounded via `removeEldestEntry`) and guard **every** method with one `ReentrantLock`.
2. `V getOrLoad(K key, Function<K, V> loader)` returns the cached value or loads, stores and returns it — **atomically**, so a key is never loaded twice concurrently.
3. Track hits and misses with `LongAdder`s.
4. Hammer it from 8 threads × 20,000 operations over 200 keys with capacity 100, then verify the invariants. Finally insert 100 fresh keys from one thread and check the size and eviction.

**Starter code** · `SafeLruDemo.java`

```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;

public class SafeLruDemo {
    public static void main(String[] args) throws InterruptedException {
        SafeLruCache<Integer, String> cache = new SafeLruCache<>(100);
        AtomicInteger loads = new AtomicInteger();
        AtomicBoolean oversized = new AtomicBoolean(false);
        int threads = 8, opsPerThread = 20_000;

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                for (int i = 0; i < opsPerThread; i++) {
                    int key = ThreadLocalRandom.current().nextInt(200);
                    cache.getOrLoad(key, k -> { loads.incrementAndGet(); return "v" + k; });
                    if (cache.size() > 100) oversized.set(true);
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);

        long total = (long) threads * opsPerThread;
        System.out.println("hits + misses == total ops: " + (cache.hits() + cache.misses() == total));
        System.out.println("loads == misses: " + (loads.get() == cache.misses()));
        System.out.println("size ever above capacity: " + oversized.get());

        for (int k = 1000; k < 1100; k++) cache.getOrLoad(k, x -> "fresh" + x);
        System.out.println("size after 100 fresh keys: " + cache.size());
        System.out.println("old key 5 evicted: " + !cache.containsKey(5) + ", key 1099 present: " + cache.containsKey(1099));
    }
}

class SafeLruCache<K, V> {
    // TODO: ReentrantLock, LinkedHashMap with accessOrder + removeEldestEntry, LongAdder hits/misses

    SafeLruCache(int capacity) { }

    V getOrLoad(K key, Function<K, V> loader) { return loader.apply(key); }   // TODO: atomic check-then-load
    boolean containsKey(K key) { return false; }                              // TODO
    int size() { return 0; }                                                  // TODO
    long hits() { return 0; }                                                 // TODO
    long misses() { return 0; }                                               // TODO
}
```

**Expected output**

```text
hits + misses == total ops: true
loads == misses: true
size ever above capacity: false
size after 100 fresh keys: 100
old key 5 evicted: true, key 1099 present: true
```

<!-- hints -->
- With `accessOrder = true`, `LinkedHashMap.get` **relinks** the entry to the end — it's a write. Two threads in a `ReadWriteLock` read section could corrupt the linked list, so every method needs the exclusive lock.
- `lock.lock(); try { … } finally { lock.unlock(); }` — always unlock in `finally`.
- `getOrLoad` must check and insert under the **same** lock acquisition; otherwise two threads can both miss and both load (a "cache stampede").
- Holding the lock while loading keeps it simple but serialises slow loads. 🚀 Production caches (Caffeine, `ConcurrentHashMap.computeIfAbsent`) lock per key instead.
- Use `containsKey` (not `get`) in the final check — `containsKey` doesn't count as an access, so it doesn't reorder entries.

<!-- solution -->
```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;

public class SafeLruDemo {
    public static void main(String[] args) throws InterruptedException {
        SafeLruCache<Integer, String> cache = new SafeLruCache<>(100);
        AtomicInteger loads = new AtomicInteger();
        AtomicBoolean oversized = new AtomicBoolean(false);
        int threads = 8, opsPerThread = 20_000;

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                for (int i = 0; i < opsPerThread; i++) {
                    int key = ThreadLocalRandom.current().nextInt(200);
                    cache.getOrLoad(key, k -> { loads.incrementAndGet(); return "v" + k; });
                    if (cache.size() > 100) oversized.set(true);
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);

        long total = (long) threads * opsPerThread;
        System.out.println("hits + misses == total ops: " + (cache.hits() + cache.misses() == total));
        System.out.println("loads == misses: " + (loads.get() == cache.misses()));
        System.out.println("size ever above capacity: " + oversized.get());

        for (int k = 1000; k < 1100; k++) cache.getOrLoad(k, x -> "fresh" + x);
        System.out.println("size after 100 fresh keys: " + cache.size());
        System.out.println("old key 5 evicted: " + !cache.containsKey(5) + ", key 1099 present: " + cache.containsKey(1099));
    }
}

class SafeLruCache<K, V> {
    private final ReentrantLock lock = new ReentrantLock();
    private final LongAdder hits = new LongAdder(), misses = new LongAdder();
    private final Map<K, V> map;

    SafeLruCache(int capacity) {
        this.map = new LinkedHashMap<>(16, 0.75f, true) {           // access order: get() reorders!
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    V getOrLoad(K key, Function<K, V> loader) {
        lock.lock();                                                 // exclusive: even reads mutate order
        try {
            V value = map.get(key);
            if (value != null) {
                hits.increment();
                return value;
            }
            misses.increment();
            value = loader.apply(key);                               // load under the same lock → no double load
            map.put(key, value);
            return value;
        } finally {
            lock.unlock();
        }
    }

    boolean containsKey(K key) {
        lock.lock();
        try { return map.containsKey(key); } finally { lock.unlock(); }
    }

    int size() {
        lock.lock();
        try { return map.size(); } finally { lock.unlock(); }
    }

    long hits() { return hits.sum(); }
    long misses() { return misses.sum(); }
}
```

**Phase 2 in one paragraph.** You've now built `ArrayList`, a deque, `HashMap`, two LRU caches, a BST and a thread-safe cache, and you've used every major collection the way production code does. In interviews, mention the trade-offs you saw first-hand: amortised resizing, hash spreading and treeification, fail-fast iterators, comparator consistency, and why a "read" can be a write (access-ordered maps). For real services reach for **Caffeine** — it's concurrent, bounded, supports expiry and has a better eviction policy (W-TinyLFU).
