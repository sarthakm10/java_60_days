# Day 20 — Enums, Records, Immutability and Comparing Objects

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** model fixed sets of values with enums, write data classes in one line with records, build objects that can never change, and sort your own objects.

<!-- topic: b20_t1 -->
## ☕ Java — Enums, Records & Comparators

<!-- intro: d3_t1_s8 -->
Some values only have a few fixed options: the days of the week, an order's status (PLACED, SHIPPED, DELIVERED), the sizes S, M, L. Storing them as Strings invites typos (`"SHIPED"`), and storing them as numbers (`status = 2`) is unreadable. An **enum** is a type that lists exactly the allowed values:

```java
enum Status { PLACED, SHIPPED, DELIVERED, CANCELLED }

Status s = Status.SHIPPED;
if (s == Status.DELIVERED) { ... }       // == is fine for enums: each value exists exactly once
switch (s) {
    case PLACED -> System.out.println("Preparing");
    case SHIPPED -> System.out.println("On the way");
    default -> System.out.println("Done");
}
```

The compiler now rejects anything that isn't one of the four values. Enums can also have fields and methods (a `Size` with a price, for example), which the section below shows.

<!-- intro: d6_t1_s8 -->
This section is a tour of newer Java features; focus on **records** for today. A huge number of classes are just "a few values bundled together": a point (x, y), a student's name and marks. Writing the private fields, constructor, getters, `equals`, `hashCode` and `toString` by hand is 40 lines of boilerplate. A **record** does it in one:

```java
record Point(int x, int y) { }

Point p = new Point(3, 4);
System.out.println(p.x());          // 3 (the getter is named x(), not getX())
System.out.println(p);              // Point[x=3, y=4]
System.out.println(p.equals(new Point(3, 4)));   // true
```

Records can't be changed after creation (no setters). Sealed classes, text blocks and pattern matching in the same section are nice to know; a skim is enough.

<!-- intro: d3_t1_s2 -->
An **immutable** object can never change after it's built, like `String`. That sounds limiting, but it makes code much safer: you can share the object anywhere without worrying that someone will change it behind your back. The recipe: make the class `final`, the fields `private final`, give no setters, and copy any arrays or lists that come in or go out (otherwise the caller could still change them). A record gives you most of this for free.

<!-- intro: d14_t1_s8 -->
`Arrays.sort` knows how to sort numbers and Strings, but how should it sort `Student` objects: by name? by marks? You tell it in one of two ways:

- **`Comparable`**: the class itself defines its **natural order** by implementing `compareTo` (Strings are alphabetical, numbers ascending).
- **`Comparator`**: a separate rule you pass in when sorting, so you can sort the same objects many different ways: `Comparator.comparing(Student::getMarks)` (the `::` syntax is explained on Day 34; read it as "use getMarks").

A compare method returns a **negative** number if the first comes first, **zero** if equal, **positive** if the first comes after.

<!-- topic: b20_t2 -->
## 🧮 DSA — Sorting Algorithms

**Sorting in simple words:** you'll almost always call `Arrays.sort`, but interviews expect you to know how sorting works inside. The simple sorts (bubble, selection, insertion) compare neighbours or find the minimum again and again: easy to write, O(n²). Merge sort and quick sort use **divide and conquer** (split the problem, solve the halves recursively, combine), reaching O(n log n). Merge sort is a great recursion exercise after Day 14. Today's comparator material connects directly to the "Largest Number" problem.

## 📝 Day 20 Recap

1. What is an enum? → **a type with a fixed list of named values**
2. Can you compare enum values with ==? → **yes, each value exists exactly once**
3. What does a record generate for you? → **private final fields, constructor, getters, equals, hashCode and toString**
4. Getter name for record field x? → **x() (not getX())**
5. What is an immutable object? → **one whose state can never change after it is created**
6. Recipe for an immutable class? → **final class, private final fields, no setters, defensive copies of mutable data**
7. Comparable vs Comparator? → **Comparable: the class's own natural order; Comparator: a separate, pluggable ordering**
8. compareTo returns a negative number means? → **the first object comes before the second**
9. Complexity of bubble/selection/insertion sort? → **O(n²)**
10. Complexity of merge sort? → **O(n log n)**
