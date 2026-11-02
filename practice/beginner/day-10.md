Logic building. Solve each method on paper with a small example first, then turn your steps into code. Reuse your own methods wherever you can.

<!-- exercise: b10_e1 | Medium | Number toolkit -->
**Concepts:** `% 10` / `/ 10` digit loops · reusing methods · order of checks

**Task.** Write `reverse(int n)`, `isPalindrome(int n)` (which must use `reverse`) and `fizzBuzz(int n)` returning `"Fizz"`, `"Buzz"`, `"FizzBuzz"` or the number as text. Then print the reverses, the palindrome checks, and FizzBuzz for 1 to 15 on one line.

**Starter code** · `NumberToolkit.java`

```java
public class NumberToolkit {
    static int reverse(int n) {
        return 0; // TODO
    }

    static boolean isPalindrome(int n) {
        return false; // TODO: use reverse
    }

    static String fizzBuzz(int n) {
        return ""; // TODO
    }

    public static void main(String[] args) {
        System.out.println(reverse(1234) + " " + reverse(1200) + " " + reverse(7));
        System.out.println(isPalindrome(121) + " " + isPalindrome(1331) + " " + isPalindrome(123));
        StringBuilder line = new StringBuilder();
        for (int i = 1; i <= 15; i++) {
            line.append(fizzBuzz(i)).append(i < 15 ? " " : "");
        }
        System.out.println(line);
    }
}
```

**Expected output**

```text
4321 21 7
true true false
1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz
```

<!-- hints -->
- Reverse: `reversed = reversed * 10 + n % 10; n /= 10;` while `n > 0`.
- 1200 reversed is 21 (as a number, leading zeros disappear). That's correct.
- FizzBuzz: check `n % 15 == 0` **first**, then 3, then 5. `String.valueOf(n)` turns the number into text.

<!-- solution -->
```java
public class NumberToolkit {
    static int reverse(int n) {
        int reversed = 0;
        while (n > 0) {
            reversed = reversed * 10 + n % 10;
            n /= 10;
        }
        return reversed;
    }

    static boolean isPalindrome(int n) {
        return n == reverse(n);
    }

    static String fizzBuzz(int n) {
        if (n % 15 == 0) return "FizzBuzz";
        if (n % 3 == 0) return "Fizz";
        if (n % 5 == 0) return "Buzz";
        return String.valueOf(n);
    }

    public static void main(String[] args) {
        System.out.println(reverse(1234) + " " + reverse(1200) + " " + reverse(7));
        System.out.println(isPalindrome(121) + " " + isPalindrome(1331) + " " + isPalindrome(123));
        StringBuilder line = new StringBuilder();
        for (int i = 1; i <= 15; i++) {
            line.append(fizzBuzz(i)).append(i < 15 ? " " : "");
        }
        System.out.println(line);
    }
}
```

`isPalindrome` is one line because `reverse` already does the hard part: small methods that do one thing combine easily. In `fizzBuzz`, each `return` ends the method, so plain `if`s work without `else`.

<!-- exercise: b10_e2 | Medium | Armstrong and perfect numbers -->
**Concepts:** counting digits · `Math.pow` · copying a value before a destructive loop · divisor loops

**Task.** Write `isArmstrong(int n)` and `isPerfect(int n)`, then print all Armstrong numbers from 1 to 999 and all perfect numbers from 1 to 10,000.

**Starter code** · `SpecialNumbers.java`

```java
public class SpecialNumbers {
    static boolean isArmstrong(int n) {
        return false; // TODO: sum of digits^(number of digits) == n
    }

    static boolean isPerfect(int n) {
        return false; // TODO: sum of divisors (excluding n) == n
    }

    public static void main(String[] args) {
        System.out.print("Armstrong:");
        for (int i = 1; i <= 999; i++) {
            if (isArmstrong(i)) System.out.print(" " + i);
        }
        System.out.println();
        System.out.print("Perfect:");
        for (int i = 1; i <= 10000; i++) {
            if (isPerfect(i)) System.out.print(" " + i);
        }
        System.out.println();
    }
}
```

**Expected output**

