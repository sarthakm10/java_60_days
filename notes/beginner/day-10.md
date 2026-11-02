# Day 10 — Logic Building Practice

> No new syntax today. Just problems. This is the day where loops, conditions and methods start to feel natural.

**Today's goal:** solve classic number problems by breaking them into small steps, then check yourself on everything from Phase 1.

**How to solve a problem you've never seen:**

1. **Do it by hand** with a small example. Write every step down.
2. **Spot the repetition**: that's your loop. Spot the decisions: those are your `if`s.
3. **Name the variables** you used on paper (`reversed`, `digit`, `count`…).
4. **Write it in Java**, in a method that takes the input and returns the answer.
5. **Test** with normal, smallest (0, 1) and awkward (negative, very large) inputs.

The trick from Day 5 powers most of today's problems:

```java
int digit = n % 10;   // the last digit
n = n / 10;           // drop the last digit
```

<!-- topic: b10_t1 -->
## 🧮 Practice — Number Problems

<!-- subtopic: b10_t1_s1 -->
### Reverse a number; palindrome numbers

Reverse 1234 into 4321. By hand: take the last digit (4), then the next (3)… and each time, shift what you have one place left and add the new digit.

| n | digit = n % 10 | reversed = reversed × 10 + digit |
|---|---|---|
| 1234 | 4 | 4 |
| 123 | 3 | 43 |
| 12 | 2 | 432 |
| 1 | 1 | 4321 |
| 0 | — | loop ends |

```java
static int reverse(int n) {
    int reversed = 0;
    while (n > 0) {
        reversed = reversed * 10 + n % 10;
        n /= 10;
    }
    return reversed;
}
```

A **palindrome number** reads the same both ways (121, 1331, 7). That's simply `n == reverse(n)`. Notice the method reuse: once `reverse` works, the palindrome check is one line.

<details>
<summary>What is the key step for building the reversed number?</summary>

`reversed = reversed * 10 + digit`: shift the existing digits one place left and add the new last digit.
</details>

<!-- subtopic: b10_t1_s2 -->
### Fibonacci series

Each number is the sum of the two before it: 0, 1, 1, 2, 3, 5, 8, 13, 21, …

On paper you only ever look at **the last two numbers**. So you need two variables, and on each step you slide them forward:

```java
static void printFibonacci(int count) {
    long a = 0, b = 1;
    for (int i = 0; i < count; i++) {
        System.out.print(a + " ");
        long next = a + b;
        a = b;
        b = next;
    }
}
```

With `count = 10`: `0 1 1 2 3 5 8 13 21 34`.

The `next` temporary is the same idea as the swap on Day 2. Using `long` because Fibonacci numbers grow fast (the 50th is over 12 billion). On Day 14 you'll write it recursively and see why that version is dramatically slower.

<!-- subtopic: b10_t1_s3 -->
### GCD and LCM

The **GCD** (greatest common divisor) of 12 and 18 is 6. The **LCM** (least common multiple) is 36.

The slow way: try every number from `min(a, b)` downwards. The fast way is **Euclid's algorithm**, over 2000 years old: the GCD of `a` and `b` equals the GCD of `b` and `a % b`, until the remainder is 0.

| a | b | a % b |
|---|---|---|
| 18 | 12 | 6 |
| 12 | 6 | 0 |
| 6 | 0 | → GCD is 6 |

```java
static int gcd(int a, int b) {
    while (b != 0) {
        int r = a % b;
        a = b;
        b = r;
    }
    return a;
}

static long lcm(int a, int b) {
    return (long) a / gcd(a, b) * b;    // divide first so the multiplication can't overflow as easily
}
```

<details>
<summary>How is LCM computed from GCD?</summary>

`lcm(a, b) = a / gcd(a, b) * b` (the same as a × b / gcd, with the division done first).
</details>

<!-- subtopic: b10_t1_s4 -->
### Armstrong and perfect numbers

An **Armstrong number** equals the sum of its digits, each raised to the power of the number of digits. 153 has 3 digits: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153 ✓. Steps: count the digits (Day 5), then loop over the digits again adding `Math.pow(digit, count)`.

