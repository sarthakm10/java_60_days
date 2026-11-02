The mini project. An interactive game is hard to check automatically, so the exercise below builds the game's **logic** as methods you can test, and the solution ends with the full playable game that uses them. Commit your work to Git as you go (see today's notes).

<!-- exercise: b12_e1 | Medium | Guess the Number: game logic and a computer player -->
**Concepts:** methods that return results · input validation · a halving strategy · putting Phase 1 together

**Task.** Write two methods:

- `check(int secret, int guess)` returns `"Out of range"` for guesses outside 1–100, otherwise `"Too high"`, `"Too low"` or `"Correct"`.
- `computerPlays(int secret)` makes the computer guess the secret using `check` and returns how many guesses it needed. Its strategy: keep a range `low..high` (starting 1..100), always guess the middle, and shrink the range using the answer.

Then print the results for a few secrets and the worst case over all secrets from 1 to 100.

**Starter code** · `GuessTheNumber.java`

```java
public class GuessTheNumber {
    static String check(int secret, int guess) {
        return ""; // TODO
    }

    static int computerPlays(int secret) {
        int low = 1, high = 100, attempts = 0;
        // TODO: loop: guess the middle, check it, move low or high
        return attempts;
    }

    public static void main(String[] args) {
        System.out.println(check(42, 50) + ", " + check(42, 10) + ", " + check(42, 42) + ", " + check(42, 0));
        int[] secrets = {50, 37, 1, 100};
        for (int s : secrets) {
            System.out.println("Secret " + s + ": " + computerPlays(s) + " guesses");
        }
        int worst = 0;
        for (int s = 1; s <= 100; s++) {
            worst = Math.max(worst, computerPlays(s));
        }
        System.out.println("Worst case for 1-100: " + worst + " guesses");
    }
}
```

**Expected output**

```text
Too high, Too low, Correct, Out of range
Secret 50: 1 guesses
Secret 37: 3 guesses
Secret 1: 6 guesses
Secret 100: 7 guesses
Worst case for 1-100: 7 guesses
```

<!-- hints -->
- Validate first in `check`: `if (guess < 1 || guess > 100) return "Out of range";`
- The middle of the range is `(low + high) / 2`. On "Too high" the secret is smaller, so `high = guess - 1`; on "Too low", `low = guess + 1`.
- Loop with `while (true)` and `return attempts` as soon as `check` says `"Correct"`. Compare strings with `equals`, never `==`.
- Why 7? Every guess halves the range: 100 → 50 → 25 → 12 → 6 → 3 → 1. That's log₂ 100 ≈ 6.6, rounded up (Day 11).

<!-- solution -->
```java
public class GuessTheNumber {
    static String check(int secret, int guess) {
        if (guess < 1 || guess > 100) return "Out of range";
        if (guess > secret) return "Too high";
        if (guess < secret) return "Too low";
        return "Correct";
    }

    static int computerPlays(int secret) {
        int low = 1, high = 100, attempts = 0;
        while (true) {
            int guess = (low + high) / 2;
            attempts++;
            String answer = check(secret, guess);
            if (answer.equals("Correct")) {
                return attempts;
            } else if (answer.equals("Too high")) {
                high = guess - 1;
            } else {
                low = guess + 1;
            }
        }
    }

    public static void main(String[] args) {
        System.out.println(check(42, 50) + ", " + check(42, 10) + ", " + check(42, 42) + ", " + check(42, 0));
        int[] secrets = {50, 37, 1, 100};
        for (int s : secrets) {
            System.out.println("Secret " + s + ": " + computerPlays(s) + " guesses");
        }
        int worst = 0;
        for (int s = 1; s <= 100; s++) {
            worst = Math.max(worst, computerPlays(s));
        }
        System.out.println("Worst case for 1-100: " + worst + " guesses");
    }
}
```

The computer's strategy is **binary search**, which you'll study properly on Day 15. Because `check` is a separate method, the same logic serves the computer player and a human player.

**The full playable game.** Here's the interactive version built on the same `check` method, with attempt counting, input validation, play-again and a best score. Run it, play a few rounds, then push it to GitHub with a README.

```java
import java.util.Scanner;

public class GuessGame {
    static String check(int secret, int guess) {
        if (guess < 1 || guess > 100) return "Out of range";
        if (guess > secret) return "Too high";
        if (guess < secret) return "Too low";
        return "Correct";
    }

    static int playRound(Scanner in) {
        int secret = (int) (Math.random() * 100) + 1;
        int attempts = 0;
        System.out.println("I'm thinking of a number between 1 and 100.");
        while (true) {
            System.out.print("Your guess: ");
            int guess = in.nextInt();
            String answer = check(secret, guess);
            if (answer.equals("Out of range")) {
                System.out.println("Please guess between 1 and 100.");
                continue;                      // doesn't count as an attempt
            }
            attempts++;
            if (answer.equals("Correct")) {
                System.out.println("Correct! You got it in " + attempts + " tries.");
                return attempts;
            }
            System.out.println(answer + "!");
        }
    }

    static boolean askPlayAgain(Scanner in) {
        System.out.print("Play again? (y/n): ");
        String reply = in.next();
        return reply.equalsIgnoreCase("y");
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int best = Integer.MAX_VALUE;
        do {
            int attempts = playRound(in);
            best = Math.min(best, attempts);
            System.out.println("Best so far: " + best);
        } while (askPlayAgain(in));
        System.out.println("Thanks for playing!");
    }
}
```

`askPlayAgain` uses `next()` (one word) rather than `nextLine()`, which sidesteps the leftover-newline trap from Day 3.
