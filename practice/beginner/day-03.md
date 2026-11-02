Calculations. Watch your types: most bugs today come from integer division. The first two exercises use fixed values so you can check your output exactly; once they match, try reading the values with `Scanner`.

<!-- exercise: b3_e1 | Easy | Simple-interest calculator -->
**Concepts:** `double` arithmetic · `printf` with `%.2f`

**Task.** Simple interest = principal × rate × years / 100. For a principal of 10000, a rate of 7.5% and 3 years, print the interest and the total amount with exactly 2 decimal places.

**Starter code** · `SimpleInterest.java`

```java
public class SimpleInterest {
    public static void main(String[] args) {
        double principal = 10000;
        double rate = 7.5;      // percent per year
        int years = 3;

        // TODO: compute interest and total
        // TODO: print them with printf and %.2f
    }
}
```

**Expected output**

```text
Interest: 2250.00
Total   : 12250.00
```

<!-- hints -->
- `double interest = principal * rate * years / 100;`
- `System.out.printf("Interest: %.2f%n", interest);` prints 2 decimals; `%n` is a new line.
- Bonus: replace the fixed values with `Scanner` input (`nextDouble()`, `nextInt()`).

<!-- solution -->
```java
public class SimpleInterest {
    public static void main(String[] args) {
        double principal = 10000;
        double rate = 7.5;
        int years = 3;

        double interest = principal * rate * years / 100;
        double total = principal + interest;

        System.out.printf("Interest: %.2f%n", interest);
        System.out.printf("Total   : %.2f%n", total);
    }
}
```

Because `principal` is a `double`, the whole calculation is done in decimals. `%.2f` rounds to two places for display only; the variable keeps full precision.

<!-- exercise: b3_e2 | Easy | Temperature converter -->
**Concepts:** formulas · avoiding integer division · casting and rounding

**Task.** Convert 0, 37, 100 and −40 °C to Fahrenheit (`F = C × 9 / 5 + 32`), then 98.6 °F back to Celsius (`C = (F − 32) × 5 / 9`). Print one decimal place. Finally, show the bug: print `37 * 9 / 5 + 32` computed with `int`s only.

**Starter code** · `Temperature.java`

```java
public class Temperature {
    public static void main(String[] args) {
        // TODO: print the four conversions C -> F with one decimal
        // TODO: print 98.6 F -> C with one decimal
        // TODO: print the all-int version of 37 C -> F
    }
}
```

**Expected output**

```text
0.0 C = 32.0 F
37.0 C = 98.6 F
100.0 C = 212.0 F
-40.0 C = -40.0 F
98.6 F = 37.0 C
All-int bug: 37 C = 98 F
```

<!-- hints -->
- Write a `double` formula once and reuse it: `double f = c * 9 / 5 + 32;` where `c` is a `double`.
- `System.out.printf("%.1f C = %.1f F%n", c, f);` prints both values with one decimal.
- In `37 * 9 / 5 + 32` every number is an `int`: 333 / 5 is 66, not 66.6.

<!-- solution -->
```java
public class Temperature {
    public static void main(String[] args) {
        double[] celsius = {0, 37, 100, -40};
        for (double c : celsius) {
            double f = c * 9 / 5 + 32;
            System.out.printf("%.1f C = %.1f F%n", c, f);
        }

        double fahrenheit = 98.6;
        double c = (fahrenheit - 32) * 5 / 9;
        System.out.printf("%.1f F = %.1f C%n", fahrenheit, c);

        System.out.println("All-int bug: 37 C = " + (37 * 9 / 5 + 32) + " F");
    }
}
```

(The loop over an array is a preview of Days 5 and 7; four separate `printf` lines are just as correct.) The last line loses 0.6 degrees because `37 * 9 / 5` is done in whole numbers.

<!-- exercise: b3_e3 | Easy | Sum, average and remainder from user input -->
**Concepts:** `Scanner` · the integer-division trap · `%`

**Task.** Read three whole numbers typed by the user. Print their sum, their average with 2 decimals, the average computed the **wrong** way (int division), and the remainder of the sum divided by 3.

**Starter code** · `ThreeNumbers.java`

```java
import java.util.Scanner;

public class ThreeNumbers {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.println("Enter three whole numbers:");
        // TODO: read a, b, c with nextInt()
        // TODO: print Sum, Average (2 decimals), Wrong average (int division), Remainder
    }
}
```

**Sample input**

```text
10 20 25
```

**Expected output**

```text
Enter three whole numbers:
Sum: 55
Average: 18.33
Wrong average: 18
Remainder: 1
```

<!-- hints -->
- `nextInt()` reads numbers separated by spaces or new lines, so typing `10 20 25` on one line works.
- `sum / 3` is integer division (18). `sum / 3.0` gives 18.333…
- `printf("Average: %.2f%n", sum / 3.0)` rounds the display to 2 decimals.

<!-- solution -->
```java
import java.util.Scanner;

public class ThreeNumbers {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.println("Enter three whole numbers:");
        int a = in.nextInt();
        int b = in.nextInt();
        int c = in.nextInt();

        int sum = a + b + c;
        System.out.println("Sum: " + sum);
        System.out.printf("Average: %.2f%n", sum / 3.0);
        System.out.println("Wrong average: " + sum / 3);
        System.out.println("Remainder: " + sum % 3);
    }
}
```

Type the three numbers into the Run panel in IntelliJ (or the terminal) and press Enter. Notice that the "wrong average" isn't even rounded: integer division simply chops the decimals off.
