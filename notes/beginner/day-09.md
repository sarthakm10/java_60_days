# Day 9 — Debugging, Errors and Organising Code

> Professional developers spend a large part of their day reading errors and debugging. Getting comfortable with it now makes everything after this easier.

**Today's goal:** read compiler errors and stack traces calmly, find bugs with the IntelliJ debugger, and organise code into packages.

<!-- topic: b9_t1 -->
## ☕ Java — Debugging & Project Structure

<!-- subtopic: b9_t1_s1 -->
### Reading compiler errors

There are three kinds of mistakes:

| Kind | When you find out | Example |
|---|---|---|
| **Compile error** | before the program runs: the compiler refuses | missing `;`, wrong type, misspelled name |
| **Runtime error** | while it runs: the program crashes | dividing by zero, index out of bounds |
| **Logic error** | never automatically: it runs but gives the wrong answer | `<` instead of `<=`, wrong formula |

Compile errors are the friendliest: the compiler tells you exactly where. Every message has the same shape:

```text
Report.java:7: error: ';' expected
        int total = 90
                      ^
1 error
```

**File** `Report.java`, **line** `7`, **what's wrong** `';' expected`, and a `^` pointing at the spot. In IntelliJ the same errors appear as red underlines while you type; hover over one to read the message.

The errors you'll meet most:

| Message | Usual cause | Fix |
|---|---|---|
| `';' expected` | missing semicolon (often at the end of the line **above** the one shown) | add the `;` |
| `cannot find symbol` | misspelled variable or method, wrong case (`system`), variable used outside its scope, missing `import` | check spelling and scope; add the import |
| `incompatible types: possible lossy conversion from double to int` | storing a decimal in an `int` | use `double`, or cast `(int)` on purpose |
| `incompatible types: String cannot be converted to int` | text where a number is expected | `Integer.parseInt(...)` |
| `missing return statement` | a non-void method that doesn't return on every path | add a `return` at the end |
| `variable x might not have been initialized` | reading a variable before giving it a value | give it a starting value |
| `reached end of file while parsing` | a `{` without its `}` | count your braces (IntelliJ highlights the matching one) |
| `unreachable statement` | code after a `return` or `break` | remove it or move it up |

Strategy:

1. **Fix the first error first.** One missing brace can produce ten errors below it.
2. **Read the whole message**, including the line with `^`.
3. If the line looks fine, **look at the line above** it.
4. Recompile after each fix.

<details>
<summary>"cannot find symbol" usually means what?</summary>

The compiler doesn't know that name: a typo or wrong capitalisation, a variable used outside its scope, or a missing import.
</details>

<!-- subtopic: b9_t1_s2 -->
### Runtime errors and stack traces

A runtime error is an **exception**: something went wrong while running, and Java stops the program and prints a **stack trace**:

```java
public class Crash {
    public static void main(String[] args) {
        int[] scores = {80, 90, 70};
        printAverage(scores, 0);
    }

    static void printAverage(int[] scores, int people) {
        int sum = 0;
        for (int s : scores) sum += s;
        System.out.println(sum / people);     // line 10
    }
}
```

```text
Exception in thread "main" java.lang.ArithmeticException: / by zero
	at Crash.printAverage(Crash.java:10)
	at Crash.main(Crash.java:4)
```

Read it **top to bottom**:

1. **Type and message:** `ArithmeticException: / by zero`. That's *what* went wrong.
2. **First `at` line:** where it happened: method `printAverage`, file `Crash.java`, line 10. Start looking here.
3. **Lines below:** who called it: `main` at line 4. This is the call stack from Day 6, frozen at the moment of the crash.

Often the real mistake is in a caller (here, `main` passed 0 people), so follow the trace down until you reach the cause.

Exceptions you'll see a lot:

| Exception | Meaning |
|---|---|
| `ArithmeticException: / by zero` | integer division by 0 |
| `ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5` | bad array index |
| `StringIndexOutOfBoundsException` | bad String index |
| `NullPointerException` | using a variable that points to no object (`null`); more on Day 13 |
| `NumberFormatException: For input string: "abc"` | `Integer.parseInt` on text that isn't a number |
| `InputMismatchException` | Scanner expected a number but got text |

In IntelliJ, file names in the stack trace are blue links: click one to jump to that line.

<details>
<summary>In a stack trace, which line do you look at first?</summary>

The exception type and message, then the first `at ...` line under it: that's the exact method and line where it was thrown. The lines below show the callers.
</details>

<!-- subtopic: b9_t1_s3 -->
### The IDE debugger

`println` debugging works, but the **debugger** lets you pause the program and look at everything, without editing your code.

**1. Set a breakpoint:** click in the left margin next to a line number. A red dot appears.

**2. Start in debug mode:** click the 🐞 bug icon instead of ▶ (or right-click → *Debug*). The program runs until it reaches the breakpoint, then **pauses before running that line**.

**3. Look around:** the *Variables* panel shows every variable and its current value. IntelliJ also shows values in grey next to your code.

**4. Step through:**

