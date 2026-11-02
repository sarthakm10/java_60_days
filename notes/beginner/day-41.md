# Day 41 — Locks, Atomics and Concurrent Collections

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** know the tools that are often better than `synchronized`: explicit locks, atomic variables, coordination helpers and collections built for many threads.

<!-- topic: b41_t1 -->
## ☕ Java — Locks & Concurrent Collections

<!-- intro: d9_t1_s4 -->
`ReentrantLock` does the same job as `synchronized` with more control: `tryLock(1, SECONDS)` gives up instead of waiting forever (a simple way to avoid deadlocks), and you can choose fair ordering. The price: you must unlock yourself, always in a `finally` block (Day 21), or the lock stays taken forever.

<!-- intro: d9_t1_s5 -->
Many data structures are **read** far more often than **written** (a product catalogue). A `ReadWriteLock` lets any number of readers in at once, but a writer gets the data to itself. `StampedLock` goes further with "optimistic" reads that don't lock at all. Know they exist; use them when profiling shows a plain lock is a bottleneck.

<!-- intro: d9_t1_s6 -->
For a simple shared counter, locks are overkill. `AtomicInteger` does `incrementAndGet()` safely without any lock, using a special processor instruction (compare-and-swap). Day 39's broken `count++` becomes `counter.incrementAndGet()` and is correct. Under very heavy contention, `LongAdder` is even faster.

<!-- intro: d9_t1_s7 -->
Three helpers for coordinating threads: a **`CountDownLatch`** is a gate that opens after N events ("start when all 5 services are ready"); a **`CyclicBarrier`** makes a group of threads wait for each other at a meeting point, again and again; a **`Semaphore`** hands out a limited number of permits ("at most 3 downloads at once"), like a car park with 3 spaces.

<!-- intro: d13_t1_s1 -->
A normal `HashMap` used by several threads at once can lose entries or even break. **`ConcurrentHashMap`** is built for it: different threads can update different buckets (Day 28) at the same time, and methods like `merge` and `compute` are atomic. It's the standard choice for a map shared between threads, and it doesn't allow `null` keys or values.

<!-- intro: d13_t1_s2 -->
`Hashtable` is the old (Java 1.0) thread-safe map that locks the whole table for every call; slow, and replaced by `ConcurrentHashMap`. Never use it in new code; just recognise it in old code and interview questions.

<!-- intro: d11_t1_s6 -->
Lists for several threads: `Collections.synchronizedList(list)` wraps every method in a lock (simple, but you must still lock manually while iterating), `CopyOnWriteArrayList` copies the whole array on every write so that reading never needs a lock (great for lists read constantly and changed rarely, like listener lists), and `Vector` is the legacy version to avoid.

<!-- intro: d14_t1_s7 -->
`CopyOnWriteArraySet` is the set version of the same idea: safe for many readers, expensive writes. Fine for small sets that rarely change.

<!-- topic: b41_t2 -->
## 🧮 DSA — Trie & Advanced Trees

A **trie** (said "try") is a tree for storing words letter by letter: each node has up to 26 children, one per next letter, so all words starting with "car" share the path c → a → r. Checking "does any word start with this prefix?" takes as many steps as the prefix has letters, however many words you store. That's how search-box autocomplete works. Also today: keeping the **median** of a stream of numbers with two heaps (Day 32), and turning a tree into a string and back again.

## 📝 Day 41 Recap

1. Advantage of ReentrantLock over synchronized? → **tryLock with a timeout, fairness, more control**
2. Where must unlock() go? → **in a finally block**
3. What does a ReadWriteLock allow? → **many readers at once, or one writer alone**
4. Thread-safe counter without locks? → **AtomicInteger.incrementAndGet()**
5. CountDownLatch is used for? → **waiting until N events have happened**
6. Semaphore is used for? → **limiting how many threads use something at once (permits)**
7. Map to share between threads? → **ConcurrentHashMap**
8. Does ConcurrentHashMap allow null keys? → **no, neither null keys nor null values**
9. When is CopyOnWriteArrayList a good choice? → **many reads, rare writes**
10. What is a trie good for? → **fast prefix lookups on words (autocomplete)**
