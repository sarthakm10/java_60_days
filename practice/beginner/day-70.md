Three behavioural and structural patterns, each in a few lines: Strategy, Observer and Decorator.

<!-- exercise: b70_e1 | Medium | Checkout with Strategy and Observer -->
**Concepts:** Strategy (swappable discount rules) · Observer (listeners notified of events) · interfaces with lambdas

**Task.** `Checkout` takes a `DiscountStrategy` and keeps a list of `OrderListener`s. `placeOrder(customer, amount)` applies the discount, then notifies every listener with the final amount. Write three strategies (no discount, 10% off, flat 100 off orders of 1000 or more) and two listeners (an email sender and an analytics counter), then place the orders in `main`.

**Starter code** · `Patterns.java`

```java
import java.util.ArrayList;
import java.util.List;

interface DiscountStrategy { int apply(int amount); }

interface OrderListener { void onOrderPlaced(String customer, int finalAmount); }

class Checkout {
    private final DiscountStrategy strategy;
    private final List<OrderListener> listeners = new ArrayList<>();

    Checkout(DiscountStrategy strategy) { this.strategy = strategy; }

    void subscribe(OrderListener l) { /* TODO */ }

    void placeOrder(String customer, int amount) {
        // TODO: apply the strategy, then notify every listener
    }
}

public class Patterns {
    static int ordersCounted = 0;

    public static void main(String[] args) {
        DiscountStrategy none = null;      // TODO
        DiscountStrategy tenPercent = null; // TODO
        DiscountStrategy flat100 = null;    // TODO: 100 off when amount >= 1000

        OrderListener email = (c, a) -> System.out.println("Email to " + c + ": you paid " + a);
        OrderListener analytics = (c, a) -> ordersCounted++;

        for (DiscountStrategy s : new DiscountStrategy[]{none, tenPercent, flat100}) {
            Checkout checkout = new Checkout(s);
            checkout.subscribe(email);
            checkout.subscribe(analytics);
            checkout.placeOrder("Asha", 1200);
            checkout.placeOrder("Ravi", 800);
        }
        System.out.println("Orders counted: " + ordersCounted);
    }
}
```

**Expected output**

```text
Email to Asha: you paid 1200
Email to Ravi: you paid 800
Email to Asha: you paid 1080
Email to Ravi: you paid 720
Email to Asha: you paid 1100
Email to Ravi: you paid 800
Orders counted: 6
```

<!-- hints -->
- Each strategy is one lambda: `amount -> amount`, `amount -> amount * 90 / 100`, `amount -> amount >= 1000 ? amount - 100 : amount`.
- `subscribe` adds to the list; `placeOrder` computes `int finalAmount = strategy.apply(amount);` then loops `for (OrderListener l : listeners) l.onOrderPlaced(customer, finalAmount);`.
- `Checkout` never knows which discount or which listeners it has: that's the point of both patterns.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

interface DiscountStrategy { int apply(int amount); }

interface OrderListener { void onOrderPlaced(String customer, int finalAmount); }

class Checkout {
    private final DiscountStrategy strategy;
    private final List<OrderListener> listeners = new ArrayList<>();

    Checkout(DiscountStrategy strategy) { this.strategy = strategy; }

    void subscribe(OrderListener l) {
        listeners.add(l);
    }

    void placeOrder(String customer, int amount) {
        int finalAmount = strategy.apply(amount);
        for (OrderListener l : listeners) {
            l.onOrderPlaced(customer, finalAmount);
        }
    }
}

public class Patterns {
    static int ordersCounted = 0;

