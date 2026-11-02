# Day 26 — LinkedList and List Pitfalls

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** know when a `LinkedList` beats an `ArrayList` (rarely), and avoid the classic list bugs: changing a list while looping over it, and surprises with views.

<!-- topic: b26_t1 -->
## ☕ Collections — LinkedList & Pitfalls

<!-- intro: d11_t1_s4 -->
Java's `LinkedList` is the linked list you built by hand on Days 21–22, ready-made. Each element sits in its own node pointing to the next **and previous** nodes (a *doubly* linked list). Adding or removing at the **front or back** is instant, but reaching element 500 means walking through 500 nodes. It implements both `List` and `Deque` (a queue usable from both ends, Day 30).

<!-- intro: d11_t1_s5 -->
In theory a linked list wins whenever you insert in the middle. In practice `ArrayList` wins almost everywhere: its elements sit side by side in memory, which modern processors read extremely fast, while linked-list nodes are scattered and each one carries extra pointers. **Default to `ArrayList`.** Reach for `ArrayDeque` (Day 30) when you need fast adds and removes at both ends.

<!-- intro: d11_t1_s7 -->
This one bites everyone once. If you **remove items from a list inside a for-each loop over that same list**, Java throws `ConcurrentModificationException` (CME):

```java
for (String item : cart) {
    if (item.startsWith("x")) cart.remove(item);   // 💥 ConcurrentModificationException
}
```

The loop's hidden iterator notices the list changed under it and stops rather than skip elements. The fixes: `cart.removeIf(item -> item.startsWith("x"));` (the `->` is a lambda, Day 34; read it as "remove each item where…"), or use the iterator's own `remove()`. "Concurrent" here doesn't mean threads; it just means "while iterating".

<!-- intro: d11_t1_s9 -->
`list.subList(2, 5)` doesn't copy anything: it's a **view**, a window onto part of the original list. Changes through the view change the original, and if you change the original's size afterwards, using the view throws an exception. When you want an independent piece, copy it: `new ArrayList<>(list.subList(2, 5))`.

<!-- topic: b26_t2 -->
## 🧮 DSA — Backtracking: Easy→Medium

**Backtracking in simple words:** to list every possible combination (every subset of {1, 2, 3}, every ordering of letters), you make a choice, explore everything that follows from it, then **undo** the choice and try the next one, like walking a maze and stepping back at dead ends. In code: add an element to a `List`, recurse, remove it again. The shape is always **choose → explore → unchoose**. Draw the decision tree for a tiny input (3 elements) before coding; it shows you exactly what the recursion does.

## 📝 Day 26 Recap

1. How is Java's LinkedList built? → **as a doubly linked list of nodes**
2. Fast operations on a LinkedList? → **adding/removing at the front or back**
3. Cost of get(i) on a LinkedList? → **O(n): it walks node by node**
4. Default list choice? → **ArrayList**
5. Removing from a list inside a for-each loop over it throws? → **ConcurrentModificationException**
6. Safe way to remove matching items? → **list.removeIf(...) or the Iterator's remove()**
7. Does "concurrent" in CME mean threads? → **no, it means modified while being iterated**
8. What does subList return? → **a view onto the original list, not a copy**
9. Make an independent copy of part of a list? → **new ArrayList<>(list.subList(a, b))**
10. Backtracking pattern? → **choose, explore (recurse), unchoose**
