Debugging. These exercises are about the **process**, not just the fix: read the message, form a guess, check it, change one thing at a time.

<!-- exercise: b9_e1 | Easy | Fix three compile errors -->
<!-- verify: starter-broken -->
**Concepts:** reading compiler messages · scope · lossy conversions

**Task.** This program does **not** compile. Paste it into IntelliJ or compile it with `javac FixMe.java`, then fix the errors **one at a time, starting with the first message**. After each fix, compile again and note how the list of errors changes. Don't change what the program is meant to do: print the sum of the squares 1² to 5², the last square, and the average of the squares.

**Starter code** · `FixMe.java`

```java
public class FixMe {
    public static void main(String[] args) {
        int total = 0
        for (int i = 1; i <= 5; i++) {
            int square = i * i;
            total += square;
        }
        System.out.println("Last square: " + square);
        int average = total / 5.0;
        System.out.println("Total: " + total + ", average: " + average);
    }
}
```

**Expected output** (once fixed)

```text
Last square: 25
Total: 55, average: 11.0
```

<!-- hints -->
- Error 1: `';' expected`. Look at the end of the line it points to.
- Error 2: `cannot find symbol: variable square`. `square` was declared inside the loop, so it doesn't exist after the `}`. Declare a variable **before** the loop and update it inside.
- Error 3: `incompatible types: possible lossy conversion from double to int`. `total / 5.0` is a `double`; the variable holding it should be one too.

<!-- solution -->
```java
public class FixMe {
    public static void main(String[] args) {
        int total = 0;
        int lastSquare = 0;
        for (int i = 1; i <= 5; i++) {
            int square = i * i;
            total += square;
            lastSquare = square;
        }
        System.out.println("Last square: " + lastSquare);
        double average = total / 5.0;
        System.out.println("Total: " + total + ", average: " + average);
    }
}
```

With `javac`, the first compile probably showed **only** the `;` error: a syntax mistake stops the compiler before it checks names and types. Fixing it revealed the other two. So a shorter error list doesn't always mean you're nearly done. Fix from the top and recompile each time.

<!-- exercise: b9_e2 | Easy | Debug a wrong average -->
**Concepts:** logic errors · breakpoints · stepping through a loop

**Task.** This program compiles and runs, but prints `Average: 17.00` when the right answer is `18.17`. **Use the debugger, not guesswork**: set a breakpoint on the `sum += values[i];` line, start Debug, and watch `i`, `values[i]` and `sum` on each round. Write down the first moment a value is different from what you expect. There are two bugs.

**Starter code** · `AverageBug.java`

```java
public class AverageBug {
    static double average(int[] values) {
        int sum = 0;
        for (int i = 1; i < values.length; i++) {
            sum += values[i];
        }
        return sum / values.length;
    }

    public static void main(String[] args) {
        int[] values = {4, 8, 15, 16, 23, 43};
        System.out.printf("Average: %.2f%n", average(values));
    }
}
```

**Expected output** (once fixed)

```text
Average: 18.17
```

<!-- hints -->
- On the first stop, what is `i`? Which element did the loop never add?
- After fixing the loop, the answer is `18.00`, still not `18.17`. Step over the `return` line: what type is `sum / values.length`?
- An `int` divided by an `int` is an `int`. Cast one side to `double` before dividing.

<!-- solution -->
```java
public class AverageBug {
    static double average(int[] values) {
        int sum = 0;
        for (int i = 0; i < values.length; i++) {      // bug 1: the loop started at 1 and skipped values[0]
            sum += values[i];
        }
        return (double) sum / values.length;           // bug 2: int / int dropped the decimals
    }

    public static void main(String[] args) {
        int[] values = {4, 8, 15, 16, 23, 43};
        System.out.printf("Average: %.2f%n", average(values));
    }
}
```

The two bugs hid each other: the first made the sum 105 instead of 109, and the second turned 105 / 6 into 17. Fixing only one gives a different wrong answer, which is why you check the values step by step instead of guessing.
