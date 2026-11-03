Creational patterns in one small program: a Builder for an object with many optional settings, an enum Singleton, and a Factory that picks the class at run time.

<!-- exercise: b69_e1 | Medium | Builder, enum Singleton and Factory -->
**Concepts:** Builder with method chaining · immutable result · enum Singleton · Factory Method returning an interface

**Task.**

1. Finish `Pizza.Builder`: `size` is required (given to `builder(...)`), cheese defaults to `false`, toppings to an empty list. `build()` returns an **immutable** `Pizza` and rejects more than 5 toppings.
2. `AppConfig` is an **enum Singleton** that hands out increasing order numbers starting at 1001.
3. `PaymentFactory.create(type)` returns the right `Payment` for `"card"`, `"upi"` or `"cash"`, and throws `IllegalArgumentException` for anything else.

**Starter code** · `Creational.java`

```java
import java.util.ArrayList;
import java.util.List;

final class Pizza {
    private final String size;
    private final boolean extraCheese;
    private final List<String> toppings;

    private Pizza(Builder b) {
        this.size = b.size;
        this.extraCheese = b.extraCheese;
        this.toppings = List.copyOf(b.toppings);   // immutable copy
    }

    static Builder builder(String size) { return new Builder(size); }

    @Override
    public String toString() {
        return size + (extraCheese ? " +cheese" : "") + " " + toppings;
    }

    static final class Builder {
        private final String size;
        private boolean extraCheese;
        private final List<String> toppings = new ArrayList<>();

        private Builder(String size) { this.size = size; }

        Builder extraCheese() { return this; }          // TODO
        Builder topping(String t) { return this; }      // TODO
        Pizza build() { return new Pizza(this); }       // TODO: reject more than 5 toppings
    }
}

enum AppConfig {
    INSTANCE;
    // TODO: a counter that starts so the first number is 1001
    int nextOrderNumber() { return 0; }                 // TODO
}

interface Payment { String pay(int amount); }

class PaymentFactory {
    static Payment create(String type) {
        return null; // TODO: "card", "upi", "cash", else IllegalArgumentException("Unknown payment type: " + type)
    }
}

public class Creational {
    public static void main(String[] args) {
        Pizza p1 = Pizza.builder("large").extraCheese().topping("olives").topping("corn").build();
        Pizza p2 = Pizza.builder("small").build();
        System.out.println(p1);
        System.out.println(p2);
        try {
            Pizza.builder("medium").topping("a").topping("b").topping("c").topping("d").topping("e").topping("f").build();
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }

        System.out.println(AppConfig.INSTANCE.nextOrderNumber() + " " + AppConfig.INSTANCE.nextOrderNumber());
        System.out.println(AppConfig.INSTANCE == AppConfig.valueOf("INSTANCE"));

        for (String type : new String[]{"card", "upi", "cash"}) {
            System.out.println(PaymentFactory.create(type).pay(500));
        }
        try {
            PaymentFactory.create("bitcoin");
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

**Expected output**

```text
large +cheese [olives, corn]
small []
Rejected: too many toppings: 6
1001 1002
true
Paid 500 by card
Paid 500 by UPI
Paid 500 in cash
Unknown payment type: bitcoin
```

<!-- hints -->
- Each builder method sets a field and `return this;`, which is what makes chaining (`.extraCheese().topping(...)`) work.
- `build()`: `if (toppings.size() > 5) throw new IllegalStateException("too many toppings: " + toppings.size());`
- Enum Singleton: a field `private int next = 1001;` and `int nextOrderNumber() { return next++; }`. Java guarantees exactly one `INSTANCE`.
- Factory: a `switch` returning a lambda for each type, e.g. `case "upi" -> amount -> "Paid " + amount + " by UPI";` (Payment has one method, so a lambda can implement it, Day 34).

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

final class Pizza {
    private final String size;
    private final boolean extraCheese;
    private final List<String> toppings;

    private Pizza(Builder b) {
        this.size = b.size;
        this.extraCheese = b.extraCheese;
        this.toppings = List.copyOf(b.toppings);
    }

    static Builder builder(String size) { return new Builder(size); }

    @Override
    public String toString() {
        return size + (extraCheese ? " +cheese" : "") + " " + toppings;
    }

    static final class Builder {
        private final String size;
        private boolean extraCheese;
        private final List<String> toppings = new ArrayList<>();

        private Builder(String size) { this.size = size; }

        Builder extraCheese() {
            this.extraCheese = true;
            return this;
        }

        Builder topping(String t) {
            toppings.add(t);
            return this;
        }

        Pizza build() {
            if (toppings.size() > 5) {
                throw new IllegalStateException("too many toppings: " + toppings.size());
            }
            return new Pizza(this);
        }
    }
}

enum AppConfig {
    INSTANCE;
    private int next = 1001;

    int nextOrderNumber() { return next++; }
}

interface Payment { String pay(int amount); }

class PaymentFactory {
    static Payment create(String type) {
        return switch (type) {
            case "card" -> amount -> "Paid " + amount + " by card";
            case "upi" -> amount -> "Paid " + amount + " by UPI";
            case "cash" -> amount -> "Paid " + amount + " in cash";
            default -> throw new IllegalArgumentException("Unknown payment type: " + type);
        };
    }
}

public class Creational {
    public static void main(String[] args) {
        Pizza p1 = Pizza.builder("large").extraCheese().topping("olives").topping("corn").build();
        Pizza p2 = Pizza.builder("small").build();
        System.out.println(p1);
        System.out.println(p2);
        try {
            Pizza.builder("medium").topping("a").topping("b").topping("c").topping("d").topping("e").topping("f").build();
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }

        System.out.println(AppConfig.INSTANCE.nextOrderNumber() + " " + AppConfig.INSTANCE.nextOrderNumber());
        System.out.println(AppConfig.INSTANCE == AppConfig.valueOf("INSTANCE"));

        for (String type : new String[]{"card", "upi", "cash"}) {
            System.out.println(PaymentFactory.create(type).pay(500));
        }
        try {
            PaymentFactory.create("bitcoin");
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

The Builder keeps `Pizza` immutable while still allowing any combination of options, and the private constructor forces everyone through it. The enum Singleton can't be duplicated even with reflection or serialization tricks. The factory is the only place that knows the concrete payment types, so adding "wallet" changes one `switch` and nothing that uses `Payment`.
