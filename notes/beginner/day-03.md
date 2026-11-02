# Day 3 — Operators, Input and Type Casting

> Predict before you run: for each example, guess the output first, then check. The surprises are where you learn.

**Today's goal:** do calculations correctly (including the integer-division trap), compare values, convert between types, and read input typed by the user.

<!-- topic: b3_t1 -->
## ☕ Java — Operators & Input

<!-- subtopic: b3_t1_s1 -->
### Arithmetic operators and the integer-division surprise

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | add | `7 + 2` | `9` |
| `-` | subtract | `7 - 2` | `5` |
| `*` | multiply | `7 * 2` | `14` |
| `/` | divide | `7 / 2` | **`3`** (!) |
| `%` | remainder (modulo) | `7 % 2` | `1` |

**The surprise: `int / int` gives an `int`.** The decimal part is simply thrown away (not rounded):

```java
System.out.println(7 / 2);      // 3
System.out.println(9 / 10);     // 0
System.out.println(-7 / 2);     // -3  (chopped towards zero)
```

To get a decimal answer, at least one side must be a decimal:

```java
System.out.println(7 / 2.0);            // 3.5
System.out.println(7.0 / 2);            // 3.5
int total = 7, count = 2;
double avg = (double) total / count;     // 3.5  (cast before dividing; see casting below)
double wrong = total / count;            // 3.0  ← the division already happened in ints!
```

That last line is the most common beginner bug in Java: the result is stored in a `double`, but the division happened first, in `int` maths.

**`%` (remainder) is more useful than it looks:**

```java
n % 2 == 0      // is n even?
n % 10          // last digit of n: 1234 % 10 is 4
n / 10          // n without its last digit: 1234 / 10 is 123
minutes % 60    // leftover minutes: 135 % 60 is 15 (135 min = 2 h 15 min)
```

**Order of operations** is like school maths: `*`, `/`, `%` before `+`, `-`; brackets first. `2 + 3 * 4` is 14, `(2 + 3) * 4` is 20. When in doubt, add brackets.

Dividing an `int` by zero crashes the program with `ArithmeticException: / by zero`. (Dividing a `double` by zero gives `Infinity` instead.)

<details>
<summary>What do 17 / 5 and 17 % 5 give?</summary>

`17 / 5` is `3` (integer division drops the .4) and `17 % 5` is `2` (the remainder).
</details>

<details>
<summary>Why does double avg = 7 / 2; store 3.0, not 3.5?</summary>

`7 / 2` is calculated first using `int` maths (giving 3), and only then is the result stored in the `double`. Write `7 / 2.0` or `(double) 7 / 2`.
</details>

<!-- subtopic: b3_t1_s2 -->
### Shortcut operators: +=, ++ and --

You'll update variables constantly, so Java has short forms:

| Long form | Short form |
|---|---|
| `score = score + 10;` | `score += 10;` |
| `score = score - 5;` | `score -= 5;` |
| `price = price * 2;` | `price *= 2;` |
| `total = total / 4;` | `total /= 4;` |
| `count = count + 1;` | `count++;` or `++count;` |
| `count = count - 1;` | `count--;` or `--count;` |

**`i++` vs `++i`.** On a line of its own, both just add 1. The difference only shows when you use the value in the same expression:

```java
int i = 5;
int a = i++;    // a = 5, then i becomes 6   (post-increment: use, then add)
int j = 5;
int b = ++j;    // j becomes 6, then b = 6   (pre-increment: add, then use)
```

Tip: avoid mixing `++` into bigger expressions. Write `count++;` on its own line and nobody has to think about it.

<details>
<summary>int x = 3; int y = x++; What are x and y?</summary>

`y` is 3 (the old value was used), and `x` is 4.
</details>

<!-- subtopic: b3_t1_s3 -->
### Comparison and logical operators

**Comparisons** produce a `boolean` (`true` or `false`):

| Operator | Meaning | `5 ? 3` |
|---|---|---|
| `==` | equal to | `5 == 3` is `false` |
| `!=` | not equal to | `5 != 3` is `true` |
| `>` / `<` | greater / less than | `5 > 3` is `true` |
| `>=` / `<=` | greater or equal / less or equal | `5 <= 3` is `false` |

Note the double `==` for comparing. A single `=` stores a value.

**Logical operators** combine booleans:

