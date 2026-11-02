Before you set up JUnit in a Maven project, build a tiny test runner yourself. It shows exactly what a test framework does, and makes JUnit's `assertEquals` and `assertThrows` feel obvious. Then try the same tests in a Maven project with JUnit (see today's notes).

<!-- exercise: b46_e1 | Easy | A tiny test runner, then find the bug -->
**Concepts:** what a test checks · expected vs actual · testing exceptions · boundary values

**Task.** Complete `assertEquals` and `assertThrows` so each one prints `PASS name` or `FAIL name: expected X but was Y`, and counts the results. The class under test, `Discount`, has **one bug** that the tests should reveal: after the runner works, fix the bug so all tests pass.

`Discount.priceAfter(price, coupon)` should give 10% off with `SAVE10`, 25% off with `SAVE25` (only for prices of 1000 or more; below that, no discount), and throw `IllegalArgumentException` for a negative price.

**Starter code** · `MiniTests.java`

```java
public class MiniTests {
    static int passed = 0, failed = 0;

    static void assertEquals(String name, double expected, double actual) {
        // TODO: compare (allow a tiny difference: Math.abs(expected - actual) < 1e-9), print PASS/FAIL, count it
    }

    static void assertThrows(String name, Runnable code) {
        // TODO: run the code; PASS if it throws IllegalArgumentException, FAIL otherwise
    }

    static class Discount {
        static double priceAfter(double price, String coupon) {
            if (price < 0) throw new IllegalArgumentException("negative price");
            return switch (coupon) {
                case "SAVE10" -> price * 0.9;
                case "SAVE25" -> price > 1000 ? price * 0.75 : price;
                default -> price;
            };
        }
    }

    public static void main(String[] args) {
        assertEquals("no coupon", 500, Discount.priceAfter(500, "NONE"));
        assertEquals("save10", 450, Discount.priceAfter(500, "SAVE10"));
        assertEquals("save25 big order", 1500, Discount.priceAfter(2000, "SAVE25"));
        assertEquals("save25 at exactly 1000", 750, Discount.priceAfter(1000, "SAVE25"));
        assertEquals("save25 small order", 999, Discount.priceAfter(999, "SAVE25"));
        assertThrows("negative price", () -> Discount.priceAfter(-1, "SAVE10"));
        System.out.println(passed + " passed, " + failed + " failed");
    }
}
```

**Expected output** (after fixing the bug)

```text
PASS no coupon
PASS save10
PASS save25 big order
PASS save25 at exactly 1000
PASS save25 small order
PASS negative price
6 passed, 0 failed
```

<!-- hints -->
- `assertEquals`: `if (Math.abs(expected - actual) < 1e-9) { passed++; System.out.println("PASS " + name); } else { failed++; System.out.println("FAIL " + name + ": expected " + expected + " but was " + actual); }`
- `assertThrows`: call `code.run()` inside `try`. If it reaches the next line, nothing was thrown (FAIL). `catch (IllegalArgumentException e)` means PASS.
- Once the runner works, one test fails. Read its message: which boundary value is it? Compare the code's condition with the rule "1000 or more".
- This is why tests check **boundaries** (exactly 1000, just below at 999), not just easy middle values.

<!-- solution -->
```java
public class MiniTests {
    static int passed = 0, failed = 0;

    static void assertEquals(String name, double expected, double actual) {
        if (Math.abs(expected - actual) < 1e-9) {
            passed++;
            System.out.println("PASS " + name);
        } else {
            failed++;
            System.out.println("FAIL " + name + ": expected " + expected + " but was " + actual);
        }
    }

    static void assertThrows(String name, Runnable code) {
        try {
            code.run();
            failed++;
            System.out.println("FAIL " + name + ": nothing was thrown");
        } catch (IllegalArgumentException e) {
            passed++;
            System.out.println("PASS " + name);
        }
    }

    static class Discount {
        static double priceAfter(double price, String coupon) {
            if (price < 0) throw new IllegalArgumentException("negative price");
            return switch (coupon) {
                case "SAVE10" -> price * 0.9;
                case "SAVE25" -> price >= 1000 ? price * 0.75 : price;   // the bug was > instead of >=
                default -> price;
            };
        }
    }

    public static void main(String[] args) {
        assertEquals("no coupon", 500, Discount.priceAfter(500, "NONE"));
        assertEquals("save10", 450, Discount.priceAfter(500, "SAVE10"));
        assertEquals("save25 big order", 1500, Discount.priceAfter(2000, "SAVE25"));
        assertEquals("save25 at exactly 1000", 750, Discount.priceAfter(1000, "SAVE25"));
        assertEquals("save25 small order", 999, Discount.priceAfter(999, "SAVE25"));
        assertThrows("negative price", () -> Discount.priceAfter(-1, "SAVE10"));
        System.out.println(passed + " passed, " + failed + " failed");
    }
}
```

Before the fix, the runner printed `FAIL save25 at exactly 1000: expected 750.0 but was 1000.0`: one wrong character, caught in milliseconds by a test at the boundary. JUnit is this idea plus conveniences: it finds `@Test` methods itself, runs each separately, and reports results in your IDE and in `mvn test`.
