Complexity in practice. Instead of timing programs (which depends on your computer), these exercises **count steps**, so everyone gets the same numbers and you can see each growth rate with your own eyes.

<!-- exercise: b11_e1 | Easy | Count the steps -->
**Concepts:** O(1), O(log n), O(n), O(n log n), O(n²) · counting loop rounds

**Task.** Each method below runs a loop shape from today's notes and returns how many times its innermost line ran. Fill in the loops, then look at the table: how does each column change when n goes from 16 to 1024 (64 times bigger)?

**Starter code** · `CountSteps.java`

```java
public class CountSteps {
    static long constant(int n) { return 0; }   // TODO: no loop: 1 step
    static long logarithmic(int n) { return 0; } // TODO: for (int i = 1; i < n; i *= 2)
    static long linear(int n) { return 0; }      // TODO: for (int i = 0; i < n; i++)
    static long nLogN(int n) { return 0; }       // TODO: linear loop with a doubling loop inside
    static long quadratic(int n) { return 0; }   // TODO: two nested loops of n

    public static void main(String[] args) {
        System.out.println("n | O(1) | O(log n) | O(n) | O(n log n) | O(n^2)");
        for (int n : new int[]{16, 1024}) {
            System.out.println(n + " | " + constant(n) + " | " + logarithmic(n) + " | " + linear(n)
                    + " | " + nLogN(n) + " | " + quadratic(n));
        }
    }
}
```

**Expected output**

```text
n | O(1) | O(log n) | O(n) | O(n log n) | O(n^2)
16 | 1 | 4 | 16 | 64 | 256
1024 | 1 | 10 | 1024 | 10240 | 1048576
```

<!-- hints -->
- Use a `long steps = 0;` counter and `steps++` as the innermost line of each loop.
- Doubling loop: `for (int i = 1; i < n; i *= 2) steps++;` runs log₂ n times (4 for 16, because 16 = 2⁴).
- n log n: put the doubling loop **inside** a loop that runs n times.

<!-- solution -->
```java
public class CountSteps {
    static long constant(int n) {
        return 1;
    }

    static long logarithmic(int n) {
        long steps = 0;
        for (int i = 1; i < n; i *= 2) steps++;
        return steps;
    }

    static long linear(int n) {
        long steps = 0;
        for (int i = 0; i < n; i++) steps++;
        return steps;
    }

    static long nLogN(int n) {
        long steps = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < n; j *= 2) steps++;
        }
        return steps;
    }

    static long quadratic(int n) {
        long steps = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) steps++;
        }
        return steps;
    }

    public static void main(String[] args) {
        System.out.println("n | O(1) | O(log n) | O(n) | O(n log n) | O(n^2)");
        for (int n : new int[]{16, 1024}) {
            System.out.println(n + " | " + constant(n) + " | " + logarithmic(n) + " | " + linear(n)
                    + " | " + nLogN(n) + " | " + quadratic(n));
        }
    }
}
```

When n grew 64×: O(1) didn't change, O(log n) went from 4 to 10, O(n) grew 64×, O(n log n) 160×, and O(n²) **4096×**. Try n = 1,000,000 for the first four columns (leave O(n²) out: it would need a trillion steps).

<!-- exercise: b11_e2 | Easy | Faster solutions with maths -->
**Concepts:** O(n) → O(1) with a formula · O(n) → O(√n) for prime checks · `long` to avoid overflow

**Task.** Compute the sum 1 + … + n with a loop and with the formula `n(n + 1) / 2`, and check whether numbers are prime by trying divisors up to n − 1 (slow) and up to √n (fast). Print the answers **and the number of loop rounds** each version needed.

**Starter code** · `FasterMaths.java`

```java
public class FasterMaths {
    static long rounds;   // each method sets this so main can print it

    static long sumLoop(int n) { rounds = 0; return 0; }       // TODO
    static long sumFormula(int n) { rounds = 0; return 0; }    // TODO: no loop
    static boolean isPrimeSlow(long n) { rounds = 0; return false; }   // TODO: divisors 2..n-1
    static boolean isPrimeFast(long n) { rounds = 0; return false; }   // TODO: i * i <= n

    public static void main(String[] args) {
        int n = 100000;
        System.out.println("loop:    " + sumLoop(n) + " in " + rounds + " rounds");
        System.out.println("formula: " + sumFormula(n) + " in " + rounds + " rounds");
        long p = 1000003;
        System.out.println("slow: " + isPrimeSlow(p) + " in " + rounds + " rounds");
        System.out.println("fast: " + isPrimeFast(p) + " in " + rounds + " rounds");
        long q = 1000001;
        System.out.println("slow: " + isPrimeSlow(q) + " in " + rounds + " rounds");
        System.out.println("fast: " + isPrimeFast(q) + " in " + rounds + " rounds");
    }
}
```

**Expected output**

```text
loop:    5000050000 in 100000 rounds
formula: 5000050000 in 0 rounds
slow: true in 1000001 rounds
fast: true in 999 rounds
slow: false in 100 rounds
fast: false in 100 rounds
```

<!-- hints -->
- The sum of 1..100000 is about 5 billion: too big for `int`. Use a `long` total, and in the formula cast first: `(long) n * (n + 1) / 2`.
- Count `rounds++` once per loop iteration, including the iteration that finds a divisor.
- 1000001 = 101 × 9901, so both versions stop at the divisor 101 after 100 rounds. The √n trick only matters when there is no small divisor: for primes, that's every time.

<!-- solution -->
```java
public class FasterMaths {
    static long rounds;

    static long sumLoop(int n) {
        rounds = 0;
        long total = 0;
        for (int i = 1; i <= n; i++) {
            rounds++;
            total += i;
        }
        return total;
    }

    static long sumFormula(int n) {
        rounds = 0;
        return (long) n * (n + 1) / 2;
    }

    static boolean isPrimeSlow(long n) {
        rounds = 0;
        if (n < 2) return false;
        for (long i = 2; i < n; i++) {
            rounds++;
            if (n % i == 0) return false;
        }
        return true;
    }

    static boolean isPrimeFast(long n) {
        rounds = 0;
        if (n < 2) return false;
        for (long i = 2; i * i <= n; i++) {
            rounds++;
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        int n = 100000;
        System.out.println("loop:    " + sumLoop(n) + " in " + rounds + " rounds");
        System.out.println("formula: " + sumFormula(n) + " in " + rounds + " rounds");
        long p = 1000003;
        System.out.println("slow: " + isPrimeSlow(p) + " in " + rounds + " rounds");
        System.out.println("fast: " + isPrimeFast(p) + " in " + rounds + " rounds");
        long q = 1000001;
        System.out.println("slow: " + isPrimeSlow(q) + " in " + rounds + " rounds");
        System.out.println("fast: " + isPrimeFast(q) + " in " + rounds + " rounds");
    }
}
```

The formula needs no loop at all: O(1). For the prime 1,000,003, the fast check tries 999 divisors instead of a million: O(√n) instead of O(n). (`rounds` is a `static` variable shared by the whole class; you'll learn exactly what that means on Day 15.)