    public static void main(String[] args) {
        DiscountStrategy none = amount -> amount;
        DiscountStrategy tenPercent = amount -> amount * 90 / 100;
        DiscountStrategy flat100 = amount -> amount >= 1000 ? amount - 100 : amount;

        OrderListener email = (c, a) -> System.out.println("Email to " + c + ": you paid " + a);
        OrderListener analytics = (c, a) -> ordersCounted++;

        for (DiscountStrategy s : new DiscountStrategy[]{none, tenPercent, flat100}) {
            Checkout checkout = new Checkout(s);
            checkout.subscribe(email);
            checkout.subscribe(analytics);
            checkout.placeOrder("Asha", 1200);
            checkout.placeOrder("Ravi", 800);
        }
        System.out.println("Orders counted: " + ordersCounted);
    }
}
```

A new discount rule or a new listener (an SMS sender, a loyalty-points service) is a new lambda or class, and `Checkout` never changes: Open/Closed (Day 68) through two patterns. At system scale, the Observer becomes Kafka (Day 79): the order service publishes, and any number of services listen.

<!-- exercise: b70_e2 | Easy | Coffee prices with Decorator -->
**Concepts:** Decorator: wrap an object with the same interface to add behaviour · stacking wrappers

**Task.** A `Coffee` has a `cost()` and a `description()`. Complete the decorators `Milk` (+20), `Caramel` (+30) and `ExtraShot` (+40). Each wraps another `Coffee`, adds its price, and appends its name. Wrappers can be stacked in any order and repeated.

**Starter code** · `CoffeeShop.java`

```java
interface Coffee {
    int cost();
    String description();
}

class Espresso implements Coffee {
    public int cost() { return 100; }
    public String description() { return "Espresso"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected final Coffee inner;
    CoffeeDecorator(Coffee inner) { this.inner = inner; }
}

class Milk extends CoffeeDecorator {
    Milk(Coffee inner) { super(inner); }
    public int cost() { return 0; }              // TODO
    public String description() { return ""; }   // TODO: "<inner>, milk"
}

class Caramel extends CoffeeDecorator {
    Caramel(Coffee inner) { super(inner); }
    public int cost() { return 0; }              // TODO: +30
    public String description() { return ""; }   // TODO: ", caramel"
}

class ExtraShot extends CoffeeDecorator {
    ExtraShot(Coffee inner) { super(inner); }
    public int cost() { return 0; }              // TODO: +40
    public String description() { return ""; }   // TODO: ", extra shot"
}

public class CoffeeShop {
    public static void main(String[] args) {
        Coffee plain = new Espresso();
        Coffee latte = new Milk(new Espresso());
        Coffee fancy = new ExtraShot(new Caramel(new Milk(new Espresso())));
        Coffee doubleMilk = new Milk(new Milk(new Espresso()));
        for (Coffee c : new Coffee[]{plain, latte, fancy, doubleMilk}) {
            System.out.println(c.description() + " = " + c.cost());
        }
    }
}
```

**Expected output**

```text
Espresso = 100
Espresso, milk = 120
Espresso, milk, caramel, extra shot = 190
Espresso, milk, milk = 140
```

<!-- hints -->
- Each decorator delegates to `inner` and adds its own part: `return inner.cost() + 20;` and `return inner.description() + ", milk";`.
- `Caramel` and `ExtraShot` look exactly like `Milk` with different numbers and names.
- The outermost wrapper is called first, and each one asks the next one inside, down to the `Espresso`.

<!-- solution -->
```java
interface Coffee {
    int cost();
    String description();
}

class Espresso implements Coffee {
    public int cost() { return 100; }
    public String description() { return "Espresso"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected final Coffee inner;
    CoffeeDecorator(Coffee inner) { this.inner = inner; }
}

class Milk extends CoffeeDecorator {
    Milk(Coffee inner) { super(inner); }
    public int cost() { return inner.cost() + 20; }
    public String description() { return inner.description() + ", milk"; }
}

class Caramel extends CoffeeDecorator {
    Caramel(Coffee inner) { super(inner); }
    public int cost() { return inner.cost() + 30; }
    public String description() { return inner.description() + ", caramel"; }
}

class ExtraShot extends CoffeeDecorator {
    ExtraShot(Coffee inner) { super(inner); }
    public int cost() { return inner.cost() + 40; }
    public String description() { return inner.description() + ", extra shot"; }
}

public class CoffeeShop {
    public static void main(String[] args) {
        Coffee plain = new Espresso();
        Coffee latte = new Milk(new Espresso());
        Coffee fancy = new ExtraShot(new Caramel(new Milk(new Espresso())));
        Coffee doubleMilk = new Milk(new Milk(new Espresso()));
        for (Coffee c : new Coffee[]{plain, latte, fancy, doubleMilk}) {
            System.out.println(c.description() + " = " + c.cost());
        }
    }
}
```

Without decorators you'd need a class for every combination (`EspressoWithMilkAndCaramel`…), which explodes quickly. With them, three small classes cover every combination, in any order. Java's `new BufferedReader(new FileReader(...))` is exactly this shape.