| Operator | Name | True when… | Example |
|---|---|---|---|
| `&&` | AND | **both** sides are true | `age >= 18 && hasId` |
| `\|\|` | OR | **at least one** side is true | `isAdmin \|\| isOwner` |
| `!` | NOT | flips true ↔ false | `!isEmpty` |

```java
int age = 20;
boolean hasTicket = false;
System.out.println(age >= 18 && hasTicket);   // false: hasTicket is false
System.out.println(age >= 18 || hasTicket);   // true: age >= 18 is enough
System.out.println(!hasTicket);               // true
```

**Short-circuiting:** `&&` stops as soon as the left side is `false` (the answer can't be true anymore), and `||` stops as soon as the left side is `true`. This lets you write safe checks like `count != 0 && total / count > 5`: if `count` is 0, the division never runs.

**Range checks** need both sides spelled out: `age >= 13 && age <= 19` ✓, not `13 <= age <= 19` ✗ (that doesn't compile in Java).

<details>
<summary>How do you check that a number n is between 1 and 100 inclusive?</summary>

`n >= 1 && n <= 100`. Java has no `1 <= n <= 100` shorthand.
</details>

<!-- subtopic: b3_t1_s4 -->
### Type casting: widening and narrowing

Sometimes a value of one type has to be used as another type.

**Widening (automatic, safe):** a smaller type fits into a bigger one, so Java converts silently.

```java
int marks = 87;
double asDecimal = marks;     // 87.0: no information lost
long big = marks;             // 87
```

Order of size: `byte → short → int → long → float → double`.

**Narrowing (manual, can lose information):** going from bigger to smaller needs an explicit **cast**: the target type in brackets.

```java
double price = 99.99;
int rupees = (int) price;     // 99: the decimal part is chopped, not rounded
long huge = 3_000_000_000L;
int squeezed = (int) huge;    // -1294967296: doesn't fit, wraps around (overflow)
```

The cast is you telling the compiler "I know this may lose information, do it anyway."

To **round** instead of chop, use `Math.round`: `Math.round(99.99)` is `100`.

**`char` is secretly a number** (more on Day 8): `(int) 'A'` is `65`, and `(char) 66` is `'B'`.

**Text ↔ number** is not casting; it uses methods:

```java
int n = Integer.parseInt("42");        // "42" → 42
double d = Double.parseDouble("3.5");  // "3.5" → 3.5
String s = String.valueOf(42);         // 42 → "42"   (or simply "" + 42)
```

`Integer.parseInt("abc")` crashes with `NumberFormatException`, so only parse text you know is a number.

<details>
<summary>What is (int) 9.99, and how do you get 10 instead?</summary>

`(int) 9.99` is `9`: casting chops off the decimals. `Math.round(9.99)` gives `10`.
</details>

<!-- subtopic: b3_t1_s5 -->
### Reading input with Scanner

Programs get more interesting when the user can type values. `Scanner` reads from the keyboard:

```java
import java.util.Scanner;     // at the very top of the file, before the class

public class Greet {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);   // System.in is the keyboard

        System.out.print("Your name: ");
        String name = in.nextLine();           // reads a whole line of text

        System.out.print("Your age: ");
        int age = in.nextInt();                // reads a whole number

        System.out.println("Hi " + name + ", next year you'll be " + (age + 1));
    }
}
```

| Method | Reads |
|---|---|
| `nextInt()` | a whole number |
| `nextDouble()` | a decimal |
| `next()` | one word (stops at a space) |
| `nextLine()` | the rest of the line, spaces included |
| `nextBoolean()` | `true` or `false` |

If the user types `abc` when `nextInt()` expects a number, the program crashes with `InputMismatchException`. Handling that nicely needs exceptions (Day 21); for now, type sensible input.

**The leftover-newline trap.** This is the classic Scanner bug:

```java
System.out.print("Age: ");
int age = in.nextInt();         // user types 21 and presses Enter
System.out.print("City: ");
String city = in.nextLine();    // ← returns "" immediately! The user never gets to type
```

`nextInt()` reads `21` but leaves the **Enter** key (a newline) waiting. `nextLine()` sees that newline and returns an empty line. Fix: call `in.nextLine();` once after `nextInt()` to throw the leftover newline away, or read everything with `nextLine()` and convert with `Integer.parseInt(...)`.

In IntelliJ you type input into the **Run** panel at the bottom.

<details>
<summary>Why does nextLine() sometimes return an empty string right after nextInt()?</summary>

`nextInt()` leaves the newline from the Enter key unread, and `nextLine()` immediately reads that empty rest-of-line. Call an extra `in.nextLine()` after `nextInt()` to consume it.
</details>

<!-- subtopic: b3_t1_s6 -->
### The Math class

`Math` is a ready-made toolbox. No `import` needed.

| Method | Does | Example | Result |
|---|---|---|---|
| `Math.max(a, b)` | larger of two | `Math.max(4, 9)` | `9` |
| `Math.min(a, b)` | smaller of two | `Math.min(4, 9)` | `4` |
| `Math.abs(x)` | distance from zero | `Math.abs(-7)` | `7` |
| `Math.pow(a, b)` | a to the power b | `Math.pow(2, 10)` | `1024.0` |
| `Math.sqrt(x)` | square root | `Math.sqrt(49)` | `7.0` |
| `Math.round(x)` | nearest whole number | `Math.round(2.5)` | `3` |
| `Math.floor(x)` / `Math.ceil(x)` | round down / up | `Math.ceil(2.1)` | `3.0` |
| `Math.random()` | random decimal in [0, 1) | `Math.random()` | e.g. `0.7134…` |
| `Math.PI` | π | | `3.14159…` |

Two things to note: `pow` and `sqrt` return `double` (cast if you need an int), and to get a **random whole number from 1 to 6** (a dice roll):

```java
int dice = (int) (Math.random() * 6) + 1;   // random() * 6 is 0.0–5.99…, cast gives 0–5, +1 gives 1–6
```

Circle example:

```java
double r = 3;
double area = Math.PI * Math.pow(r, 2);
System.out.printf("Area: %.2f%n", area);   // Area: 28.27
```

<details>
<summary>How do you get a random whole number from 1 to 10?</summary>

`(int) (Math.random() * 10) + 1`
</details>

<!-- topic: b3_t2 -->
## 🧮 Practice — Calculations

<!-- subtopic: b3_t2_s1 -->
### Simple-interest calculator

Simple interest = principal × rate × years / 100. Read the principal, the yearly rate (%) and the number of years, then print the interest and the total amount, both with 2 decimal places.

```text
Principal: 10000
Rate (%): 7.5
Years: 3
Interest: 2250.00
Total   : 12250.00
```

Watch the types: rate is a decimal, so use `nextDouble()` and `double` maths. 👉 Exercise 1 in **Code Practice** (the version there uses fixed values, so you can check your output exactly; then add `Scanner`).

<!-- subtopic: b3_t2_s2 -->
### Celsius ↔ Fahrenheit converter

Formulas: `F = C × 9 / 5 + 32` and `C = (F − 32) × 5 / 9`.

Careful: `C * 9 / 5` with an `int` C loses decimals. `37 * 9 / 5` is `66`, not `66.6`. Use `9.0 / 5` or make the temperature a `double`.

Test values: 0 °C = 32 °F, 100 °C = 212 °F, 37 °C = 98.6 °F, −40 °C = −40 °F. 👉 Exercise 2 in **Code Practice**.

<!-- subtopic: b3_t2_s3 -->
### Sum, average and remainder of three numbers

Read three whole numbers. Print their sum, their average as a decimal, and the remainder when the sum is divided by 3. With 10, 20 and 25: sum 55, average 18.33, remainder 1.

This is the integer-division trap in practice: `sum / 3` gives 18. You need `sum / 3.0`. 👉 Exercise 3 in **Code Practice** walks through the trap.

## 📝 Day 3 Recap

1. 7 / 2 in Java? → **3 (int divided by int drops the decimals)**
2. 7 % 2? → **1 (the remainder)**
3. How to get 3.5 from 7 and 2? → **7 / 2.0 or (double) 7 / 2**
4. Last digit of a number n? → **n % 10**
5. x++ vs ++x when used in an expression? → **x++ uses the old value then adds 1; ++x adds first**
6. Operator for AND / OR / NOT? → **&& / || / !**
7. Is int to double automatic? → **yes, widening is automatic and safe**
8. (int) 9.99? → **9 (casting chops decimals)**
9. Convert the text "42" to a number? → **Integer.parseInt("42")**
10. Fix for nextLine() returning "" after nextInt()? → **call in.nextLine() once to consume the leftover newline**
