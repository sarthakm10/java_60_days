# Day 34 — Lambdas and Functional Interfaces

> **Phase 4: Modern Java.** These four days change how Java code looks: shorter, and closer to how you'd describe the task in words. Read each 🌱 **In simple words** box first.

**Today's goal:** write lambdas, understand the built-in functional interfaces they plug into, and read method references like `String::toUpperCase`.

<!-- topic: b34_t1 -->
## ☕ Java — Lambdas & Functional Interfaces

<!-- intro: d4_t1_s1 -->
A **lambda** is a small piece of code you can pass around like a value: "here's how to compare two students", "here's what to do with each item". You've already copied a few (`removeIf(item -> item.startsWith("x"))`, `computeIfAbsent(k -> new ArrayList<>())`). Now you'll understand them.

```java
// the long way (Day 20): a whole class just to say "compare by marks"
class ByMarks implements Comparator<Student> {
    public int compare(Student a, Student b) { return a.marks - b.marks; }
}
students.sort(new ByMarks());

// the same thing as a lambda
students.sort((a, b) -> a.marks - b.marks);
```

Read `(a, b) -> a.marks - b.marks` as "given a and b, give back a.marks − b.marks". Shape: **parameters → body**. With one parameter you can drop the brackets (`x -> x * 2`); with a longer body use braces and `return`. Inside a lambda you can use local variables from around it, as long as they're never changed afterwards ("effectively final").

<!-- intro: d4_t1_s2 -->
Where can a lambda go? Anywhere Java expects an interface with **exactly one** abstract method, a **functional interface**, like `Comparator` (just `compare`) or `Runnable` (just `run`). The lambda becomes the body of that one method. `@FunctionalInterface` on an interface asks the compiler to check that it really has only one.

<!-- intro: d4_t1_s3 -->
Java ships ready-made functional interfaces so you rarely write your own. **`Predicate<T>`** is a yes/no question about a value: `Predicate<String> isLong = s -> s.length() > 5;` then `isLong.test("banana")` is `true`. You'll pass predicates to `filter` and `removeIf`, and you can combine them with `and`, `or` and `negate`.

<!-- intro: d4_t1_s4 -->
**`Function<T, R>`** turns a value into another value: `Function<String, Integer> length = s -> s.length();` then `length.apply("hello")` is `5`. It's what `map` uses tomorrow. `andThen` chains two functions: first this, then that.

<!-- intro: d4_t1_s5 -->
**`Consumer<T>`** takes a value and does something with it, returning nothing (`forEach(item -> System.out.println(item))`). **`Supplier<T>`** takes nothing and produces a value (`() -> new ArrayList<>()`), handy for creating things only when they're needed.

<!-- intro: d4_t1_s6 -->
Two-argument versions follow the same naming: `BiFunction<T, U, R>` (two inputs, one result) and `BiConsumer`. `UnaryOperator<T>` is a Function whose input and output are the same type (`x -> x * 2`), and `BinaryOperator<T>` combines two values of a type into one (`(a, b) -> a + b`, used by `reduce` on Day 36).

<!-- intro: d4_t1_s7 -->
When a lambda only calls one existing method, a **method reference** says the same thing even more briefly: `s -> s.toUpperCase()` becomes `String::toUpperCase`, `x -> System.out.println(x)` becomes `System.out::println`, and `() -> new ArrayList<>()` becomes `ArrayList::new`. Read `::` as "use this method". (Now `Comparator.comparing(Student::getMarks)` from Day 20 makes sense: "compare by calling getMarks".)

<!-- intro: d4_t1_s8 -->
Practise until lambdas feel normal: sort a list of names by length, filter out short words with `removeIf`, print every item with `forEach`, and transform a list with `replaceAll(String::trim)`. The Code Practice exercises today walk you through exactly these.

<!-- topic: b34_t2 -->
## 🧮 DSA — Graphs Introduction

**Graphs in simple words:** a graph is a set of **points** (vertices) joined by **lines** (edges): cities and roads, people and friendships, web pages and links. Trees (Day 24) are a special kind of graph. You store a graph as a **list of neighbours** for each vertex (`List<List<Integer>>` or a `Map`). Then two ways to explore it: **BFS** (with a queue, Day 30, spreading out level by level, which finds shortest paths in steps) and **DFS** (with recursion or a stack, going as deep as possible first). The one rule trees didn't need: keep a **visited** set, or you'll go round in circles forever.

## 📝 Day 34 Recap

1. What is a lambda? → **a short block of code you can pass around as a value: (params) -> body**
2. Where can a lambda be used? → **wherever a functional interface (one abstract method) is expected**
3. Rule for local variables used inside a lambda? → **they must be effectively final (never reassigned)**
4. Predicate<T> does? → **tests a value and returns true/false (method test)**
5. Function<T, R> does? → **turns a T into an R (method apply)**
6. Consumer vs Supplier? → **Consumer takes a value and returns nothing; Supplier takes nothing and returns a value**
7. Method reference for s -> s.toUpperCase()? → **String::toUpperCase**
8. Method reference for creating a new ArrayList? → **ArrayList::new**
9. Two ways to explore a graph? → **BFS (queue, level by level) and DFS (recursion or stack, deep first)**
10. What stops graph traversal looping forever? → **a visited set**