Careful: the counting loop destroys `n` (it divides it down to 0), so **copy `n` first** and loop over the copy.

A **perfect number** equals the sum of its divisors excluding itself: 28 = 1 + 2 + 4 + 7 + 14 ✓. Loop `i` from 1 to `n / 2`, add every `i` where `n % i == 0`.

Three-digit Armstrong numbers: 153, 370, 371, 407. Perfect numbers below 10,000: 6, 28, 496, 8128. 👉 Exercise 2 in **Code Practice** finds them all.

<!-- subtopic: b10_t1_s5 -->
### FizzBuzz

The most famous beginner interview question. For 1 to 100: print `Fizz` for multiples of 3, `Buzz` for multiples of 5, `FizzBuzz` for multiples of both, and the number otherwise.

The trap is the order of checks. If you test `% 3` first, 15 prints `Fizz` and never reaches `FizzBuzz`. Check the **most specific** case first:

```java
for (int i = 1; i <= 100; i++) {
    if (i % 15 == 0) {
        System.out.println("FizzBuzz");
    } else if (i % 3 == 0) {
        System.out.println("Fizz");
    } else if (i % 5 == 0) {
        System.out.println("Buzz");
    } else {
        System.out.println(i);
    }
}
```

(Same lesson as the grades on Day 4: in an `else if` chain, order matters.) 👉 Exercise 1 in **Code Practice** combines today's problems.

<!-- topic: b10_t2 -->
## ☕ Java — Phase 1 Check-in

<!-- subtopic: b10_t2_s1 -->
### Write the basics from memory

Close the notes. In a new file, without looking anything up, write:

1. A variable of each type: `int`, `double`, `boolean`, `char`, `String`.
2. An `if / else if / else` that classifies a number as negative, zero or positive.
3. A `for` loop that prints 10 down to 1, and a `while` loop that sums the digits of a number.
4. A method `static int max(int[] arr)` that returns the largest element.
5. An array of 5 names, printed with `Arrays.toString`.

Then compile. Every error message you get points at something to review, which is exactly the point of this exercise.

<!-- subtopic: b10_t2_s2 -->
### Explain it out loud

Explaining something is the best test of understanding. Say each answer out loud in two or three sentences, as if teaching a friend, then open the flashcard to check.

<details>
<summary>What is the difference between the JDK and the JVM?</summary>

The JVM runs compiled bytecode. The JDK is the developer kit: it includes the JVM plus tools like the compiler (`javac`) used to turn source code into bytecode.
</details>

<details>
<summary>When would you choose double over int?</summary>

When the value can have a fractional part (prices, averages, measurements). Use `int` for counts and whole numbers. Remember `int / int` drops decimals.
</details>

<details>
<summary>Why compare Strings with equals() and not ==?</summary>

`==` checks whether two references point to the same object; `equals()` checks whether the text is the same. Two different String objects can hold the same text.
</details>

<details>
<summary>What happens to the caller's int variable when a method changes its parameter?</summary>

Nothing. Java passes a copy of the value, so only the method's copy changes. Return the new value instead.
</details>

<details>
<summary>for loop, while loop or do-while: how do you choose?</summary>

`for` when you know the number of rounds or are counting through a range; `while` when you repeat until something happens; `do-while` when the body must run at least once.
</details>

## 📝 Day 10 Recap

1. Last digit of n? → **n % 10**
2. Drop the last digit of n? → **n / 10**
3. Build the reverse of n? → **reversed = reversed * 10 + digit, in a loop**
4. Next Fibonacci number? → **the sum of the previous two**
5. Euclid's algorithm in one line? → **gcd(a, b) = gcd(b, a % b), until b is 0**
6. lcm(a, b) using gcd? → **a / gcd(a, b) * b**
7. Is 153 an Armstrong number? → **yes: 1³ + 5³ + 3³ = 153**
8. Is 28 a perfect number? → **yes: 1 + 2 + 4 + 7 + 14 = 28**
9. In FizzBuzz, which check goes first? → **divisible by 15 (both 3 and 5)**
10. First step for any new problem? → **solve a small example by hand**
