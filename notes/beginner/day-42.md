# Day 42 — Producer–Consumer, Parallel Streams and Virtual Threads

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** connect threads with blocking queues, know when parallel streams help (and hurt), and meet Java 21's virtual threads.

<!-- topic: b42_t1 -->
## ☕ Java — Advanced Concurrency

<!-- intro: d15_t1_s5 -->
A **`BlockingQueue`** is a queue (Day 30) that makes threads **wait** politely: `put` waits while the queue is full, and `take` waits while it's empty. That waiting is exactly what Day 39's `wait`/`notify` did by hand, now built in. `ArrayBlockingQueue` has a fixed size; `LinkedBlockingQueue` can be unbounded.

<!-- intro: d15_t1_s6 -->
The **producer–consumer** pattern: some threads produce work (orders arriving) and put it on a blocking queue; other threads take work off and process it (cooks). The queue sits between them, so producers never wait for a specific consumer, and a full queue naturally slows producers down. Thread pools (Day 40) work exactly like this inside.

<!-- intro: d15_t1_s7 -->
`ConcurrentLinkedQueue` is a thread-safe queue that never blocks (`poll` just returns `null` when empty), and `ConcurrentSkipListMap` is the thread-safe version of a sorted `TreeMap`. Recognise the names.

<!-- intro: d17_t1_s5 -->
`PriorityBlockingQueue` is a thread-safe priority queue whose `take` waits when empty, and `DelayQueue` only releases items once their delay has passed, which makes a simple task scheduler.

<!-- intro: d9_t1_s8 -->
Adding `.parallel()` to a stream (Day 35) splits the work across all CPU cores. It speeds up **big, CPU-heavy** jobs on large lists, but for small lists the setup costs more than it saves, and it gives wrong answers if your lambdas change shared variables. Measure before you use it.

<!-- intro: d9_t4_s2 -->
**Virtual threads** (Java 21) are extremely cheap threads managed by Java instead of the operating system. You can start a million of them. They make the simple "one thread per request" style scale for programs that spend most of their time waiting on databases and networks, without `CompletableFuture` chains: `Executors.newVirtualThreadPerTaskExecutor()`.

<!-- intro: d8_t4_s1 -->
The **Java Memory Model** is the official set of rules about when one thread is guaranteed to see another thread's writes, called "happens-before". Everything from Day 39 creates these guarantees: leaving a `synchronized` block, writing a `volatile` field, a thread finishing before your `join()` returns. It's the theory behind why those tools work. Read the start of the section, and leave the double-checked-locking details for a later pass.

<!-- topic: b42_t2 -->
## 🧮 DSA — Graphs: Advanced

**Union-Find** (disjoint sets) answers "are these two points connected?" almost instantly while edges are being added: each group has a leader, and joining two groups points one leader at the other. It detects cycles and counts connected groups. **Dijkstra's algorithm** finds the shortest path when roads have different lengths: like BFS, but with a priority queue (Day 30) that always explores the closest unvisited point next. **Word Ladder** is a plain BFS where the "neighbours" of a word are the words one letter away.

## 📝 Day 42 Recap

1. What does BlockingQueue.put do when the queue is full? → **waits until there is space**
2. What does take do when the queue is empty? → **waits until an item arrives**
3. Producer–consumer in one sentence? → **producers put work on a shared blocking queue and consumers take it off**
4. What does a non-blocking queue's poll return when empty? → **null**
5. What is DelayQueue for? → **releasing items only after their delay expires (scheduling)**
6. When can a parallel stream make things slower? → **small inputs or light work, where splitting costs more than it saves**
7. Danger with parallel streams? → **lambdas that modify shared state give wrong results**
8. What are virtual threads? → **very cheap Java-managed threads (Java 21) for waiting-heavy work**
9. Create a virtual-thread executor? → **Executors.newVirtualThreadPerTaskExecutor()**
10. Shortest path with different road lengths? → **Dijkstra's algorithm (BFS with a priority queue)**