| Button | Shortcut (IntelliJ, Windows/Linux) | Does |
|---|---|---|
| **Step Over** | F8 | run this line, stop at the next one |
| **Step Into** | F7 | if the line calls your method, go inside it |
| **Step Out** | Shift+F8 | finish this method, stop back in the caller |
| **Resume** | F9 | run until the next breakpoint |

**5. Watch a loop:** put a breakpoint inside the loop and press Resume repeatedly; watch `i` and `sum` change each round. To stop only on a specific round, right-click the red dot and add a **condition** like `i == 7`.

The debugging mindset:

1. Decide what the value **should** be at a certain line.
2. Pause there and check what it **is**.
3. The first place where "should" and "is" differ is where the bug lives.

<details>
<summary>What is the difference between Step Over and Step Into?</summary>

Step Over runs the current line completely and stops at the next one. Step Into goes inside a method called on that line so you can step through it.
</details>

<!-- subtopic: b9_t1_s4 -->
### Packages and imports

As projects grow, you organise classes into **packages**: folders with a naming scheme.

```java
package com.asha.games;      // first line of the file: this class lives in package com.asha.games

public class GuessGame { ... }
```

The file must sit in the matching folder: `src/com/asha/games/GuessGame.java`. Package names are lowercase and usually start with a reversed domain (`com.company.project`), so two companies' `User` classes never clash.

To use a class from **another** package, **import** it:

```java
import java.util.Scanner;          // one class
import java.util.Arrays;
import java.util.*;                // every class in java.util (fine, but explicit imports are clearer)

public class Demo {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
    }
}
```

| Needs import? | Why |
|---|---|
| `String`, `Math`, `System`, `Integer` | no: they're in `java.lang`, imported automatically |
| `Scanner`, `Arrays`, `Random` | yes: `java.util` |
| a class in the same package as yours | no |

Forgetting an import gives `cannot find symbol` (see above). In IntelliJ, put the cursor on the red name and press **Alt+Enter** → *Import class*. IntelliJ can also add imports automatically as you type.

<details>
<summary>Why doesn't String need an import but Scanner does?</summary>

`String` is in `java.lang`, which is imported automatically. `Scanner` is in `java.util`, so you write `import java.util.Scanner;`.
</details>

<!-- subtopic: b9_t1_s5 -->
### A project's layout

A typical small project in IntelliJ:

```text
java-practice/
├── src/                          ← all your source code lives here
│   └── com/asha/practice/
│       ├── day01/Hello.java
│       ├── day05/Patterns.java
│       └── day08/Palindrome.java
└── out/                          ← compiled .class files (generated: never edit)
```

Rules and habits:

- **One public class per file**, and the file name equals the class name.
- A file can have extra non-public classes, but in practice keep one class per file.
- The `package` line must match the folders under `src`.
- Never edit or commit generated folders like `out/`, `target/` or `build/` (you'll exclude them from Git on Day 12).
- Group code by topic or feature. For this course, a package per day keeps practice tidy.

On Day 46 you'll meet **Maven**, which uses a slightly different standard layout (`src/main/java`, `src/test/java`). The idea is the same.

<details>
<summary>A class is in package com.shop.cart. Where does its file go?</summary>

In `src/com/shop/cart/`, and the file is named after the class (e.g. `Cart.java`).
</details>

<!-- topic: b9_t2 -->
## 🧮 Practice — Find the Bug

<!-- subtopic: b9_t2_s1 -->
### Fix a program with three compile errors

Exercise 1 in **Code Practice** gives you a short program with three mistakes in it: a missing semicolon, a variable used outside its scope, and a type mismatch. Paste it into IntelliJ (or compile with `javac`), read each message, and fix them one at a time, **starting with the first**. Note how many errors disappear after each fix.

<!-- subtopic: b9_t2_s2 -->
### Use breakpoints to find a wrong answer

Exercise 2 in **Code Practice** computes the average of an array, compiles fine, and prints the wrong number. Don't stare at the code: set a breakpoint inside the loop, step through, and compare what `sum` and `i` *should* be with what they *are*. Write down the line where they first differ.

<!-- subtopic: b9_t2_s3 -->
### Move your earlier programs into packages

Create packages `day01` … `day08` (or `com.yourname.day01` …) and move your practice programs into them. In IntelliJ, drag files between packages and it updates the `package` lines for you (that's a *refactoring*). Run a few to make sure they still work.

## 📝 Day 9 Recap

1. Three kinds of errors? → **compile errors, runtime errors (exceptions), logic errors**
2. Which compile error should you fix first? → **the first one**
3. Error for a misspelled variable? → **cannot find symbol**
4. Where does a stack trace say the crash happened? → **the first "at" line under the exception message**
5. Exception for 10 / 0 with ints? → **ArithmeticException: / by zero**
6. Integer.parseInt("12a") throws? → **NumberFormatException**
7. What does a breakpoint do? → **pauses the program before that line in debug mode**
8. Step Into vs Step Over? → **Into goes inside the called method; Over runs the line and moves on**
9. Package name style? → **lowercase reversed domain, e.g. com.asha.games**
10. Which classes need no import? → **java.lang ones (String, Math, System) and classes in your own package**
