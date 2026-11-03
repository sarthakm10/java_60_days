# Day 14 — Encapsulation and Access Modifiers

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** hide an object's data behind methods so it can never get into a bad state, control who can see what with access modifiers, and give classes several convenient constructors.

<!-- topic: b14_t1 -->
## ☕ Java — Encapsulation

<!-- intro: d3_t1_s1 -->
Yesterday anyone could write `account.balance = -1000000;` and nothing stopped them. **Encapsulation** means an object keeps its data private and only lets the outside world change it through methods that check the rules, like a bank that only lets you change your balance through deposits and withdrawals at the counter.

The recipe is short: make fields `private`, and add public methods for what callers are allowed to do (`getBalance()`, `deposit(...)`). Methods that just read a field are called **getters**; methods that change one are **setters**. Not every field needs a setter: a bank account number should never change.

<!-- intro: d1_t1_s2 -->
Access modifiers are labels that say **who is allowed to use** a class, field, method or constructor. For now you need two of them:

- `private`: only code **inside this class** can use it. Use it for fields.
- `public`: **anyone** can use it. Use it for the methods other classes should call.

The other two (*default*, written as nothing at all, and `protected`) matter once you have several packages (Day 9) and inheritance (Day 16). Learn the table in the section below; the 🚀 panels can wait.

<!-- subtopic: b14_t1_s3 -->
### Validate in setters and constructors

Encapsulation is only useful if the methods actually **check** what comes in. Every path that sets a field (constructors included) should refuse bad values:

```java
public class Student {
    private String name;
    private int marks;

    public Student(String name, int marks) {
        setName(name);          // reuse the setters' checks
        setMarks(marks);
    }

    public void setMarks(int marks) {
        if (marks < 0 || marks > 100) {
            throw new IllegalArgumentException("Marks must be 0-100, got " + marks);
        }
        this.marks = marks;
    }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        this.name = name.trim();
    }

    public int getMarks() { return marks; }
    public String getName() { return name; }
}
```

`throw new IllegalArgumentException(...)` stops the program with a clear message when someone passes a bad value, which is far better than silently storing it and getting strange results later. (You'll learn to catch exceptions on Day 21; for now, a crash with a good message *is* the right behaviour for a programming mistake.)

Because the fields are private, there is **no way** to create a `Student` with marks of 150 or an empty name. That guarantee is the whole point of encapsulation: the class protects its own rules, so nobody else has to remember them.

<details>
<summary>Why should a constructor call the setters (or the same checks) instead of assigning fields directly?</summary>

So that objects can't be created in an invalid state. The checks live in one place and apply to both new objects and later changes.
</details>

<!-- subtopic: b14_t1_s4 -->
### Several constructors, and this(...)

A class can have several constructors with different parameters (overloading, as with methods on Day 6). This gives callers convenient options:

```java
public class Pizza {
    private final String size;
    private final int toppings;

    public Pizza(String size, int toppings) {   // the "main" constructor: all checks live here
        if (toppings < 0) throw new IllegalArgumentException("toppings < 0");
        this.size = size;
        this.toppings = toppings;
    }

    public Pizza(String size) {
        this(size, 0);          // plain pizza: call the main constructor
    }

    public Pizza() {
        this("medium");         // default pizza
    }
}

new Pizza();                 // medium, 0 toppings
new Pizza("large");          // large, 0 toppings
new Pizza("small", 3);       // small, 3 toppings
```

`this(...)` calls **another constructor of the same class**. Rules:

- It must be the **first statement** in the constructor.
- Put the real work and checks in one constructor and let the others call it, so the rules can't drift apart.

If you write **no** constructor at all, Java adds an invisible empty one, `public Pizza() {}`. As soon as you write any constructor yourself, that free one disappears. (Day 16 shows why that matters with inheritance.)

<details>
<summary>What does this(...) do inside a constructor, and where must it go?</summary>

It calls another constructor of the same class. It must be the very first statement.
</details>

<!-- topic: b14_t2 -->
## 🧮 DSA — Recursion Fundamentals

**Recursion in simple words:** a method that calls **itself** on a smaller version of the same problem. To count down from 5, print 5 and then count down from 4. Every recursive method needs two parts:

1. a **base case**: a small input where the answer is known directly (stop here!), and
2. a **recursive case**: solve a smaller problem by calling yourself, then use its answer.

```java
static int factorial(int n) {
    if (n <= 1) return 1;            // base case
    return n * factorial(n - 1);     // recursive case: a smaller problem
}
```

<!-- visualize: Factorial -->

Each call gets its own frame on the call stack from Day 6, so `factorial(4)` has four frames stacked up before they return one by one. Forget the base case and the frames pile up until `StackOverflowError`. The sections below show you how to trace it.

## 📝 Day 14 Recap

1. What is encapsulation? → **keeping fields private and changing them only through methods that enforce the rules**
2. What is a getter / a setter? → **a method that returns a field / one that changes it after checking the new value**
3. private means? → **visible only inside the same class**
4. public means? → **visible everywhere**
5. Should every private field get a setter? → **no, only if callers may change it**
6. How do you reject a bad argument? → **throw new IllegalArgumentException("message")**
7. What does this(...) do? → **calls another constructor of the same class (first line only)**
8. When does Java add a default constructor? → **only when the class declares no constructor at all**
9. Two parts of every recursive method? → **a base case and a recursive case on a smaller input**
10. Missing base case causes? → **StackOverflowError**
