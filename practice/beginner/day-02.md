Variables and types. Choose the type for each value deliberately: ask "is it a whole number, a decimal, text, or yes/no?"

<!-- exercise: b2_e1 | Easy | Report card with variables -->
**Concepts:** `int`, `double`, `boolean`, `String` · `final` constants · joining text with `+`

**Task.** Store a student's details in variables of the right types and print the report card below. The maximum marks must be a `final` constant, and the percentage is computed from the marks (not typed in).

**Starter code** · `ReportCard.java`

```java
public class ReportCard {
    public static void main(String[] args) {
        // TODO: a final constant for the maximum marks (100)
        // TODO: variables: name, roll number, marks (87.5), passed (marks >= 40)
        // TODO: percentage = marks / maximum * 100

        System.out.println("===== REPORT CARD =====");
        // TODO: print the five lines below using your variables
        System.out.println("=======================");
    }
}
```

**Expected output**

```text
===== REPORT CARD =====
Name    : Asha Verma
Roll no : 17
Marks   : 87.5 / 100
Percent : 87.5%
Passed  : true
=======================
```

<!-- hints -->
- `final int MAX_MARKS = 100;` declares the constant. Constants use UPPER_SNAKE_CASE.
- `boolean passed = marks >= 40;` stores the result of the comparison: no `if` needed.
- `marks / MAX_MARKS * 100` works here because `marks` is a `double`, so the division isn't integer division.
- Join text and variables with `+`: `"Marks   : " + marks + " / " + MAX_MARKS`.

<!-- solution -->
```java
public class ReportCard {
    public static void main(String[] args) {
        final int MAX_MARKS = 100;

        String name = "Asha Verma";
        int rollNo = 17;
        double marks = 87.5;
        boolean passed = marks >= 40;
        double percent = marks / MAX_MARKS * 100;

        System.out.println("===== REPORT CARD =====");
        System.out.println("Name    : " + name);
        System.out.println("Roll no : " + rollNo);
        System.out.println("Marks   : " + marks + " / " + MAX_MARKS);
        System.out.println("Percent : " + percent + "%");
        System.out.println("Passed  : " + passed);
        System.out.println("=======================");
    }
}
```

Each value has the type that fits it: text, a whole number, a decimal and a yes/no. `passed` is computed rather than typed, so it can never disagree with the marks.

<!-- exercise: b2_e2 | Easy | Swap two numbers, two ways -->
**Concepts:** tracing values step by step · assignment copies values

**Task.** Swap `a` and `b` first with a temporary variable, then swap them back **without** one, using only `+` and `-`. Print the values after each swap.

**Starter code** · `Swap.java`

```java
public class Swap {
    public static void main(String[] args) {
        int a = 5;
        int b = 9;
        System.out.println("Start:  a=" + a + " b=" + b);

        // TODO: swap using a temp variable
        System.out.println("Swap 1: a=" + a + " b=" + b);

        // TODO: swap back WITHOUT a temp variable (only + and -)
        System.out.println("Swap 2: a=" + a + " b=" + b);
    }
}
```

**Expected output**

```text
Start:  a=5 b=9
Swap 1: a=9 b=5
Swap 2: a=5 b=9
```

<!-- hints -->
- With a temp: save `a` in `temp`, copy `b` into `a`, then copy `temp` into `b`.
- Without: after `a = a + b`, `a` holds the sum. The sum minus `b` is the old `a`.
- Trace it on paper with a=9, b=5: a becomes 14, then b = 14 − 5 = 9, then a = 14 − 9 = 5.

<!-- solution -->
```java
public class Swap {
    public static void main(String[] args) {
        int a = 5;
        int b = 9;
        System.out.println("Start:  a=" + a + " b=" + b);

        int temp = a;
        a = b;
        b = temp;
        System.out.println("Swap 1: a=" + a + " b=" + b);

        a = a + b;   // a holds the sum
        b = a - b;   // sum - old b = old a
        a = a - b;   // sum - old a = old b
        System.out.println("Swap 2: a=" + a + " b=" + b);
    }
}
```

The temp version is what you'd write in real code: it's clearer and can't overflow. The arithmetic version is a good exercise in tracing exactly what each line stores.

<!-- exercise: b2_e3 | Easy | Predict the output: joining, overflow and decimals -->
**Concepts:** `+` with text works left to right · `int` overflow · decimal precision · `char` vs `String`

**Task.** Write down what each line prints **before** running it. Then run it and explain every surprise to yourself.

**Starter code** · `Surprises.java`

```java
public class Surprises {
    public static void main(String[] args) {
        System.out.println("Total: " + 2 + 3);
        System.out.println("Total: " + (2 + 3));
        System.out.println(2 + 3 + " apples");
        int big = 2147483647;
        big = big + 1;
        System.out.println(big);
        System.out.println(0.1 + 0.2);
        long ok = 2147483647L + 1;
        System.out.println(ok);
        char letter = 'A';
        String word = "A";
        System.out.println(letter + 1);
        System.out.println(word + 1);
    }
}
```

<!-- hints -->
- `+` is evaluated left to right. Once one side is a String, the result is a String.
- 2147483647 is the largest `int`. Adding 1 wraps around to the smallest.
- A `char` is stored as a number ('A' is 65), so `char + int` is arithmetic. A `String` + anything is joining.

<!-- solution -->
```java
public class Surprises {
    public static void main(String[] args) {
        System.out.println("Total: " + 2 + 3);
        System.out.println("Total: " + (2 + 3));
        System.out.println(2 + 3 + " apples");
        int big = 2147483647;
        big = big + 1;
        System.out.println(big);
        System.out.println(0.1 + 0.2);
        long ok = 2147483647L + 1;
        System.out.println(ok);
        char letter = 'A';
        String word = "A";
        System.out.println(letter + 1);
        System.out.println(word + 1);
    }
}
```

**Expected output**

```text
Total: 23
Total: 5
5 apples
-2147483648
0.30000000000000004
2147483648
66
A1
```

- `"Total: " + 2` is already text, so `+ 3` appends "3". Brackets force the maths first.
- `2 + 3` happens first (both numbers), then the text is joined.
- `int` overflow wraps silently. With the `L` suffix the sum is done in `long` and fits.
- `0.1` and `0.2` can't be stored exactly in binary, hence the tiny error.
- `'A' + 1` is 65 + 1 = 66, while `"A" + 1` joins text.
