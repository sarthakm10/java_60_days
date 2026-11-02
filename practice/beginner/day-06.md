Methods. Keep `main` short: it should read like a list of what the program does, with the details inside well-named methods.

<!-- exercise: b6_e1 | Easy | Primes up to 100 -->
**Concepts:** a `boolean` method · early `return` · calling a method in a loop

**Task.** Write `isPrime(int n)`, then print every prime from 1 to 100 on one line separated by spaces, and how many there are.

**Starter code** · `Primes.java`

```java
public class Primes {
    static boolean isPrime(int n) {
        return false; // TODO
    }

    public static void main(String[] args) {
        int count = 0;
        // TODO: loop 1..100, print each prime followed by a space, count them
        System.out.println();
        System.out.println("Count: " + count);
    }
}
```

**Expected output**

```text
2 3 5 7 11 13 17 19 23 29 31 37 41 43 47 53 59 61 67 71 73 79 83 89 97
Count: 25
```

<!-- hints -->
- Numbers below 2 are not prime: `if (n < 2) return false;`
- Try divisors from 2 while `i * i <= n`; as soon as one divides `n`, `return false`.
- If the loop finishes without finding a divisor, `return true`.

<!-- solution -->
```java
public class Primes {
    static boolean isPrime(int n) {
        if (n < 2) {
            return false;
        }
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        int count = 0;
        for (int i = 1; i <= 100; i++) {
            if (isPrime(i)) {
                System.out.print(i + " ");
                count++;
            }
        }
        System.out.println();
        System.out.println("Count: " + count);
    }
}
```

`return` ends the method immediately, so there's no need for a `found` flag or a `break`. `i * i <= n` stops at √n; Day 11 explains why that is enough and why it's so much faster.

<!-- exercise: b6_e2 | Easy | Factorial and overflow -->
**Concepts:** return values · `long` vs `int` · overflow

**Task.** Write `factorialInt(int n)` returning an `int` and `factorialLong(int n)` returning a `long`, both with a loop (`0!` is 1). Print both for 5, 12, 13 and 20, and see where the `int` version goes wrong.

**Starter code** · `Factorial.java`

```java
public class Factorial {
    static int factorialInt(int n) {
        return 1; // TODO
    }

    static long factorialLong(int n) {
        return 1; // TODO
    }

    public static void main(String[] args) {
        int[] tests = {0, 5, 12, 13, 20};
        for (int n : tests) {
            System.out.println(n + "! int=" + factorialInt(n) + " long=" + factorialLong(n));
        }
    }
}
```

**Expected output**

```text
0! int=1 long=1
5! int=120 long=120
12! int=479001600 long=479001600
13! int=1932053504 long=6227020800
20! int=-2102132736 long=2432902008176640000
```

<!-- hints -->
- Start `result` at 1 (not 0) and multiply by 2, 3, …, n.
- For `n = 0` the loop doesn't run and the method returns 1, which is correct.
- 13! = 6,227,020,800 is bigger than the largest `int` (about 2.1 billion), so the `int` version silently wraps around.

<!-- solution -->
```java
public class Factorial {
    static int factorialInt(int n) {
        int result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    static long factorialLong(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    public static void main(String[] args) {
        int[] tests = {0, 5, 12, 13, 20};
        for (int n : tests) {
            System.out.println(n + "! int=" + factorialInt(n) + " long=" + factorialLong(n));
        }
    }
}
```

Look at 13!: the `int` answer isn't negative, just wrong, which makes overflow bugs easy to miss. `long` lasts until 20!; beyond that you'd need `BigInteger`.

<!-- exercise: b6_e3 | Medium | A calculator built from methods -->
**Concepts:** one method per job · `switch` on a `char` · returning a value vs printing

**Task.** Write `add`, `subtract`, `multiply` and `divide` (each takes two `double`s and returns a `double`), and `calculate(double a, char op, double b)` that picks the right one with a `switch`. `calculate` returns the result as a `String`: the number for valid input, `"Cannot divide by zero"` for division by 0, and `"Unknown operator: x"` for anything else.

**Starter code** · `Calculator.java`

```java
public class Calculator {
    // TODO: add, subtract, multiply, divide

    static String calculate(double a, char op, double b) {
        return "?"; // TODO
    }

    public static void main(String[] args) {
        System.out.println("8 + 2 = " + calculate(8, '+', 2));
        System.out.println("8 - 2 = " + calculate(8, '-', 2));
        System.out.println("8 * 2 = " + calculate(8, '*', 2));
        System.out.println("8 / 2 = " + calculate(8, '/', 2));
        System.out.println("7 / 2 = " + calculate(7, '/', 2));
        System.out.println("8 / 0 = " + calculate(8, '/', 0));
        System.out.println("8 % 2 = " + calculate(8, '%', 2));
    }
}
```

**Expected output**

```text
8 + 2 = 10.0
8 - 2 = 6.0
8 * 2 = 16.0
8 / 2 = 4.0
7 / 2 = 3.5
8 / 0 = Cannot divide by zero
8 % 2 = Unknown operator: %
```

<!-- hints -->
- The small methods are one line each: `static double add(double a, double b) { return a + b; }`
- In `calculate`, check division by zero before calling `divide`.
- An arrow switch expression can return the `String` directly: `case '+' -> String.valueOf(add(a, b));`

<!-- solution -->
```java
public class Calculator {
    static double add(double a, double b) { return a + b; }
    static double subtract(double a, double b) { return a - b; }
    static double multiply(double a, double b) { return a * b; }
    static double divide(double a, double b) { return a / b; }

    static String calculate(double a, char op, double b) {
        if (op == '/' && b == 0) {
            return "Cannot divide by zero";
        }
        return switch (op) {
            case '+' -> String.valueOf(add(a, b));
            case '-' -> String.valueOf(subtract(a, b));
            case '*' -> String.valueOf(multiply(a, b));
            case '/' -> String.valueOf(divide(a, b));
            default -> "Unknown operator: " + op;
        };
    }

    public static void main(String[] args) {
        System.out.println("8 + 2 = " + calculate(8, '+', 2));
        System.out.println("8 - 2 = " + calculate(8, '-', 2));
        System.out.println("8 * 2 = " + calculate(8, '*', 2));
        System.out.println("8 / 2 = " + calculate(8, '/', 2));
        System.out.println("7 / 2 = " + calculate(7, '/', 2));
        System.out.println("8 / 0 = " + calculate(8, '/', 0));
        System.out.println("8 % 2 = " + calculate(8, '%', 2));
    }
}
```

Because the methods **return** values instead of printing them, `main` decides how to show results, and each method is easy to test on its own. (Passing `8` where a `double` is expected works thanks to automatic widening from Day 3.)
