# Day 11 — Time Complexity: How Fast Is My Code?

> Two programs can give the same answer, and one can take a second while the other takes a week. Today you learn to tell them apart before running anything.

**Today's goal:** describe how a program's running time grows with its input using Big-O, recognise the common growth rates from the shape of the loops, and know what "space complexity" means.

<!-- topic: b11_t1 -->
## 🧮 DSA — Complexity Analysis

<!-- subtopic: d1_t2_s1 -->
### Big-O notation: counting how work grows

Timing a program with a stopwatch depends on the computer, the input and luck. Instead, we ask a better question:

> **If the input gets 10 times bigger, how much more work does the program do?**

That growth pattern is described with **Big-O** notation. `n` stands for the input size (the length of the array, the number you loop up to…).

Count the "steps" each loop does:

```java
// 1. Sum of an array: one pass
int sum = 0;
for (int i = 0; i < n; i++) {
    sum += arr[i];            // runs n times
}
```

`n` steps. Double the array, double the work. That's **O(n)**, "linear".

```java
// 2. Every pair: a loop inside a loop
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
        System.out.println(arr[i] + arr[j]);   // runs n × n times
    }
}
```

`n²` steps. Double the array, **four times** the work. That's **O(n²)**, "quadratic".

```java
// 3. One lookup
int first = arr[0];           // 1 step, whatever n is
```

**O(1)**, "constant": the work doesn't grow at all.

**The rules for writing Big-O:**

1. **Drop constants.** A loop that does 3 things per round is `3n` steps: still **O(n)**. Big-O cares about the *shape* of growth, not the exact count.
2. **Keep only the biggest term.** `n² + n + 5` behaves like `n²` when n is large (for n = 1000: 1,000,000 vs 1,005), so it's **O(n²)**.
3. **Loops one after another add; loops inside each other multiply.** Two separate loops over n: `n + n` = **O(n)**. A loop inside a loop: `n × n` = **O(n²)**.

```java
for (int i = 0; i < n; i++) { ... }        // n
for (int j = 0; j < n; j++) { ... }        // + n   → O(n) in total

for (int i = 0; i < n; i++) {
    for (int j = 0; j < 10; j++) { ... }   // inner loop is a fixed 10 → 10n → O(n)
}
```

The last example is a common trick question: the inner loop doesn't depend on `n`, so it's a constant.

<details>
<summary>Two separate (not nested) loops each run n times. What is the Big-O?</summary>

O(n). They add (n + n = 2n), and constants are dropped.
</details>

<details>
<summary>Why is n² + 100n written as O(n²)?</summary>

For large n the n² term dominates completely, so Big-O keeps only the fastest-growing term.
</details>

<!-- subtopic: d1_t2_s2 -->
### The common complexities, with examples

From fastest to slowest:

| Big-O | Name | Typical shape | Example | n = 1,000,000 → roughly |
|---|---|---|---|---|
| **O(1)** | constant | no loop | `arr[5]`, `n % 2` | 1 step |
| **O(log n)** | logarithmic | the range **halves** each round | binary search (Day 15) | 20 steps |
| **O(n)** | linear | one loop over the input | sum, max, linear search | 1 million |
| **O(n log n)** | linearithmic | good sorting | `Arrays.sort` (Day 20) | 20 million |
| **O(n²)** | quadratic | loop inside a loop | all pairs, simple sorts | 1 trillion ❌ |
| **O(2ⁿ)** | exponential | trying every combination | naive recursive Fibonacci (Day 14) | impossible |

A computer does very roughly **100 million simple steps per second**. So with n = 1,000,000, an O(n) solution takes about a hundredth of a second, while an O(n²) one needs hours. That's why interviewers ask for complexity.

**Where does log n come from?** When the work **halves** every round:

```java
for (int i = n; i > 1; i = i / 2) {   // n, n/2, n/4, … 1
    count++;
}
```

How many times can you halve 1,000,000 before reaching 1? About 20 (because 2²⁰ ≈ 1,000,000). That's log₂ n. It grows incredibly slowly: a billion items need only about 30 halvings.

A loop that **multiplies** (`i = i * 2`) or **divides** its counter is logarithmic; one that **adds** (`i++`, `i += 2`) is linear.

**Recognise these at a glance:**

```java
for (int i = 0; i < n; i++)               // O(n)
for (int i = 0; i < n; i += 2)            // O(n)   (n/2 rounds; drop the ½)
for (int i = 1; i < n; i *= 2)            // O(log n)
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)           // O(n²)
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++)           // O(n²)  (n + (n−1) + … + 1 = n(n+1)/2 rounds)
for (int i = 0; i < n; i++)
    for (int j = 1; j < n; j *= 2)        // O(n log n)
```

<details>
<summary>What is the complexity of for (int i = 1; i < n; i *= 2)?</summary>

O(log n). `i` doubles each round, so it reaches n after about log₂ n rounds.
</details>

