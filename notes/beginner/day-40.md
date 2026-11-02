# Day 40 — Executors and Thread Pools

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** stop creating threads by hand: hand tasks to a thread pool, get results back with `Future`, and chain asynchronous steps with `CompletableFuture`.

<!-- topic: b40_t1 -->
## ☕ Java — Executors & Futures

<!-- intro: d9_t1_s1 -->
Creating a new thread for every task is like hiring a new cook for every order and firing them afterwards: slow and wasteful, and with 10,000 orders you'd run out of kitchen. A **thread pool** keeps a fixed team of threads and a queue of tasks; each thread takes the next task when it's free. In Java you use an **`ExecutorService`**:

```java
ExecutorService pool = Executors.newFixedThreadPool(4);   // 4 worker threads
pool.submit(() -> System.out.println("task on " + Thread.currentThread().getName()));
pool.shutdown();                                           // no new tasks; finish the queued ones
```

Always shut a pool down when you're done, or your program may never exit.

<!-- intro: d9_t4_s1 -->
Behind `Executors.newFixedThreadPool` is a `ThreadPoolExecutor` with settings: how many threads to keep (core size), how many at most (max size), how big the waiting queue is, and what to do when everything's full (the rejection policy). Sizing it is a classic interview topic; the rule of thumb is about the number of CPU cores for calculation-heavy work, and more for tasks that mostly wait.

<!-- intro: d9_t1_s2 -->
`submit` gives back a **`Future`**: a receipt for a result that isn't ready yet. Calling `future.get()` **waits** until the task finishes and returns its value (with a `Callable`, Day 38). Waiting is simple, but it blocks the thread that waits, which is the limitation the next topic fixes.

<!-- intro: d9_t1_s3 -->
`CompletableFuture` lets you describe "when this is done, do that" without blocking: `supplyAsync(() -> fetchUser())` starts work in the background, `.thenApply(user -> user.getName())` transforms the result when it arrives, `.thenCombine(...)` merges two results, and `.exceptionally(...)` handles failures. It's how you call two slow services **at the same time** and combine the answers, a very common backend need.

<!-- topic: b40_t2 -->
## 🧮 DSA — Intervals & Matrix

Two families of "know the trick" problems. **Intervals** (meetings, bookings): almost always **sort by start time first**, then walk through, merging or counting overlaps; Meeting Rooms II uses a min-heap (Day 32) of end times to count rooms in use. **Matrix** problems (spiral order, rotate an image, set zeroes) are about careful index bookkeeping in 2D arrays (Day 7): track the top, bottom, left and right boundaries and shrink them as you go.

## 📝 Day 40 Recap

1. Why use a thread pool instead of new threads? → **reusing a fixed set of threads is cheaper and limits how many run at once**
2. Create a pool of 4 threads? → **Executors.newFixedThreadPool(4)**
3. What must you call when done with an ExecutorService? → **shutdown()**
4. What does submit return? → **a Future: a handle for the result**
5. What does future.get() do? → **waits until the task finishes and returns its result**
6. Main limitation of Future.get()? → **it blocks the calling thread**
7. Start async work with CompletableFuture? → **CompletableFuture.supplyAsync(...)**
8. Transform an async result when it arrives? → **thenApply(...)**
9. Handle a failure in a CompletableFuture chain? → **exceptionally(...)**
10. First step for most interval problems? → **sort the intervals by start time**
