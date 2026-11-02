# Day 39 — Synchronization and Thread Safety

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** see a race condition with your own eyes, fix it with `synchronized`, and understand visibility, waiting and deadlock.

<!-- topic: b39_t1 -->
## ☕ Java — Synchronization

<!-- intro: d8_t1_s3 -->
`count++` looks like one step, but it's three: **read** the value, **add** one, **write** it back. If two threads do this at the same moment, both can read 5 and both write 6: one increment is lost. That's a **race condition**. Run two threads that each add 1 a million times, and you'll usually get less than two million.

**`synchronized`** fixes it by letting only **one thread at a time** into a block of code, like a single-occupancy bathroom with a lock on the door. Every Java object can act as that lock:

```java
synchronized void increment() { count++; }   // one thread at a time per object
```

Other threads wait outside until the one inside leaves. Keep synchronized blocks short: everyone else is queuing.

<!-- intro: d8_t1_s4 -->
A second, sneakier problem: for speed, each thread may keep its **own cached copy** of a variable, so one thread's change might never be seen by another (a `running = false` flag that a loop never notices). **`volatile`** on a field means "always read and write the real, shared value". It fixes *visibility* only: `volatile` does **not** make `count++` safe.

<!-- intro: d8_t1_s5 -->
Sometimes a thread must **wait for a condition** ("wait until the queue has an item"). `wait()` pauses a thread and releases the lock; `notify()` / `notifyAll()` wake waiting threads when something changed. Always wait in a `while` loop that re-checks the condition. These are low-level tools; on Day 42 a `BlockingQueue` does the same job for you.

<!-- intro: d8_t1_s6 -->
**Deadlock**: thread A holds lock 1 and waits for lock 2; thread B holds lock 2 and waits for lock 1. Neither can ever continue, like two people in a narrow corridor each waiting for the other to step back. The classic prevention: make every thread take locks **in the same order**.

<!-- intro: d8_t1_s7 -->
`ThreadLocal` gives **each thread its own separate copy** of a variable, so there's nothing to share and nothing to lock. Web frameworks use it to remember "the current user" for each request thread; you'll see it again in Spring (Day 61).

<!-- topic: b39_t2 -->
## 🧮 DSA — Greedy Algorithms

**Greedy in simple words:** at each step, make the choice that looks best **right now**, and never go back. For some problems that's provably optimal and much simpler than DP: to fit the most meetings in a room, always pick the meeting that **ends earliest**. For others it fails (making change with coins 1, 3 and 4 for amount 6: greedy takes 4+1+1, but 3+3 is better), which is why Coin Change needed DP on Day 37. The skill is spotting when the local best choice is safe.

## 📝 Day 39 Recap

1. Why isn't count++ thread-safe? → **it's read, add, write: two threads can interleave and lose an update**
2. What is a race condition? → **a bug where the result depends on the timing of threads**
3. What does synchronized guarantee? → **only one thread at a time runs the code guarded by that lock**
4. What does volatile guarantee? → **visibility: every thread sees the latest written value**
5. Does volatile make count++ safe? → **no**
6. wait() and notify() are used for? → **pausing a thread until another signals that a condition changed**
7. Why wait in a while loop? → **to re-check the condition after waking (wake-ups can be spurious)**
8. What is a deadlock? → **threads each holding a lock the other needs, so none can continue**
9. Classic deadlock prevention? → **always acquire locks in the same order**
10. What does ThreadLocal give? → **each thread its own copy of a variable**
