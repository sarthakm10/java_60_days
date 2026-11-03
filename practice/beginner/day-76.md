Resilience patterns are usually a library (Resilience4j), but writing tiny versions yourself makes the ideas stick. Time is simulated with a counter, so the output is the same on every run.

<!-- exercise: b76_e1 | Medium | Retry with backoff, and a circuit breaker -->
**Concepts:** retries with exponential backoff · circuit breaker states CLOSED → OPEN → HALF_OPEN · failing fast

**Task.**

1. `retry(action, maxAttempts)` calls the action until it succeeds, waiting 100, 200, 400… ms (doubling) between attempts. Instead of really sleeping, it **records** each wait in a list. If every attempt fails, it rethrows the last exception.
2. `CircuitBreaker` opens after **3 consecutive failures**. While OPEN, calls fail immediately with `"circuit open"` without calling the service. After **5 time units** it lets one trial call through (HALF_OPEN): success closes it, failure opens it again. Time is a number you advance by hand.

**Starter code** · `Resilience.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

public class Resilience {
    static final List<Long> waits = new ArrayList<>();

    static <T> T retry(Supplier<T> action, int maxAttempts) {
        // TODO: try up to maxAttempts times; after each failure except the last, record the wait (100, 200, 400...)
        return action.get();
    }

    enum State { CLOSED, OPEN, HALF_OPEN }

    static class CircuitBreaker {
        State state = State.CLOSED;
        int failures = 0;
        long openedAt = 0;
        long now = 0;   // simulated clock

        String call(Supplier<String> service) {
            // TODO: OPEN and less than 5 units since opening -> throw new IllegalStateException("circuit open")
            // TODO: OPEN and 5+ units passed -> HALF_OPEN, try once
            // TODO: success -> CLOSED, failures = 0; failure -> count it, open on the 3rd (or immediately if HALF_OPEN)
            return service.get();
        }
    }

    public static void main(String[] args) {
        int[] calls = {0};
        String result = retry(() -> {
            calls[0]++;
            if (calls[0] < 3) throw new RuntimeException("timeout");
            return "OK after " + calls[0] + " attempts";
        }, 5);
        System.out.println(result + ", waited " + waits);

        CircuitBreaker cb = new CircuitBreaker();
        Supplier<String> down = () -> { throw new RuntimeException("payments down"); };
        Supplier<String> up = () -> "paid";
        for (int i = 1; i <= 4; i++) {
            try {
                cb.call(down);
            } catch (RuntimeException e) {
                System.out.println("call " + i + ": " + e.getMessage() + " -> " + cb.state);
            }
        }
        cb.now = 5;
        System.out.println("after 5 units: " + cb.call(up) + " -> " + cb.state);
    }
}
```

**Expected output**

```text
OK after 3 attempts, waited [100, 200]
call 1: payments down -> CLOSED
call 2: payments down -> CLOSED
call 3: payments down -> OPEN
call 4: circuit open -> OPEN
after 5 units: paid -> CLOSED
```

<!-- hints -->
- Retry loop: `long wait = 100; for (int attempt = 1; ; attempt++) { try { return action.get(); } catch (RuntimeException e) { if (attempt == maxAttempts) throw e; waits.add(wait); wait *= 2; } }`
- In the breaker, check the OPEN state **first**: if `now - openedAt < 5`, throw without calling the service. That's "failing fast".
- On a failure: `failures++`; if `failures >= 3` or the state was HALF_OPEN, set OPEN and `openedAt = now`. Rethrow the exception so the caller sees it.
- Call 4 never reaches the service: the breaker stops it.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

public class Resilience {
    static final List<Long> waits = new ArrayList<>();

    static <T> T retry(Supplier<T> action, int maxAttempts) {
        long wait = 100;
        for (int attempt = 1; ; attempt++) {
            try {
                return action.get();
            } catch (RuntimeException e) {
                if (attempt == maxAttempts) {
                    throw e;
                }
                waits.add(wait);      // a real version would Thread.sleep(wait + some random jitter)
                wait *= 2;
            }
        }
    }

    enum State { CLOSED, OPEN, HALF_OPEN }

    static class CircuitBreaker {
        State state = State.CLOSED;
        int failures = 0;
        long openedAt = 0;
        long now = 0;

        String call(Supplier<String> service) {
            if (state == State.OPEN) {
                if (now - openedAt < 5) {
                    throw new IllegalStateException("circuit open");
                }
                state = State.HALF_OPEN;
            }
            try {
                String result = service.get();
                state = State.CLOSED;
                failures = 0;
                return result;
            } catch (RuntimeException e) {
                failures++;
                if (state == State.HALF_OPEN || failures >= 3) {
                    state = State.OPEN;
                    openedAt = now;
                }
                throw e;
            }
        }
    }

    public static void main(String[] args) {
        int[] calls = {0};
        String result = retry(() -> {
            calls[0]++;
            if (calls[0] < 3) throw new RuntimeException("timeout");
            return "OK after " + calls[0] + " attempts";
        }, 5);
        System.out.println(result + ", waited " + waits);

        CircuitBreaker cb = new CircuitBreaker();
        Supplier<String> down = () -> { throw new RuntimeException("payments down"); };
        Supplier<String> up = () -> "paid";
        for (int i = 1; i <= 4; i++) {
            try {
                cb.call(down);
            } catch (RuntimeException e) {
                System.out.println("call " + i + ": " + e.getMessage() + " -> " + cb.state);
            }
        }
        cb.now = 5;
        System.out.println("after 5 units: " + cb.call(up) + " -> " + cb.state);
    }
}
```

Retry and circuit breaker work together: retries handle short blips, and the breaker stops endless retrying against a service that's really down, so threads aren't wasted waiting on it (Day 76's cascade failure). Resilience4j adds jitter, sliding windows of calls and metrics, but the state machine is exactly this one.
