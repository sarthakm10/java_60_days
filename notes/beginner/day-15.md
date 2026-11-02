# Day 15 — static and final

> Two small keywords you've been typing since Day 1 (`public static void main`, `final int MAX`). Today you find out exactly what they mean.

**Today's goal:** know when something belongs to the **class** (static) and when it belongs to **each object**, and use `final` to make things unchangeable.

<!-- topic: b15_t1 -->
## ☕ Java — static & final

<!-- intro: d1_t1_s4 -->
Normal (instance) fields belong to **each object**: every `Student` has their own `name`. A `static` field belongs to the **class itself**: there is exactly **one** copy, shared by every object, like a classroom's whiteboard that all students see, versus each student's own notebook.

```java
public class Student {
    static int studentsCreated = 0;   // ONE copy for the whole class
    String name;                      // one copy PER object

    Student(String name) {
        this.name = name;
        studentsCreated++;            // every new student bumps the shared counter
    }
}
// read it through the class name, no object needed:
System.out.println(Student.studentsCreated);
```

A `static` method also belongs to the class, so it can be called without any object (`Math.max`, `Integer.parseInt`, and `main`, which the JVM calls before any of your objects exist). Because there's no object, a static method **can't** use `this` or instance fields directly. That's why your Phase 1 helper methods needed `static`: they were called from `main`.

<!-- intro: d1_t1_s5 -->
`final` means **"can't be changed after it's set"**:

- a `final` **variable** can be assigned only once (Day 2's constants),
- a `final` **method** can't be overridden by a subclass (Day 17),
- a `final` **class** can't be extended at all (`String` is a final class).

The one surprise to remember: a `final` variable that refers to an object can't be pointed at a *different* object, but the object itself can still change. `final int[] arr = {1, 2};` then `arr[0] = 9;` is allowed; `arr = new int[3];` is not.

<!-- subtopic: b15_t1_s3 -->
### When to use static

Ask: **"Does this belong to each object, or to the idea as a whole?"**

| Use `static` for… | Example |
|---|---|
| Data shared by all objects | a counter of how many accounts were opened; the next ID number |
| Constants | `static final double GST_RATE = 0.18;` |
| Utility methods that only use their parameters | `Math.sqrt(x)`, `isPrime(n)`, `Arrays.sort(a)` |
| Factory methods that create objects | `List.of(1, 2, 3)`, `Integer.valueOf("42")` |

**Don't** use `static` for data that belongs to one object. A classic beginner bug:

```java
public class Account {
    static double balance;    // ✗ static: every account shares ONE balance!
}
Account a = new Account();
Account b = new Account();
a.balance = 500;
System.out.println(b.balance);   // 500.0, because there's only one balance
```

A handy test: if a method doesn't touch any instance field, it *could* be static. If it does, it must not be.

Static fields are like global variables: any code anywhere can change them, which makes bugs hard to trace. Use them sparingly, and mostly for constants.

<details>
<summary>Why can't a static method use this?</summary>

A static method belongs to the class and runs without any particular object, so there is no "current object" for `this` to refer to.
</details>

<!-- subtopic: b15_t1_s4 -->
### Constants: static final

A **constant** is a value that is the same everywhere and never changes. Make it `static` (one copy) and `final` (unchangeable), and name it in UPPER_SNAKE_CASE:

```java
public class Exam {
    public static final int MAX_MARKS = 100;
    public static final int PASS_MARK = 40;

    static boolean passed(int marks) {
        return marks >= PASS_MARK;
    }
}

if (score > Exam.MAX_MARKS) { ... }    // other classes use the class name
```

Why bother instead of writing `40`?

1. **The name explains the number.** `marks >= PASS_MARK` needs no comment; `marks >= 40` makes readers guess.
2. **One place to change it.** If the pass mark becomes 35, you change one line.
3. **The compiler guards it.** Any accidental assignment is a compile error.

Numbers like this, written directly in code with no name, are called **magic numbers**. Replacing them with named constants is one of the easiest ways to make code more readable.

Java's own constants follow the same pattern: `Math.PI`, `Integer.MAX_VALUE`.

<details>
<summary>Why is a constant both static and final?</summary>

`final` so it can't change, and `static` so there's one shared copy for the class rather than a duplicate inside every object.
</details>

<!-- topic: b15_t2 -->
## 🧮 DSA — Binary Search: Easy

**Binary search in simple words:** to find a word in a dictionary, you don't read every page. You open the middle, see whether your word comes before or after, and throw away half the book. Repeat until you find it. That's binary search: it works on **sorted** data, and each step halves what's left, so 1,000,000 items need only about 20 steps. That's O(log n) from Day 11, and the strategy your computer player used in Guess the Number on Day 12.

The pattern: keep `left` and `right` indexes, look at `mid = left + (right - left) / 2`, and move `left` or `right` past `mid` depending on the comparison. Watch the exact conditions (`<=` vs `<`, `mid + 1` vs `mid`): that's where all binary-search bugs live.

## 📝 Day 15 Recap

1. What does static mean for a field? → **one copy shared by the whole class, not one per object**
2. How do you read a static field? → **through the class name, e.g. Student.studentsCreated**
3. Can a static method use instance fields or this? → **no: there's no current object**
4. Why must main be static? → **the JVM calls it before any object of your class exists**
5. final variable? → **can be assigned only once**
6. final method / final class? → **can't be overridden / can't be extended**
7. final int[] arr: can you change arr[0]? → **yes; you just can't make arr point to another array**
8. How do you declare a constant? → **static final with an UPPER_SNAKE_CASE name**
9. What is a magic number? → **an unexplained literal number in code; replace it with a named constant**
10. Binary search needs the data to be? → **sorted**
