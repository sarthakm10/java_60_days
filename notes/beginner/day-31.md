# Day 31 — TreeMap, LRU Cache and Special Maps

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** use a sorted map for range questions, build a small cache that forgets old entries, and know the special-purpose maps exist.

<!-- topic: b31_t1 -->
## ☕ Collections — Sorted & Special Maps

<!-- intro: d13_t1_s8 -->
A `TreeMap` is a map that keeps its keys **sorted** (it's built on a balanced tree, hence O(log n)). Being sorted lets it answer questions a `HashMap` can't: "the price on or before 3 March" (`floorKey`), "the next booking after 2 pm" (`ceilingKey`), "all entries between 9 and 17" (`subMap`), and `firstKey()` / `lastKey()`. Reach for it whenever the question has "before", "after", "nearest" or "between" in it.

<!-- intro: d13_t1_s5 -->
A **cache** keeps recently used results so you don't recompute them, but it can't grow forever. An **LRU (least recently used) cache** throws away whatever hasn't been touched for the longest time when it's full, like a desk where you keep the papers you used most recently and file away the oldest. `LinkedHashMap` can do this almost by itself: create it in *access order* and override one method saying "remove the eldest entry when size > capacity". It's a top interview question, both this way and built by hand (Day 33).

<!-- intro: d13_t1_s7 -->
When your keys are values of an **enum** (Day 20), use `EnumMap`: it's simply an array indexed by the enum's position, so it's faster and smaller than a `HashMap`, and it loops in the enum's declared order.

<!-- intro: d13_t1_s6 -->
A `WeakHashMap` lets the garbage collector (Day 43) remove an entry once **nothing else** in the program uses its key. It's a niche tool for caches attached to objects; just recognise the name.

<!-- intro: d17_t1_s2 -->
`IdentityHashMap` compares keys with `==` (the same object) instead of `equals`. Another niche tool, used inside frameworks when walking through object graphs; you'll rarely need it.

<!-- intro: d17_t1_s1 -->
A `BitSet` stores a huge row of true/false flags packed as single bits, 64 per `long`, so a million flags take about 125 KB instead of a million `boolean`s. It's handy for problems like the Sieve of Eratosthenes (marking which numbers are prime).

<!-- topic: b31_t2 -->
## 🧮 DSA — Trees: Level Order & BST

Now that you have queues (Day 30), you can walk a tree **level by level** (breadth-first search, BFS): put the root in a queue, and repeatedly take one node out and add its children. A **binary search tree (BST)** keeps everything smaller on the left and larger on the right, which is exactly how `TreeMap` stays sorted, so searching it is like binary search (Day 15). An **in-order** traversal (left, node, right) of a BST visits the values in sorted order, which solves "validate a BST" and "kth smallest" neatly.

## 📝 Day 31 Recap

1. What does a TreeMap keep sorted? → **its keys**
2. Largest key ≤ x? → **floorKey(x)**
3. Smallest key ≥ x? → **ceilingKey(x)**
4. Cost of TreeMap get/put? → **O(log n)**
5. What does an LRU cache evict? → **the least recently used entry**
6. Which map class makes a quick LRU cache? → **LinkedHashMap in access order with removeEldestEntry**
7. Best map for enum keys? → **EnumMap**
8. IdentityHashMap compares keys with? → **== (the same object)**
9. How do you traverse a tree level by level? → **BFS with a queue**
10. In-order traversal of a BST gives? → **the values in sorted order**
