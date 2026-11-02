# Day 43 — Inside the JVM: Memory and Garbage Collection

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass. You won't need most of this to write code, but interviewers love it, and it explains error messages you'll meet in real projects.

**Today's goal:** know where your variables and objects live in memory, how Java cleans up objects you no longer use, and what to do when memory runs out.

<!-- topic: b43_t1 -->
## ☕ Java — JVM Internals

<!-- intro: d7_t1_s8 -->
The JVM (Day 1) splits memory into areas. The two that matter most: each thread has its own **stack**, holding the frames of running methods with their local variables (Day 6), and all threads share one **heap**, where every object created with `new` lives. A local variable like `Book b` sits on the stack and holds a *reference*; the `Book` object itself is on the heap. That's the picture behind Day 7's "arrays are references" and Day 13's objects.

<!-- intro: d17_t4_s1 -->
Your `.class` files aren't all loaded at startup: the JVM loads a class the first time it's needed, using **class loaders** that ask their parent first (so nobody can sneak in a fake `java.lang.String`). After loading, the class is checked (verified), prepared and initialised, which is when its `static` blocks run (Day 15).

<!-- intro: d17_t4_s2 -->
The JVM starts by **interpreting** bytecode line by line, and watches which methods run a lot. Those "hot" methods are compiled to fast machine code by the **JIT (just-in-time) compiler** while the program runs. That's why Java programs get faster after warming up, and why a quick timing of code that ran once can be misleading.

<!-- intro: d17_t4_s3 -->
Java has no `free()` or `delete`: the **garbage collector (GC)** finds objects that nothing can reach any more and reclaims their memory. Most objects die young (temporary strings, loop objects), so the heap is split into a **young** area that's cleaned often and cheaply, and an **old** area for long-lived objects, cleaned less often. Objects that survive a few young cleanings get promoted to old.

<!-- intro: d10_t1_s6 -->
There are several garbage collectors to choose from. **G1** is the default and a good all-rounder; **ZGC** keeps pauses tiny for latency-sensitive services. You size the heap with `-Xms` (starting size) and `-Xmx` (maximum size), options you'll set again when running Spring Boot in Docker (Day 73).

<!-- intro: d10_t1_s7 -->
"Garbage collected" doesn't mean leak-proof. If your program **keeps a reference** to objects it no longer needs, the GC can't remove them: a `static` list that only ever grows, a cache with no limit (Day 31's LRU fixes that), or files and connections that are never closed (try-with-resources, Day 21). Memory then fills up slowly until the program crashes.

<!-- intro: d17_t4_s4 -->
`OutOfMemoryError` comes in flavours, and the message tells you which area ran out: "Java heap space" (too many live objects, or a leak), "Metaspace" (too many classes loaded), "GC overhead limit exceeded" (the GC is working constantly and freeing almost nothing), "unable to create native thread" (too many threads, Day 38). Read the message before guessing.

<!-- intro: d17_t4_s5 -->
When a real application misbehaves, you take snapshots: a **thread dump** (`jstack`) shows what every thread is doing, which finds deadlocks (Day 39); a **heap dump** (`jmap`/`jcmd`) shows which objects fill the memory; **Java Flight Recorder** and **VisualVM** record and graph everything. Know these names; you'll use them on the job.

<!-- topic: b43_t2 -->
## 🧮 DSA — Hard Problem Intro

Your first **hard** problems. They're built from patterns you know, just combined or used cleverly: Largest Rectangle in Histogram and Sliding Window Maximum use **monotonic** stacks and deques (Day 30), Trapping Rain Water returns with a stack-based solution, and Longest Palindromic Substring "expands around the centre" from every position. For hard problems, spend longer on the idea before coding, and don't be discouraged by needing the solution the first time: understanding it and re-solving it two days later is how these become yours.

## 📝 Day 43 Recap

1. What lives on a thread's stack? → **method frames with their local variables and references**
2. Where do objects created with new live? → **on the heap, shared by all threads**
3. When is a class loaded? → **the first time it's needed**
4. What does the JIT compiler do? → **compiles frequently run bytecode to fast machine code while the program runs**
5. What does the garbage collector remove? → **objects that nothing can reach any more**
6. Why split the heap into young and old? → **most objects die young, so cleaning the young area often is cheap**
7. Default garbage collector? → **G1**
8. JVM options for heap size? → **-Xms (initial) and -Xmx (maximum)**
9. Common cause of memory leaks in Java? → **keeping references you no longer need, e.g. an ever-growing static collection**
10. Tool to see what every thread is doing? → **a thread dump (jstack)**
