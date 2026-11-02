# Day 22 — More OOP Tools: Inner Classes, Cloning and Serialization

> A lighter day of extra tools. Read each 🌱 **In simple words** box, skim the rest, and leave the 🚀 **Go deeper** panels for later. You'll recognise these when you meet them in real code.

**Today's goal:** know the kinds of classes you can put inside other classes, how to copy objects safely, and what it means to save an object as bytes.

<!-- topic: b22_t1 -->
## ☕ Java — More OOP Tools

<!-- intro: d3_t1_s6 -->
A class can be declared **inside** another class when it only makes sense as part of it, like a `Node` that only a `LinkedList` uses. The kinds you'll see most:

- a **static nested class**: just a class tucked inside another for organisation (`Map.Entry` is one). Prefer this kind.
- an **inner class** (no `static`): each object of it is tied to an object of the outer class and can use its fields.
- an **anonymous class**: a one-off class with no name, written right where it's used. Since Java 8, lambdas (Day 34) replace most of them.

<!-- intro: d3_t1_s7 -->
A **marker interface** is an interface with **no methods at all**. Implementing it just puts a label on your class that some other code checks for. `Serializable` (below) is the famous one: it says "this class may be turned into bytes". You'll rarely write your own; annotations (Day 44) are the modern way to label classes.

<!-- intro: d2_t4_s2 -->
Day 7 and Day 13 showed that `b = a` copies a *reference*, not the object. To get a real copy you have to build a new object. There are two depths:

- a **shallow copy** creates a new outer object but shares everything inside it (two "different" teams that point to the same list of players),
- a **deep copy** copies the inside objects too, so the two are completely independent.

Java's built-in `clone()` is awkward and easy to get wrong. The recommended approach is a **copy constructor**: `new Team(otherTeam)`, which copies exactly what you decide.

<!-- intro: d3_t1_s4 -->
`transient` marks a field that should **not** be saved when an object is serialized (see the next section): passwords, caches, or anything that can be recomputed. After loading the object back, a transient field holds its default value (`null`, `0`, `false`).

<!-- intro: d3_t1_s5 -->
**Serialization** turns an object into a stream of bytes (to save it in a file or send it over a network), and **deserialization** turns the bytes back into an object. In Java, a class opts in by implementing `Serializable`. Modern applications mostly send objects as **JSON** text instead (Day 45), but you'll still meet Java serialization in older code and in interview questions, so read the basics and leave the custom read/write details in the 🚀 panels.

<!-- topic: b22_t2 -->
## 🧮 DSA — Linked List: Medium & Stacks Intro

More pointer rewiring on linked lists, now with the **slow and fast pointer** trick: move one reference one step at a time and another two steps at a time. If there's a cycle, the fast one eventually laps the slow one; if not, when fast reaches the end, slow is in the middle.

Then **stacks** appear for the first time: a stack is like a pile of plates. You can only add to the top (**push**) and take from the top (**pop**), so the last thing in is the first out. Matching brackets in "Valid Parentheses" is the classic use: push every opening bracket, and every closing bracket must match the one on top.

## 📝 Day 22 Recap

1. Preferred kind of nested class? → **static nested class**
2. What replaced most anonymous classes in Java 8? → **lambdas**
3. What is a marker interface? → **an interface with no methods, used as a label (e.g. Serializable)**
4. Does b = a copy an object? → **no, it copies the reference**
5. Shallow vs deep copy? → **shallow shares inner objects; deep copies them too**
6. Recommended way to copy objects? → **a copy constructor (or a copy method), not clone()**
7. What does transient do? → **excludes a field from serialization; it comes back as its default value**
8. What is serialization? → **turning an object into bytes to store or send it**
9. Interface a class implements to be Java-serializable? → **Serializable**
10. Stack order? → **last in, first out (LIFO)**
