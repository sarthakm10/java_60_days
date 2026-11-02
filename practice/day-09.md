Yesterday you managed threads by hand. Today you'll let `java.util.concurrent` do the heavy lifting: thread pools, futures you can compose, and synchronizers — plus Java 21 virtual threads.

<!-- exercise: d9_e1 | Medium | Parallel sum with `ExecutorService` and `Callable` -->
**Concepts:** `ExecutorService` · fixed thread pool · `Callable<T>` vs `Runnable` · `invokeAll` · `Future.get()` · `shutdown()` + `awaitTermination()` · try-with-resources on executors (Java 19+)

**Task.** Compute the sum of squares of 1..1,000,000 by splitting the range into **8 chunks**, each handled by a `Callable<Long>` on a pool of **4 threads**.

1. Build the list of tasks, run them with `invokeAll`, and add up the futures' results.
2. Check the answer against the formula n(n+1)(2n+1)/6.
3. Show that a task's exception surfaces as an `ExecutionException` from `get()`, with the real cause inside.
4. Shut the pool down properly.

**Starter code** · `ParallelSum.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class ParallelSum {
    public static void main(String[] args) throws Exception {
        long n = 1_000_000, chunks = 8;
        ExecutorService pool = Executors.newFixedThreadPool(4);

        List<Callable<Long>> tasks = new ArrayList<>();
        // TODO: one Callable per chunk, summing i*i for its sub-range

        long total = 0;
        // TODO: invokeAll + add up each future.get()

        long expected = n * (n + 1) * (2 * n + 1) / 6;
        System.out.println("chunks: " + tasks.size());
        System.out.println("parallel sum: " + total);
        System.out.println("matches formula: " + (total == expected));

        Future<Integer> failing = pool.submit(() -> Integer.parseInt("not a number"));
        // TODO: call failing.get(), catch ExecutionException, print "task failed: <cause class simple name>"

        // TODO: shutdown, awaitTermination(5, SECONDS), print "pool terminated: <isTerminated()>"
    }
}
```

**Expected output**

```text
chunks: 8
parallel sum: 333333833333500000
matches formula: true
task failed: NumberFormatException
pool terminated: true
```

