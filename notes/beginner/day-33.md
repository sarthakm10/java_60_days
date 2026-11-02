# Day 33 — Collections Review and Mini Project

> Review day. The whiteboard exercises below are exactly what interviewers ask, so practise them out loud. Then build the grade book.

**Today's goal:** explain collection internals from memory, and use lists and maps together in a small program.

<!-- topic: b33_t1 -->
## ☕ Collections — Review

<!-- intro: d18_t1_s1 -->
Draw it on paper without notes: a key arrives → `hashCode()` → bucket index → empty bucket (store it) or a collision (walk the bucket with `equals()`) → treeified if the bucket gets long → resize when 75% full. If you can draw this and talk through it in two minutes, you understand Days 27–28.

<!-- intro: d18_t1_s3 -->
Explain how a `LinkedHashMap` becomes an LRU cache (Day 31): access order, plus removing the eldest entry when the map is over capacity. Then today's DSA topic asks you to build the same cache by hand.

<!-- intro: d18_t1_s4 -->
Be ready to say when you'd pick each list: `ArrayList` almost always (fast reads, compact memory), `LinkedList` rarely (only adding/removing at the ends while iterating), and `CopyOnWriteArrayList` for lists that many threads read and rarely change (Day 41).

<!-- intro: d18_t1_s6 -->
Close the notes and answer fifteen quick questions from Days 24–32 aloud. The flashcards on the **Revise** page are built for this: pick the "Quick mix" deck, or decks for these days.

<!-- subtopic: b33_t1_s5 -->
### Mini project: a grade book

Build a small grade book that keeps every student's marks:

```java
Map<String, List<Integer>> marks = new LinkedHashMap<>();   // student → their marks, in insertion order
```

It should:

1. **Add a mark** for a student, creating their list the first time: `marks.computeIfAbsent(name, k -> new ArrayList<>()).add(mark);`
2. **Average** each student's marks (a loop over their list; careful with integer division, Day 3).
3. **Find the topper**: the student with the highest average.
4. **Print a report sorted by average**, highest first: put the names in a list and sort it with a comparator on the average.
5. **Count grades**: how many students got A, B, C… using a `TreeMap<String, Integer>` so the grades print in order.

This uses nearly everything from Phase 3: generics, `List`, `Map`, sorting with comparators and counting with `merge`. 👉 It's exercise 1 in **Code Practice** today, with a reference solution.

<details>
<summary>Why is a LinkedHashMap a good choice for the grade book?</summary>

It keeps students in the order they were added, so reports are predictable, while still giving O(1) lookups by name.
</details>

<!-- topic: b33_t2 -->
## 🧮 DSA — Design-based Problems

These problems ask you to **build** a data structure, combining collections you now know: an LRU cache from a `HashMap` plus a doubly linked list (the map finds a node instantly; the list keeps recency order), your own `HashMap` from an array of linked lists (exactly Day 28's buckets), and "insert, delete, get random, all in O(1)", which pairs an `ArrayList` with a `HashMap` of positions. Design questions are about choosing the right combination; say out loud what each part is for.

## 📝 Day 33 Recap

1. HashMap put in one line? → **hashCode → bucket index → store, or walk the bucket with equals → resize at 75% full**
2. LinkedHashMap as an LRU cache? → **access order + remove the eldest entry when over capacity**
3. Default list? → **ArrayList**
4. List for many readers and rare writers across threads? → **CopyOnWriteArrayList**
5. Create a student's mark list on first use? → **marks.computeIfAbsent(name, k -> new ArrayList<>()).add(mark)**
6. Average of a List<Integer> without integer division? → **(double) sum / list.size()**
7. Map that prints grade counts in order? → **TreeMap**
8. LRU cache by hand uses? → **a HashMap plus a doubly linked list**
9. Your own HashMap by hand uses? → **an array of buckets, each a linked list of entries**
10. O(1) insert, delete and getRandom? → **an ArrayList of values plus a HashMap from value to index**