```text
Armstrong: 1 2 3 4 5 6 7 8 9 153 370 371 407
Perfect: 6 28 496 8128
```

<!-- hints -->
- Count the digits first (loop dividing a **copy** of `n` by 10), then loop over the digits again adding `Math.pow(digit, digits)`.
- `Math.pow` returns a `double`: keep the sum as an `int` with `sum += (int) Math.pow(d, digits);`
- Perfect: add every `i` from 1 to `n / 2` where `n % i == 0`. 1 has no divisors smaller than itself, so it isn't perfect: return `false` for `n < 2`.

<!-- solution -->
```java
public class SpecialNumbers {
    static boolean isArmstrong(int n) {
        int digits = 0;
        for (int x = n; x > 0; x /= 10) {
            digits++;
        }
        int sum = 0;
        for (int x = n; x > 0; x /= 10) {
            int d = x % 10;
            sum += (int) Math.pow(d, digits);
        }
        return sum == n;
    }

    static boolean isPerfect(int n) {
        if (n < 2) return false;
        int sum = 0;
        for (int i = 1; i <= n / 2; i++) {
            if (n % i == 0) sum += i;
        }
        return sum == n;
    }

    public static void main(String[] args) {
        System.out.print("Armstrong:");
        for (int i = 1; i <= 999; i++) {
            if (isArmstrong(i)) System.out.print(" " + i);
        }
        System.out.println();
        System.out.print("Perfect:");
        for (int i = 1; i <= 10000; i++) {
            if (isPerfect(i)) System.out.print(" " + i);
        }
        System.out.println();
    }
}
```

Using `for (int x = n; x > 0; x /= 10)` gives each loop its own copy `x`, so `n` is still available for the final comparison. Single-digit numbers are Armstrong numbers trivially (d¹ = d).

<!-- exercise: b10_e3 | Easy | GCD and LCM -->
**Concepts:** Euclid's algorithm · reusing one method in another · avoiding overflow

**Task.** Write `gcd(int a, int b)` with Euclid's algorithm and `lcm(int a, int b)` using `gcd`, and print both for the pairs below.

**Starter code** · `GcdLcm.java`

```java
public class GcdLcm {
    static int gcd(int a, int b) {
        return 1; // TODO: while (b != 0) { ... }
    }

    static long lcm(int a, int b) {
        return 0; // TODO: use gcd
    }

    public static void main(String[] args) {
        int[][] pairs = {{12, 18}, {7, 13}, {100, 75}, {21, 6}};
        for (int[] p : pairs) {
            System.out.println("gcd(" + p[0] + ", " + p[1] + ") = " + gcd(p[0], p[1])
                    + ", lcm = " + lcm(p[0], p[1]));
        }
    }
}
```

**Expected output**

```text
gcd(12, 18) = 6, lcm = 36
gcd(7, 13) = 1, lcm = 91
gcd(100, 75) = 25, lcm = 300
gcd(21, 6) = 3, lcm = 42
```

<!-- hints -->
- Euclid: `int r = a % b; a = b; b = r;` until `b` is 0. Then `a` is the GCD.
- It works whichever number is bigger: if `a < b`, the first round just swaps them.
- `lcm = a / gcd(a, b) * b`, computed in `long`. Dividing first keeps the numbers smaller.

<!-- solution -->
```java
public class GcdLcm {
    static int gcd(int a, int b) {
        while (b != 0) {
            int r = a % b;
            a = b;
            b = r;
        }
        return a;
    }

    static long lcm(int a, int b) {
        return (long) a / gcd(a, b) * b;
    }

    public static void main(String[] args) {
        int[][] pairs = {{12, 18}, {7, 13}, {100, 75}, {21, 6}};
        for (int[] p : pairs) {
            System.out.println("gcd(" + p[0] + ", " + p[1] + ") = " + gcd(p[0], p[1])
                    + ", lcm = " + lcm(p[0], p[1]));
        }
    }
}
```

Two numbers with GCD 1 (like 7 and 13) are called *coprime*; their LCM is simply their product. Euclid's algorithm needs very few rounds even for huge numbers, which you'll be able to explain after Day 11.