<!-- hints -->
- Chunk boundaries: `long from = c * n / chunks + 1, to = (c + 1) * n / chunks;` — copy them into effectively-final locals before using them in the lambda.
- A lambda that **returns** a value is a `Callable`; one that returns nothing is a `Runnable`. `submit` accepts both.
- `invokeAll` blocks until every task is done and returns futures in the **same order** as the tasks.
- `get()` wraps the task's exception in `ExecutionException` — call `getCause()` to see the original.
- `shutdown()` stops accepting new tasks and lets queued ones finish; `shutdownNow()` interrupts running tasks.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class ParallelSum {
    public static void main(String[] args) throws Exception {
        long n = 1_000_000, chunks = 8;
        ExecutorService pool = Executors.newFixedThreadPool(4);   // 4 threads share 8 tasks

        List<Callable<Long>> tasks = new ArrayList<>();
        for (long c = 0; c < chunks; c++) {
            long from = c * n / chunks + 1, to = (c + 1) * n / chunks;
            tasks.add(() -> {                                     // returns a value → Callable<Long>
                long sum = 0;
                for (long i = from; i <= to; i++) sum += i * i;
                return sum;
            });
        }

        long total = 0;
        for (Future<Long> f : pool.invokeAll(tasks)) total += f.get();   // waits for all

        long expected = n * (n + 1) * (2 * n + 1) / 6;
        System.out.println("chunks: " + tasks.size());
        System.out.println("parallel sum: " + total);
        System.out.println("matches formula: " + (total == expected));

        Future<Integer> failing = pool.submit(() -> Integer.parseInt("not a number"));
        try {
            failing.get();
        } catch (ExecutionException e) {                          // the task's exception is wrapped
            System.out.println("task failed: " + e.getCause().getClass().getSimpleName());
        }

        pool.shutdown();                                          // no new tasks; finish queued ones
        boolean done = pool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("pool terminated: " + (done && pool.isTerminated()));
    }
}
```

**Production notes.** `Executors.newFixedThreadPool` uses an **unbounded** queue — under overload tasks pile up until you run out of memory. In services, build a `ThreadPoolExecutor` with a bounded queue and a rejection policy, give threads names, and always shut pools down (or use `try (ExecutorService pool = ...) { }` on Java 19+, which shuts down and waits on close).

<!-- exercise: d9_e2 | Medium | Compose async calls with `CompletableFuture` -->
**Concepts:** `supplyAsync` with a custom executor · `thenApply` · `thenCompose` · `thenCombine` · `exceptionally` · `allOf` · `join()`

**Task.** Build a "product page" by calling three fake services concurrently:

- `fetchUser(id)` and `fetchCart(userId)` run **in parallel** and are combined with `thenCombine`.
- `fetchPrice(sku)` returns a `CompletableFuture`; chaining it after the cart requires `thenCompose` (not `thenApply`, which would give a future inside a future).
- The price service fails for `"SKU-404"` — recover with `exceptionally` and a fallback price of 0.
- Use `allOf` to wait for three independent price lookups.

Each fake call sleeps a little to simulate I/O. Print results only from `main`, so the output is deterministic.

**Starter code** · `ProductPage.java`

```java
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductPage {
    static final ExecutorService IO = Executors.newFixedThreadPool(4);

    public static void main(String[] args) {
        // TODO 1: user + cart in parallel → "Asha has 3 items in cart"
        String summary = "";
        System.out.println(summary);

        // TODO 2: price of the first cart item via thenCompose → "first item price: 499"
        int firstPrice = 0;
        System.out.println("first item price: " + firstPrice);

        // TODO 3: fetchPrice("SKU-404") with exceptionally → "fallback price: 0"
        int fallback = -1;
        System.out.println("fallback price: " + fallback);

        // TODO 4: allOf over three price futures, then sum them → "total of 3 prices: 1097"
        int total = 0;
        System.out.println("total of 3 prices: " + total);

        IO.shutdown();
    }

    static CompletableFuture<String> fetchUser(int id) {
        return CompletableFuture.supplyAsync(() -> { sleep(100); return "Asha"; }, IO);
    }

    static CompletableFuture<List<String>> fetchCart(int userId) {
        return CompletableFuture.supplyAsync(() -> { sleep(150); return List.of("SKU-1", "SKU-2", "SKU-3"); }, IO);
    }

    static CompletableFuture<Integer> fetchPrice(String sku) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(50);
            return switch (sku) {
                case "SKU-1" -> 499;
                case "SKU-2" -> 99;
                case "SKU-3" -> 499;
                default -> throw new IllegalArgumentException("unknown sku " + sku);
            };
        }, IO);
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
```

**Expected output**

```text
Asha has 3 items in cart
first item price: 499
fallback price: 0
total of 3 prices: 1097
```

<!-- hints -->
- `fetchUser(1).thenCombine(fetchCart(1), (user, cart) -> ...)` — both futures start immediately, so this takes ~150 ms, not 250.
- `fetchCart(1).thenCompose(cart -> fetchPrice(cart.get(0)))` returns `CompletableFuture<Integer>`; `thenApply` would return `CompletableFuture<CompletableFuture<Integer>>`.
- `exceptionally(ex -> 0)` receives the exception (often a `CompletionException` wrapping the original) and returns a replacement value.
- `CompletableFuture.allOf(a, b, c)` returns `CompletableFuture<Void>`; after it completes, read each with `join()` — it won't block any more.
- Always pass your own executor for blocking I/O; the default common `ForkJoinPool` is sized for CPU work.

<!-- solution -->
```java
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductPage {
    static final ExecutorService IO = Executors.newFixedThreadPool(4);

    public static void main(String[] args) {
        String summary = fetchUser(1)
                .thenCombine(fetchCart(1), (user, cart) -> user + " has " + cart.size() + " items in cart")
                .join();                                                  // both calls ran in parallel
        System.out.println(summary);

        int firstPrice = fetchCart(1)
                .thenCompose(cart -> fetchPrice(cart.get(0)))             // flatMap for futures
                .join();
        System.out.println("first item price: " + firstPrice);

        int fallback = fetchPrice("SKU-404")
                .exceptionally(ex -> 0)                                   // recover from failure
                .join();
        System.out.println("fallback price: " + fallback);

        List<CompletableFuture<Integer>> prices = List.of(fetchPrice("SKU-1"), fetchPrice("SKU-2"), fetchPrice("SKU-3"));
        int total = CompletableFuture.allOf(prices.toArray(new CompletableFuture[0]))
                .thenApply(v -> prices.stream().mapToInt(CompletableFuture::join).sum())   // all done → join won't block
                .join();
        System.out.println("total of 3 prices: " + total);

        IO.shutdown();
    }

    static CompletableFuture<String> fetchUser(int id) {
        return CompletableFuture.supplyAsync(() -> { sleep(100); return "Asha"; }, IO);
    }

    static CompletableFuture<List<String>> fetchCart(int userId) {
        return CompletableFuture.supplyAsync(() -> { sleep(150); return List.of("SKU-1", "SKU-2", "SKU-3"); }, IO);
    }

    static CompletableFuture<Integer> fetchPrice(String sku) {
        return CompletableFuture.supplyAsync(() -> {
            sleep(50);
            return switch (sku) {
                case "SKU-1" -> 499;
                case "SKU-2" -> 99;
                case "SKU-3" -> 499;
                default -> throw new IllegalArgumentException("unknown sku " + sku);
            };
        }, IO);
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
```

**Cheat sheet.** `thenApply` = map, `thenCompose` = flatMap, `thenCombine` = zip two independent futures, `thenAccept` = consume, `exceptionally`/`handle` = recover, `allOf`/`anyOf` = wait for many. Add `orTimeout(2, SECONDS)` in real code so a hung dependency can't hang your request.

<!-- exercise: d9_e3 | Hard | Rate-limited workers with `Semaphore`, `CountDownLatch` and virtual threads -->
**Concepts:** virtual threads (`Executors.newVirtualThreadPerTaskExecutor`) · `Semaphore` permits · `CountDownLatch` · `AtomicInteger` CAS loop · `LongAdder` · `ReentrantLock.tryLock`

**Task.** Simulate 2,000 requests to a fragile downstream API that allows **at most 20 concurrent calls**:

1. Run every request on its **own virtual thread**.
2. Guard the call with a `Semaphore(20)`. Track the current and **maximum** concurrency with `AtomicInteger`s and prove the max never exceeds 20.
3. Count completed calls with a `LongAdder` and wait for all of them with a `CountDownLatch`.
4. Finally, show `ReentrantLock.tryLock()`: while `main` holds a lock, another thread's `tryLock` returns `false` instead of blocking.

**Starter code** · `RateLimitedWorkers.java`

```java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantLock;

public class RateLimitedWorkers {
    static final int REQUESTS = 2_000, LIMIT = 20;

    public static void main(String[] args) throws Exception {
        Semaphore permits = new Semaphore(LIMIT);
        AtomicInteger inFlight = new AtomicInteger();
        AtomicInteger maxInFlight = new AtomicInteger();
        LongAdder completed = new LongAdder();
        CountDownLatch allDone = new CountDownLatch(REQUESTS);

        try (ExecutorService vts = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < REQUESTS; i++) {
                vts.submit(() -> {
                    // TODO: acquire a permit, track inFlight/maxInFlight, sleep 5 ms,
                    //       release in finally, count completed, count down the latch
                });
            }
            allDone.await();
        }

        System.out.println("completed: " + completed.sum());
        System.out.println("max concurrent <= " + LIMIT + ": " + (maxInFlight.get() <= LIMIT));
        System.out.println("permits back: " + permits.availablePermits());

        ReentrantLock lock = new ReentrantLock();
        // TODO: main locks; another thread tries tryLock() and records the result; print "other thread got lock: false"
    }
}
```

**Expected output**

```text
completed: 2000
max concurrent <= 20: true
permits back: 20
other thread got lock: false
```

<!-- hints -->
- Always `release()` in a `finally` block — a permit leaked on an exception is gone for good.
- Update the maximum without a lock: `maxInFlight.accumulateAndGet(current, Math::max)` (it retries with CAS internally).
- `LongAdder` spreads increments across cells — faster than `AtomicLong` when many threads increment; read it with `sum()`.
- Virtual threads are cheap enough to create one per task — 2,000 sleeping virtual threads only use a handful of OS threads. Don't pool them.
- For `tryLock`, start a platform thread, `join()` it while `main` still holds the lock, and store the result in an `AtomicBoolean`.

<!-- solution -->
```java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantLock;

public class RateLimitedWorkers {
    static final int REQUESTS = 2_000, LIMIT = 20;

    public static void main(String[] args) throws Exception {
        Semaphore permits = new Semaphore(LIMIT);
        AtomicInteger inFlight = new AtomicInteger();
        AtomicInteger maxInFlight = new AtomicInteger();
        LongAdder completed = new LongAdder();
        CountDownLatch allDone = new CountDownLatch(REQUESTS);

        try (ExecutorService vts = Executors.newVirtualThreadPerTaskExecutor()) {   // one virtual thread per task
            for (int i = 0; i < REQUESTS; i++) {
                vts.submit(() -> {
                    try {
                        permits.acquire();                                   // at most LIMIT get past here
                        try {
                            int now = inFlight.incrementAndGet();
                            maxInFlight.accumulateAndGet(now, Math::max);    // lock-free max via CAS
                            Thread.sleep(5);                                 // the "downstream call"
                            completed.increment();
                        } finally {
                            inFlight.decrementAndGet();
                            permits.release();                               // never leak a permit
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        allDone.countDown();
                    }
                });
            }
            allDone.await();
        }                                                                    // close() waits for tasks

        System.out.println("completed: " + completed.sum());
        System.out.println("max concurrent <= " + LIMIT + ": " + (maxInFlight.get() <= LIMIT));
        System.out.println("permits back: " + permits.availablePermits());

        ReentrantLock lock = new ReentrantLock();
        AtomicBoolean otherGotLock = new AtomicBoolean(true);
        lock.lock();
        try {
            Thread other = new Thread(() -> {
                boolean got = lock.tryLock();                                // returns immediately
                otherGotLock.set(got);
                if (got) lock.unlock();
            });
            other.start();
            other.join();
        } finally {
            lock.unlock();
        }
        System.out.println("other thread got lock: " + otherGotLock.get());
    }
}
```

**When to use which synchronizer.** `CountDownLatch` — wait once for N events (not reusable). `CyclicBarrier` — N threads wait for each other, repeatedly. `Semaphore` — limit concurrent access to N. `Phaser` — flexible multi-phase barrier. In Spring services the same semaphore idea is Resilience4j's **Bulkhead** (Day 29).
