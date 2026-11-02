# Day 32 — Collections Utilities and Common Patterns

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** use the ready-made helpers in `Collections` and `List`/`Set`/`Map`, and recognise which collection solves which kind of problem.

<!-- topic: b32_t1 -->
## ☕ Collections — Utilities & Patterns

<!-- intro: d16_t1_s1 -->
`Collections.sort(list)` (or `list.sort(...)`) sorts a list in place, using the elements' natural order or a comparator you pass in (Day 20). It's **stable**: elements that compare equal keep their original order, which matters when you sort by one field after another.

<!-- intro: d16_t1_s2 -->
`Collections.binarySearch(list, key)` finds a key in a **sorted** list in O(log n) (Day 15's idea, ready-made). If the list isn't sorted, the answer is meaningless. When the key isn't there, it returns a negative number that also tells you where the key **would** go.

<!-- intro: d16_t1_s3 -->
`List.of(...)`, `Set.of(...)` and `Map.of(...)` create small collections that can **never change**: adding or removing throws an exception, and they don't allow `null`. They're perfect for fixed data like a list of weekdays, and safe to share anywhere.

<!-- intro: d16_t1_s4 -->
`Collections.unmodifiableList(list)` gives a **read-only view**: nobody can change the list *through the view*, but if the original list changes, the view shows the change. `List.copyOf(list)` makes a real, independent, unchangeable **copy**. When a class hands out its internal list (Day 20's immutable classes), `copyOf` is the safe choice.

<!-- intro: d16_t1_s6 -->
Quick trick: `set.add(x)` returns `false` when `x` was already there. So "find the duplicates" is one loop over the list, adding each item to a `HashSet` and noting the ones where `add` returned `false`: O(n) instead of comparing every pair.

<!-- intro: d16_t1_s7 -->
Maps are organised by key, so how do you list entries **by value** (say, words by how often they appear)? Put the entries in a list and sort it by value (`Map.Entry.comparingByValue()`), or use a stream (Day 36) and collect into a `LinkedHashMap` to keep that order.

<!-- intro: d16_t1_s8 -->
To find the items two lists have in common, don't loop over one list inside a loop over the other (O(n × m)). Put one list into a `HashSet` first, then check each item of the other list with `contains`: O(n + m). Same idea as Two Sum: a set turns "search again" into "look up instantly".

<!-- intro: d17_t1_s6 -->
A cheat sheet of which collection solves which interview problem: `HashMap` for counting and lookups, `HashSet` for "seen before?", `TreeMap` for sorted ranges and "nearest", `PriorityQueue` for "top K" and scheduling, `ArrayDeque` for stacks and BFS queues, `LinkedHashMap` for LRU caches. Learning these pairings is half of solving coding problems.

<!-- topic: b32_t2 -->
## 🧮 DSA — Heaps / Priority Queues

A **heap** is the structure inside `PriorityQueue` (Day 30): a tree stored in an array where every parent is smaller than its children, so the smallest is always on top. The star pattern is **top K**: to find the K largest numbers, keep a min-heap of size K; whenever it grows past K, remove the smallest. What's left are the K largest, in O(n log K). Merging K sorted lists uses a heap to always pick the smallest current head.

## 📝 Day 32 Recap

1. What does stable sorting mean? → **equal elements keep their original relative order**
2. What must be true before Collections.binarySearch? → **the list must be sorted**
3. Can you add to a List.of(...) list? → **no, it's unmodifiable (and rejects null)**
4. unmodifiableList vs List.copyOf? → **a read-only view of the original vs an independent unchangeable copy**
5. Find duplicates in O(n)? → **add to a HashSet; add returning false means a duplicate**
6. Sort map entries by value? → **sort the entries with Map.Entry.comparingByValue()**
7. Intersection of two lists in O(n + m)? → **put one in a HashSet, then check the other's items with contains**
8. Collection for "top K"? → **PriorityQueue (a heap)**
9. Collection for "nearest key below x"? → **TreeMap (floorKey)**
10. Top K largest with a heap? → **keep a min-heap of size K, removing the smallest when it grows past K**
