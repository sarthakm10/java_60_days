# Day 21 — Exceptions: Handling Errors

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** stop letting errors crash your programs: catch them where you can do something useful, clean up resources reliably, and create your own exceptions.

<!-- topic: b21_t1 -->
## ☕ Java — Exceptions

<!-- intro: d7_t1_s1 -->
Since Day 3 you've seen exceptions end programs: `ArithmeticException`, `NumberFormatException`, `NullPointerException`. An **exception** is an object that Java "throws" when something goes wrong, carrying a message and the stack trace. Today you learn to **catch** them.

They come in two families:

- **Checked exceptions** are problems a correct program must still expect, like a missing file or a network that's down. The compiler **forces** you to deal with them (catch them, or declare `throws`).
- **Unchecked exceptions** (`RuntimeException` and its children) usually mean a bug: a null, a bad index, dividing by zero. The compiler doesn't force you; the fix is usually to correct the code.

`Error`s (like `OutOfMemoryError` or `StackOverflowError`) are serious JVM problems you normally don't catch at all.

<!-- intro: d7_t1_s2 -->
`try` marks code that might fail; `catch` says what to do if it does; `finally` runs **no matter what**, for clean-up:

```java
Scanner in = new Scanner(System.in);
try {
    int age = Integer.parseInt(in.nextLine());
    System.out.println("Next year: " + (age + 1));
} catch (NumberFormatException e) {
    System.out.println("That's not a number: " + e.getMessage());
}
System.out.println("The program keeps going");
```

When an exception happens inside `try`, Java jumps straight to the matching `catch` and skips the rest of the `try` block. **try-with-resources** (`try (var reader = ...) { }`) closes files and connections automatically, even if something fails, and is how you'll open resources from now on.

<!-- intro: d7_t1_s3 -->
Two smaller tools. **Multi-catch** handles several exception types the same way in one block: `catch (NumberFormatException | ArithmeticException e)`. **Chaining** wraps a low-level exception inside a more meaningful one while keeping the original as its *cause*, so the stack trace still shows the real root problem: `throw new ReportException("Couldn't build the report", e);`.

<!-- intro: d7_t1_s4 -->
You can make your own exception types by extending `Exception` (checked) or `RuntimeException` (unchecked). A well-named exception says exactly what went wrong in your program's language: `InsufficientFundsException` tells a reader far more than a generic `IllegalStateException`. Give it a clear message, and include the values that caused the problem.

```java
public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(double balance, double amount) {
        super("Cannot withdraw " + amount + ", balance is only " + balance);
    }
}
```

<!-- intro: d7_t1_s9 -->
Three similar-sounding words that are completely unrelated: `final` (can't change, Day 15), `finally` (the always-runs block of a `try`), and `finalize()` (an old, deprecated clean-up method; never use it). This is a classic quick interview question, so read the comparison once.

<!-- topic: b21_t2 -->
## 🧮 DSA — Linked List: Easy

**Linked lists in simple words:** an array keeps its elements side by side in memory. A **linked list** keeps each element in its own little object, a **node**, which also holds a reference to the **next** node, like a treasure hunt where each clue tells you where the next one is. You hold a reference to the first node (the *head*) and follow `next` until you reach `null`.

```java
class ListNode {
    int val;
    ListNode next;             // a reference to another node: Day 13's references in action
    ListNode(int val) { this.val = val; }
}
```

Inserting at the front is instant (no shifting), but reaching the 1000th element means following 1000 links. Most linked-list problems are about **rewiring `next` references carefully**: draw boxes and arrows on paper for every step.

## 📝 Day 21 Recap

1. What is an exception? → **an object thrown when something goes wrong, carrying a message and stack trace**
2. Checked vs unchecked? → **checked must be caught or declared (expected problems); unchecked are RuntimeExceptions (usually bugs)**
3. Should you catch Errors like OutOfMemoryError? → **normally no**
4. When does finally run? → **always, whether or not an exception happened**
5. What happens to the rest of the try block after an exception? → **it's skipped; control jumps to the matching catch**
6. Best way to make sure a file gets closed? → **try-with-resources**
7. Catch two exception types in one block? → **catch (TypeA | TypeB e)**
8. Custom unchecked exception extends? → **RuntimeException**
9. final vs finally vs finalize? → **keyword for "can't change" / try's always-run block / deprecated clean-up method**
10. What does each linked-list node hold? → **a value and a reference to the next node**