<details>
<summary>Roughly how many steps is O(log n) for n = 1,000,000?</summary>

About 20, because 2²⁰ ≈ 1,000,000.
</details>

<!-- subtopic: d1_t2_s3 -->
### Space complexity: how much extra memory

Time isn't the only cost. **Space complexity** measures how much **extra memory** a solution needs as the input grows (not counting the input itself; this is called *auxiliary* space).

```java
// O(1) space: a few variables, whatever the array size
static int sum(int[] arr) {
    int total = 0;
    for (int x : arr) total += x;
    return total;
}

// O(n) space: a new array as big as the input
static int[] doubled(int[] arr) {
    int[] result = new int[arr.length];
    for (int i = 0; i < arr.length; i++) result[i] = arr[i] * 2;
    return result;
}
```

**Reversing an array** shows the trade-off nicely:

- Copy it backwards into a new array: O(n) time, **O(n)** extra space.
- Swap from both ends towards the middle (that's the Day 7 problem): O(n) time, **O(1)** extra space. Better.

Method calls use space too: each call that's still running has a frame on the call stack (Day 6). A method that calls itself `n` levels deep (recursion, Day 14) uses **O(n)** stack space even if it has no arrays.

Often you can **trade space for time**: remembering things you've already seen (in an extra array or, later, a HashMap) can turn an O(n²) solution into O(n). You'll do exactly that with Two Sum on Day 27.

<details>
<summary>What is the extra space of reversing an array in place by swapping?</summary>

O(1). Only a couple of index variables and a temporary, no matter how big the array is.
</details>

<!-- subtopic: b11_t1_s4 -->
### Find the Big-O of loops you've written

Look back at your programs from Days 5–10 and write the complexity next to each. Some to start with:

| Program | Complexity | Why |
|---|---|---|
| Sum of 1 to N with a loop (Day 5) | O(n) | one loop of n rounds |
| Multiplication grid 1–10 (Day 5) | O(1)! | always exactly 100 rounds: it doesn't depend on any input |
| Star triangle with n rows (Day 5) | O(n²) | row r prints r stars: 1 + 2 + … + n ≈ n²/2 |
| Count digits of n (Day 5) | O(log n) | each round divides n by 10 |
| isPrime trying every divisor up to n (Day 6) | O(n) | |
| isPrime up to √n (Day 6) | O(√n) | the loop stops at i × i > n |
| Largest element of an array (Day 7) | O(n) | one pass |
| Euclid's GCD (Day 10) | O(log n) | the numbers shrink fast (at least halving every two steps) |

Notice "count digits" and "Euclid": loops that **divide** are logarithmic, even when it's not by 2. Dividing by 10 each round is log₁₀ n, and Big-O doesn't care about the base.

👉 Exercise 1 in **Code Practice** is a "guess the complexity, then measure it" lab.

<!-- topic: b11_t2 -->
## 🧮 Practice — Faster Solutions

<!-- subtopic: b11_t2_s1 -->
### Sum of 1 to N in O(1)

The loop version is O(n). The young mathematician Gauss noticed you can pair the numbers: 1 + 100, 2 + 99, 3 + 98… each pair sums to 101, and there are 50 pairs. In general:

```java
long sum = (long) n * (n + 1) / 2;    // O(1): one calculation, whatever n is
```

(The `(long)` cast stops `n * (n + 1)` overflowing an `int` for large n.) For n = 1,000,000,000 the loop takes a few seconds; the formula is instant. 👉 Exercise 2 in **Code Practice** counts the loop rounds each version needs.

<!-- subtopic: b11_t2_s2 -->
### Check primes faster with √n

If `n = a × b` and both `a` and `b` were bigger than √n, their product would be bigger than n. So **any divisor pair has one member ≤ √n**, and you only need to try divisors up to √n:

```java
static boolean isPrime(long n) {
    if (n < 2) return false;
    for (long i = 2; i * i <= n; i++) {   // i * i <= n avoids calling Math.sqrt
        if (n % i == 0) return false;
    }
    return true;
}
```

For n = 1,000,000,007 (a prime), the slow version tries about a billion divisors; this one tries about 31,623. That's O(n) → O(√n). 👉 Also in exercise 2.

## 📝 Day 11 Recap

1. What does Big-O describe? → **how the amount of work grows as the input size n grows**
2. One loop over n items? → **O(n)**
3. A loop inside a loop, both over n? → **O(n²)**
4. Two loops one after the other? → **O(n): they add, constants are dropped**
5. A loop whose counter doubles or halves? → **O(log n)**
6. Accessing arr[i]? → **O(1)**
7. Complexity of good sorting? → **O(n log n)**
8. Extra space of a method that makes a copy of the array? → **O(n)**
9. Sum 1..n in O(1)? → **n * (n + 1) / 2**
10. How far must a prime check try divisors? → **up to √n (i * i <= n)**
