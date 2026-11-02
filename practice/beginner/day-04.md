Decisions. For each exercise, test the boundaries: the exact values where the answer changes (40, 75, 2000, 1900…). That's where bugs hide.

<!-- exercise: b4_e1 | Easy | Marks to grade, with if and with switch -->
**Concepts:** `if / else if / else` · order of checks · arrow `switch` expression

**Task.** Write two methods that turn marks (0–100) into a grade: 90+ `A`, 75–89 `B`, 60–74 `C`, 40–59 `D`, below 40 `F`, and anything outside 0–100 `Invalid`.

- `gradeWithIf` uses an `if / else if` chain.
- `gradeWithSwitch` uses an arrow `switch` on `marks / 10`, with a special check for 75–79 (which `marks / 10` can't tell apart from 70–74).

Both must give the same answers.

**Starter code** · `Grades.java`

```java
public class Grades {
    static String gradeWithIf(int marks) {
        // TODO
        return "?";
    }

    static String gradeWithSwitch(int marks) {
        if (marks < 0 || marks > 100) return "Invalid";
        // TODO: switch (marks / 10) { case 10, 9 -> ... }
        return "?";
    }

    public static void main(String[] args) {
        int[] tests = {100, 90, 89, 75, 74, 60, 59, 40, 39, 0, -5, 101};
        for (int m : tests) {
            System.out.println(m + " -> " + gradeWithIf(m) + " / " + gradeWithSwitch(m));
        }
    }
}
```

**Expected output**

```text
100 -> A / A
90 -> A / A
89 -> B / B
75 -> B / B
74 -> C / C
60 -> C / C
59 -> D / D
40 -> D / D
39 -> F / F
0 -> F / F
-5 -> Invalid / Invalid
101 -> Invalid / Invalid
```

<!-- hints -->
- Check the invalid range first, then go from the highest grade down: `marks >= 90`, then `marks >= 75`…
- In the switch, `marks / 10` turns 75 into 7, and so does 74. Handle case 7 with a ternary: `case 7 -> marks >= 75 ? "B" : "C";`
- A `return` inside each branch means you don't need a variable.

<!-- solution -->
```java
public class Grades {
    static String gradeWithIf(int marks) {
        if (marks < 0 || marks > 100) {
            return "Invalid";
        } else if (marks >= 90) {
            return "A";
        } else if (marks >= 75) {
            return "B";
        } else if (marks >= 60) {
            return "C";
        } else if (marks >= 40) {
            return "D";
        } else {
            return "F";
        }
    }

    static String gradeWithSwitch(int marks) {
        if (marks < 0 || marks > 100) return "Invalid";
        return switch (marks / 10) {
            case 10, 9 -> "A";
            case 8 -> "B";
            case 7 -> marks >= 75 ? "B" : "C";
            case 6 -> "C";
            case 5, 4 -> "D";
            default -> "F";
        };
    }

    public static void main(String[] args) {
        int[] tests = {100, 90, 89, 75, 74, 60, 59, 40, 39, 0, -5, 101};
        for (int m : tests) {
            System.out.println(m + " -> " + gradeWithIf(m) + " / " + gradeWithSwitch(m));
        }
    }
}
```

The `if` chain handles ranges naturally; the `switch` needs a trick for boundaries that aren't multiples of 10. Testing exactly at the boundaries (89/90, 74/75, 39/40) is what catches mistakes.

<!-- exercise: b4_e2 | Easy | Leap years and days in a month -->
**Concepts:** combining conditions with `&&` and `||` · `switch` with grouped cases

**Task.** Write `isLeap(int year)` and `daysInMonth(int month, int year)` (February has 29 days in a leap year). Invalid months return 0.

**Starter code** · `Calendar.java`

```java
public class Calendar {
    static boolean isLeap(int year) {
        return false; // TODO: one boolean expression
    }

    static int daysInMonth(int month, int year) {
        return 0; // TODO: an arrow switch on month
    }

    public static void main(String[] args) {
        int[] years = {2024, 2023, 1900, 2000};
        for (int y : years) {
            System.out.println(y + " leap? " + isLeap(y));
        }
        System.out.println("Feb 2024: " + daysInMonth(2, 2024));
        System.out.println("Feb 2023: " + daysInMonth(2, 2023));
        System.out.println("Apr 2023: " + daysInMonth(4, 2023));
        System.out.println("Dec 2023: " + daysInMonth(12, 2023));
        System.out.println("Month 13: " + daysInMonth(13, 2023));
    }
}
```

**Expected output**

```text
2024 leap? true
2023 leap? false
1900 leap? false
2000 leap? true
Feb 2024: 29
Feb 2023: 28
Apr 2023: 30
Dec 2023: 31
Month 13: 0
```

<!-- hints -->
- Leap: divisible by 4 and not by 100, **or** divisible by 400: `(year % 4 == 0 && year % 100 != 0) || year % 400 == 0`.
- Group months in one case: `case 4, 6, 9, 11 -> 30;`
- February: `case 2 -> isLeap(year) ? 29 : 28;` (a method can call another method).

<!-- solution -->
```java
public class Calendar {
    static boolean isLeap(int year) {
        return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    }

    static int daysInMonth(int month, int year) {
        return switch (month) {
            case 1, 3, 5, 7, 8, 10, 12 -> 31;
            case 4, 6, 9, 11 -> 30;
            case 2 -> isLeap(year) ? 29 : 28;
            default -> 0;
        };
    }

    public static void main(String[] args) {
        int[] years = {2024, 2023, 1900, 2000};
        for (int y : years) {
            System.out.println(y + " leap? " + isLeap(y));
        }
        System.out.println("Feb 2024: " + daysInMonth(2, 2024));
        System.out.println("Feb 2023: " + daysInMonth(2, 2023));
        System.out.println("Apr 2023: " + daysInMonth(4, 2023));
        System.out.println("Dec 2023: " + daysInMonth(12, 2023));
        System.out.println("Month 13: " + daysInMonth(13, 2023));
    }
}
```

`isLeap` returns the condition itself: there's no need for `if (...) return true; else return false;`.

<!-- exercise: b4_e3 | Medium | Cinema ticket price -->
**Concepts:** nested decisions · applying rules in the right order

**Task.** Write `ticketPrice(int age, boolean isWeekend, boolean isStudent)` using these rules:

1. Children under 3 go free (price 0), whatever the day.
2. The base price is 200 on weekdays and 250 at weekends.
3. Children (3–12) and seniors (60+) pay half the base price.
4. Students aged 13–25 get 50 off the base price, but **only on weekdays**.
5. Only one discount applies: the age discount wins over the student discount.

**Starter code** · `Tickets.java`

```java
public class Tickets {
    static int ticketPrice(int age, boolean isWeekend, boolean isStudent) {
        return 0; // TODO
    }

    public static void main(String[] args) {
        System.out.println(ticketPrice(2, true, false));
        System.out.println(ticketPrice(8, false, false));
        System.out.println(ticketPrice(8, true, true));
        System.out.println(ticketPrice(20, false, true));
        System.out.println(ticketPrice(20, true, true));
        System.out.println(ticketPrice(30, false, false));
        System.out.println(ticketPrice(65, true, false));
    }
}
```

**Expected output**

```text
0
100
125
150
250
200
125
```

<!-- hints -->
- Handle the "free" rule first and `return 0` straight away.
- Compute the base price with a ternary: `int base = isWeekend ? 250 : 200;`
- Then one `if / else if / else`: age discount first, student discount second, otherwise the base price.

<!-- solution -->
```java
public class Tickets {
    static int ticketPrice(int age, boolean isWeekend, boolean isStudent) {
        if (age < 3) {
            return 0;
        }
        int base = isWeekend ? 250 : 200;
        if (age <= 12 || age >= 60) {
            return base / 2;
        } else if (isStudent && age >= 13 && age <= 25 && !isWeekend) {
            return base - 50;
        } else {
            return base;
        }
    }

    public static void main(String[] args) {
        System.out.println(ticketPrice(2, true, false));
        System.out.println(ticketPrice(8, false, false));
        System.out.println(ticketPrice(8, true, true));
        System.out.println(ticketPrice(20, false, true));
        System.out.println(ticketPrice(20, true, true));
        System.out.println(ticketPrice(30, false, false));
        System.out.println(ticketPrice(65, true, false));
    }
}
```

Handling the special case first with an early `return` keeps the rest flat. The order of the `else if` branches is what makes "age discount wins" true: an 8-year-old student never reaches the student check.
