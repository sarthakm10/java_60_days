# Day 35 — Streams, Part 1: Filter, Map and Collect

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** process collections with streams: describe *what* you want (keep these, change those, collect the result) instead of writing the loop yourself.

<!-- topic: b35_t1 -->
## ☕ Java — Stream Basics

<!-- intro: d5_t1_s1 -->
A **stream** is a pipeline your data flows through, like an assembly line. Compare the loop and the stream for "the names of students who passed, in capitals":

```java
// loop: you manage everything
List<String> passed = new ArrayList<>();
for (Student s : students) {
    if (s.getMarks() >= 40) {
        passed.add(s.getName().toUpperCase());
    }
}

// stream: you describe the steps
List<String> passed = students.stream()
        .filter(s -> s.getMarks() >= 40)     // keep only those who passed
        .map(s -> s.getName().toUpperCase()) // turn each into their name in capitals
        .toList();                           // collect the result
```

Every stream has three parts: a **source** (`students.stream()`), any number of **intermediate steps** (`filter`, `map`…) and one **terminal step** that produces the result (`toList`, `count`…). Streams are **lazy**: nothing runs until the terminal step asks for results. And a stream doesn't change the original list.

<!-- intro: d5_t1_s2 -->
The everyday intermediate steps: `filter` (keep items that pass a test), `map` (turn each item into something else), `sorted` (sort, optionally with a comparator), `distinct` (drop duplicates), `limit(n)` / `skip(n)` (take or skip the first n), and `peek` (look at items as they pass, for debugging). Each one returns a new stream, which is why you can chain them.

<!-- intro: d5_t1_s3 -->
Terminal steps finish the pipeline: `toList()` / `collect(...)` (gather into a collection), `count()`, `forEach(...)` (do something with each), `min` / `max` (with a comparator), `reduce` (combine everything into one value, Day 36) and `toArray()`. After a terminal step the stream is used up; make a new one to go again.

<!-- intro: d5_t1_s4 -->
`collect` with a **Collector** decides what shape the result takes: `Collectors.toList()` / `toSet()`, `toMap(keyFn, valueFn)` (build a map), `joining(", ")` (glue Strings together, much tidier than a loop with commas) and `counting()`. Tomorrow's grouping collectors build on these.

<!-- intro: d5_t1_s9 -->
Some terminal steps stop as soon as they know the answer: `anyMatch` ("is there at least one?"), `allMatch`, `noneMatch` and `findFirst`. On a big list, `anyMatch(s -> s.getMarks() == 100)` stops at the first 100 instead of checking everyone.

<!-- topic: b35_t2 -->
## 🧮 DSA — Graphs: Medium

Yesterday's BFS and DFS, put to work. **Multi-source BFS** starts the queue with several points at once (all rotten oranges spread together). **Topological sort** orders tasks so every task comes after the ones it depends on ("take Java before Spring"): repeatedly take a task with no remaining prerequisites, using a queue and a count of incoming edges. If some tasks never become free, there's a cycle and no valid order exists. Clone Graph uses a `HashMap` from old node to new node as its visited set.

## 📝 Day 35 Recap

1. Three parts of a stream pipeline? → **a source, intermediate steps, one terminal step**
2. What does filter do? → **keeps only items that pass a test**
3. What does map do? → **turns each item into something else**
4. When does a stream actually run? → **only when the terminal step is called (streams are lazy)**
5. Does a stream change the original list? → **no**
6. Join Strings with a separator? → **collect(Collectors.joining(", "))**
7. Can you reuse a stream after a terminal step? → **no, create a new one**
8. Check if any element matches, stopping early? → **anyMatch(...)**
9. What is multi-source BFS? → **BFS started from several points at once**
10. What does topological sort produce? → **an order where every task comes after its prerequisites**
