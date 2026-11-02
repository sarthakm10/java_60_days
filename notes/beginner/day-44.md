# Day 44 — Reflection, Annotations and Core Java Review

> The last day of core Java. The first half explains the "magic" Spring relies on; the second half checks what has stuck from Phases 3–5.

**Today's goal:** understand how code can inspect and change other code at run time (reflection), what annotations really are, and how proxies work, then review the core Java you now know.

<!-- topic: b44_t1 -->
## ☕ Java — Reflection & Annotations

<!-- intro: d10_t4_s1 -->
**Reflection** lets a program look at classes **while it's running**: list a class's fields and methods, read and set fields (even private ones), call methods by name, create objects. Normal code never needs it, but it's how frameworks work: when Spring (Day 52) creates your objects and fills in their fields, or a library turns a JSON field `"name"` into a call to `setName`, that's reflection. It's slower than normal calls and skips the compiler's checks, so frameworks use it and you mostly don't.

<!-- intro: d10_t4_s2 -->
An **annotation** is a label starting with `@` that you attach to code: `@Override` (Day 17) and `@FunctionalInterface` (Day 34) are read by the compiler. You can write your own, and with `@Retention(RUNTIME)` they're kept for reflection to read while the program runs. Spring is built on this: `@Component`, `@Autowired` and `@GetMapping` (Days 52–55) are annotations that Spring finds with reflection and acts on.

<!-- intro: d10_t4_s3 -->
A **proxy** is a stand-in object that looks exactly like the real one (same interface) but runs extra code before and after passing each call on, like a receptionist who logs every visitor before sending them through. Java can build proxies at run time. Spring uses them for `@Transactional` (Day 60) and other "add this behaviour to every method" features.

<!-- topic: b44_t2 -->
## ☕ Java — Core Java Review

<!-- intro: d10_t1_s8 -->
Without notes, explain out loud: the four OOP pillars (Day 23), a lambda and a stream pipeline (Days 34–35), and why `count++` isn't thread-safe and two ways to fix it (Days 39 and 41). Then check yourself with the flashcards on the **Revise** page.

<!-- intro: d18_t1_s2 -->
Compare out loud: `ConcurrentHashMap` (lets threads work on different buckets at once, atomic `merge`/`compute`) versus `Collections.synchronizedMap` (one lock around every call, so only one thread at a time).

<!-- intro: d18_t1_s5 -->
Explain two queue patterns: a `PriorityQueue` (min-heap of size K) for the top K items (Day 32), and a `BlockingQueue` between producer and consumer threads (Day 42).

<!-- intro: d18_t4_s1 -->
Explain the JVM's memory in a minute (Day 43): stacks per thread with frames and references, one shared heap for objects split into young and old, class loading on first use, and garbage collection of unreachable objects.

<!-- topic: b44_t3 -->
## 🧮 DSA — N-Queens & Hard Backtracking

Day 26's backtracking (choose → explore → unchoose) on harder puzzles. N-Queens places queens row by row and backtracks whenever a queen would be attacked; keeping sets of used columns and diagonals makes each check instant. Word Search explores a grid letter by letter, marking cells as used and un-marking them on the way back. Generate Parentheses only adds a `)` when it can still be matched. Draw the decision tree for a tiny case first.

## 📝 Day 44 Recap

1. What is reflection? → **inspecting and using classes, fields and methods at run time**
2. Who mainly uses reflection? → **frameworks like Spring and JSON libraries**
3. Downsides of reflection? → **slower and bypasses compile-time checks**
4. What is an annotation? → **a label (@Something) attached to code, read by the compiler or at run time**
5. Retention needed to read an annotation at run time? → **@Retention(RetentionPolicy.RUNTIME)**
6. What is a proxy? → **a stand-in object that adds behaviour before and after passing calls to the real one**
7. Which Spring feature relies on proxies? → **@Transactional (and other cross-cutting features)**
8. ConcurrentHashMap vs synchronizedMap? → **finer-grained concurrency vs one lock for every call**
9. Data structure for top K? → **a min-heap (PriorityQueue) of size K**
10. Backtracking pattern? → **choose, explore, unchoose**
