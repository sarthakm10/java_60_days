# Day 30 — Queues, Stacks and Priority Queues

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** process things in the right order: first in, first out (queues), last in, first out (stacks), or most important first (priority queues).

<!-- topic: b30_t1 -->
## ☕ Collections — Queue & Deque

<!-- intro: d15_t1_s1 -->
A **queue** is a line at a ticket counter: people join at the **back** and are served from the **front**, so the first one in is the first one out (**FIFO**). Java's `Queue` interface has two versions of each operation: `offer` / `poll` / `peek` quietly return `false` or `null` when they can't do their job, while `add` / `remove` / `element` throw an exception instead. Most code uses the quiet trio:

```java
Queue<String> line = new ArrayDeque<>();
line.offer("Asha");             // join at the back
line.offer("Ravi");
System.out.println(line.peek()); // Asha: look at the front without removing
System.out.println(line.poll()); // Asha: serve (remove) the front
System.out.println(line.poll()); // Ravi
System.out.println(line.poll()); // null: empty line
```

<!-- intro: d15_t1_s2 -->
`ArrayDeque` ("deck", a double-ended queue) can add and remove at **both** ends quickly, so one class covers two jobs: use it as a **queue** (`offer`/`poll`) or as a **stack** (`push`/`pop`/`peek`, last in first out, like Day 22's pile of plates). It's faster than the old `Stack` class, which you'll still see in older code; prefer `ArrayDeque`.

<!-- intro: d15_t1_s3 -->
A **priority queue** doesn't serve in arrival order: it always hands out the **smallest** element first, like a hospital emergency room that sees the most urgent patient first, whoever arrived when. Adding and removing are O(log n) and looking at the top is O(1). For "largest first", create it with `new PriorityQueue<>(Collections.reverseOrder())`. Looping over a priority queue does **not** give sorted order; only repeated `poll()` does.

<!-- intro: d15_t1_s4 -->
For your own objects, tell the priority queue what "smallest" means with a comparator (Day 20), for example tasks by priority: `new PriorityQueue<>(Comparator.comparing(Task::getPriority))`. This powers scheduling problems and the "top K" questions you'll meet on Day 32.

<!-- topic: b30_t2 -->
## 🧮 DSA — Stacks & Queues

Stacks shine whenever the **most recent** thing matters: undo, matching brackets, evaluating expressions (Reverse Polish Notation pushes numbers and pops two whenever it sees an operator). Min Stack keeps a second stack of "the minimum so far". The **monotonic stack** (Daily Temperatures, Next Greater Element) keeps the stack sorted by popping anything smaller than the new element: each element is pushed and popped once, so it's O(n) even though there's a loop inside a loop.

## 📝 Day 30 Recap

1. Queue order? → **first in, first out (FIFO)**
2. Stack order? → **last in, first out (LIFO)**
3. offer/poll/peek vs add/remove/element? → **the first three return false/null when they can't; the others throw**
4. Best class for both stack and queue? → **ArrayDeque**
5. Stack methods on ArrayDeque? → **push, pop, peek**
6. What does a PriorityQueue poll() return? → **the smallest element (by natural order or comparator)**
7. Make a max-heap PriorityQueue? → **new PriorityQueue<>(Collections.reverseOrder())**
8. Cost of offer/poll on a PriorityQueue? → **O(log n)**
9. Does a for-each over a PriorityQueue give sorted order? → **no, only repeated poll() does**
10. Why is a monotonic stack O(n)? → **each element is pushed and popped at most once**
