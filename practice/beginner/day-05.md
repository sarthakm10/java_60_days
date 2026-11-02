Loops. Before running each program, trace the first two or three rounds on paper: what is the loop variable, and what gets printed?

<!-- exercise: b5_e1 | Easy | Sums and a multiplication table -->
**Concepts:** `for` loops · accumulating a total · stepping by 2 · nested loops

**Task.** For `n = 100` print: the sum 1 + 2 + … + n, the sum of the even numbers (once with `if` inside the loop, once by stepping `i += 2`), and how many rounds each even-sum loop ran. Then print the 7 times table up to 5, and finally a 4 × 4 multiplication grid with a tab between columns.

**Starter code** · `LoopBasics.java`

```java
public class LoopBasics {
    public static void main(String[] args) {
        int n = 100;
        // TODO: sum of 1..n
        // TODO: even sum with if (count the rounds)
        // TODO: even sum stepping by 2 (count the rounds)
        // TODO: 7 x 1 = 7 ... 7 x 5 = 35
        // TODO: 4 x 4 grid, values separated by \t
    }
}
```

**Expected output**

```text
Sum 1..100 = 5050
Even sum (if) = 2550 in 100 rounds
Even sum (step 2) = 2550 in 50 rounds
7 x 1 = 7
7 x 2 = 14
7 x 3 = 21
7 x 4 = 28
7 x 5 = 35
1	2	3	4
2	4	6	8
3	6	9	12
4	8	12	16
```

<!-- hints -->
- Declare `int sum = 0;` **before** the loop, then `sum += i;` inside it.
- Count rounds with a second variable that you `++` in every round.
- For the grid, the inner loop prints `row * col + "\t"` with `print`, and after it the outer loop prints a new line. To avoid a tab at the end of each row, print the tab only when `col < 4`.

<!-- solution -->
```java
public class LoopBasics {
    public static void main(String[] args) {
        int n = 100;

        int sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        System.out.println("Sum 1.." + n + " = " + sum);

        int evenSum = 0, rounds = 0;
        for (int i = 1; i <= n; i++) {
            rounds++;
            if (i % 2 == 0) {
                evenSum += i;
            }
        }
        System.out.println("Even sum (if) = " + evenSum + " in " + rounds + " rounds");

        evenSum = 0;
        rounds = 0;
        for (int i = 2; i <= n; i += 2) {
            rounds++;
            evenSum += i;
        }
        System.out.println("Even sum (step 2) = " + evenSum + " in " + rounds + " rounds");

        for (int i = 1; i <= 5; i++) {
            System.out.println("7 x " + i + " = " + 7 * i);
        }

        for (int row = 1; row <= 4; row++) {
            for (int col = 1; col <= 4; col++) {
                System.out.print(row * col);
                if (col < 4) {
                    System.out.print("\t");
                }
            }
            System.out.println();
        }
    }
}
```

Both even-sum loops give the same answer, but stepping by 2 does half the work. That kind of difference is what Big-O (Day 11) is about.

<!-- exercise: b5_e2 | Medium | Star patterns -->
**Concepts:** nested loops · inner loop limits that depend on the row

**Task.** Write a method for each pattern, all taking the number of rows `n`, and print them for `n = 4` with a blank line in between: a right triangle, an inverted triangle, and a centred pyramid. Each star is followed by a space, and there is no trailing space problem to worry about (trailing spaces are ignored when checking).

**Starter code** · `Patterns.java`

```java
public class Patterns {
    static void triangle(int n) {
        // TODO: row r prints r stars
    }

    static void inverted(int n) {
        // TODO: row r prints n - r + 1 stars
    }

    static void pyramid(int n) {
        // TODO: row r prints n - r spaces, then r stars
    }

    public static void main(String[] args) {
        triangle(4);
        System.out.println();
        inverted(4);
        System.out.println();
        pyramid(4);
    }
}
```

**Expected output**

```text
*
* *
* * *
* * * *

* * * *
* * *
* *
*

   *
  * *
 * * *
* * * *
```

<!-- hints -->
- Outer loop: `for (int r = 1; r <= n; r++)`, then `System.out.println()` after the inner loop(s).
- Triangle inner loop: `for (int c = 1; c <= r; c++) System.out.print("* ");`
- Pyramid: two inner loops one after the other: first print `n - r` single spaces, then `r` times `"* "`.

<!-- solution -->
```java
public class Patterns {
    static void triangle(int n) {
        for (int r = 1; r <= n; r++) {
            for (int c = 1; c <= r; c++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }

    static void inverted(int n) {
        for (int r = 1; r <= n; r++) {
            for (int c = 1; c <= n - r + 1; c++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }

    static void pyramid(int n) {
        for (int r = 1; r <= n; r++) {
            for (int s = 1; s <= n - r; s++) {
                System.out.print(" ");
            }
            for (int c = 1; c <= r; c++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }

    public static void main(String[] args) {
        triangle(4);
        System.out.println();
        inverted(4);
        System.out.println();
        pyramid(4);
    }
}
```

Every pattern is "for each row, print something whose count depends on the row". Write the counts for each row in a little table first (row 1: 3 spaces, 1 star; row 2: 2 spaces, 2 stars…) and the loop limits fall out of it.

<!-- exercise: b5_e3 | Easy | Digit tools -->
**Concepts:** `while` loops · `% 10` and `/ 10` · handling the zero case

**Task.** Write `countDigits(int n)` and `digitSum(int n)` for non-negative numbers. Remember that 0 has one digit.

**Starter code** · `Digits.java`

```java
public class Digits {
    static int countDigits(int n) {
        return 0; // TODO
    }

    static int digitSum(int n) {
        return 0; // TODO
    }

    public static void main(String[] args) {
        int[] tests = {4721, 7, 0, 1000000};
        for (int n : tests) {
            System.out.println(n + ": " + countDigits(n) + " digits, sum " + digitSum(n));
        }
    }
}
```

**Expected output**

```text
4721: 4 digits, sum 14
7: 1 digits, sum 7
0: 1 digits, sum 0
1000000: 7 digits, sum 1
```

<!-- hints -->
- `while (n > 0) { ...; n = n / 10; }` visits each digit once; `n % 10` is the current last digit.
- For 0 the loop never runs, so `countDigits` must return 1 for it: check `if (n == 0) return 1;` first.
- Changing the parameter `n` inside the method is fine: the caller's variable isn't affected (Java passes a copy, Day 6).

<!-- solution -->
```java
public class Digits {
    static int countDigits(int n) {
        if (n == 0) {
            return 1;
        }
        int count = 0;
        while (n > 0) {
            count++;
            n = n / 10;
        }
        return count;
    }

    static int digitSum(int n) {
        int sum = 0;
        while (n > 0) {
            sum += n % 10;
            n = n / 10;
        }
        return sum;
    }

    public static void main(String[] args) {
        int[] tests = {4721, 7, 0, 1000000};
        for (int n : tests) {
            System.out.println(n + ": " + countDigits(n) + " digits, sum " + digitSum(n));
        }
    }
}
```

`digitSum(0)` is correct without a special case (the sum of no digits is 0), but `countDigits(0)` isn't. Always test the smallest inputs.
