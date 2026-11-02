# Day 37 — Optional, Dates and Modern Java Features

> A tour day: lots of small features you'll use and see in real code. Read each 🌱 **In simple words** box; skim the details.

**Today's goal:** handle "maybe no value" with `Optional`, work with dates and times correctly, and recognise the features added in Java 10 to 21.

<!-- topic: b37_t1 -->
## ☕ Java — Optional, Date/Time & Java 10–21

<!-- intro: d6_t1_s1 -->
Day 13 showed that `null` causes crashes. **`Optional<T>`** is a box that **either holds a value or is empty**, and it makes "might be missing" visible in a method's return type: `Optional<Student> findByName(String name)` tells callers "check before using". Create one with `Optional.of(x)`, `Optional.ofNullable(maybeNull)` or `Optional.empty()`, and get the value out safely with `orElse(default)`, `orElseGet(...)` or `orElseThrow()`.

<!-- intro: d6_t1_s2 -->
Instead of unpacking an Optional with `if`, chain steps on it the way you chain stream steps: `map` transforms the value if there is one, `filter` keeps it only if it passes a test, and `ifPresent` runs code only when a value exists. Avoid calling `get()` without checking: on an empty Optional it throws, which is a NullPointerException with extra steps.

<!-- intro: d6_t1_s3 -->
The one line to remember: `Optional.ofNullable(user).map(User::getEmail).orElse("N/A")` means "the user's email, or N/A if there's no user or no email". No null checks, no crash.

<!-- intro: d6_t1_s5 -->
Dates are harder than they look (time zones, leap years, daylight saving). Use the `java.time` classes: `LocalDate` for a date (birthday), `LocalTime` for a time of day, `LocalDateTime` for both, and `ZonedDateTime` when the time zone matters (a flight's departure). They're **immutable** (Day 20): `date.plusDays(7)` returns a new date and leaves the original alone, just like Strings.

<!-- intro: d6_t1_s6 -->
`Duration` measures time in hours, minutes and seconds ("this request took 250 ms"); `Period` measures calendar time in years, months and days ("age: 21 years, 3 months"). `DateTimeFormatter` turns dates into text and back: `DateTimeFormatter.ofPattern("dd/MM/yyyy")`.

<!-- intro: d6_t1_s7 -->
Small conveniences from Java 10–11: `var` for local variables (Day 2), handy String methods (`isBlank`, `strip`, `lines`, `repeat`) and one-line file reading and writing (`Files.readString`, `Files.writeString`).

<!-- intro: d6_t1_s9 -->
You learned the arrow `switch` on Day 4; this section shows its full power as an **expression** that returns a value, including `yield` for multi-line cases. A quick revision.

<!-- intro: d7_t4_s1 -->
Java 21 combines switch with records and sealed types (Day 20): `switch (shape) { case Circle c -> ...; case Square s -> ...; }` picks a branch by the object's **type** and gives you a typed variable, like `instanceof` with pattern matching (Day 17) for many types at once. It also adds `getFirst()` / `getLast()` / `reversed()` to lists.

<!-- intro: d7_t4_s2 -->
Java releases a new version every six months, and every two years one is an **LTS** (long-term support) release that companies actually upgrade to: 8, 11, 17, 21 and 25. You're learning Java 21. When interviewers ask "which Java version have you used?", knowing what each LTS added is a plus.

<!-- topic: b37_t2 -->
## 🧮 DSA — Dynamic Programming: Medium (1D)

The same DP questions from Day 36, on harder problems where `dp[i]` depends on **many** earlier answers, not just the last two. Coin Change: the fewest coins to make amount `i` is 1 + the best answer for `i − coin`, tried for each coin. Longest Increasing Subsequence: the best length ending at `i` looks back at every earlier, smaller element. Word Break: can the first `i` letters be split into dictionary words? Write what `dp[i]` means in one sentence before coding; that sentence is most of the solution.

## 📝 Day 37 Recap

1. What is an Optional? → **a box that either holds a value or is empty**
2. Create an Optional from something that may be null? → **Optional.ofNullable(x)**
3. Get the value or a default? → **orElse(default)**
4. Why avoid get() without a check? → **it throws on an empty Optional**
5. Class for a date without time? → **LocalDate**
6. Are java.time objects mutable? → **no, they're immutable; plusDays returns a new date**
7. Duration vs Period? → **Duration is time-based (hours, seconds); Period is date-based (years, months, days)**
8. Java LTS versions? → **8, 11, 17, 21 and 25**
9. Pattern matching for switch lets you? → **choose a branch by an object's type and get a typed variable**
10. Coin Change recurrence? → **dp[i] = 1 + min(dp[i - coin]) over all coins**
