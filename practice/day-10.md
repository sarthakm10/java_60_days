Today's code shows how frameworks are built: SOLID design that lets you add behaviour without editing old code, annotations read through reflection (that's how Bean Validation works), and dynamic proxies (that's how `@Transactional` works).

<!-- exercise: d10_e1 | Medium | Refactor a checkout "god method" with SOLID -->
**Concepts:** Single Responsibility · Open/Closed via the Strategy pattern · Dependency Inversion (depend on an interface, inject through the constructor) · Liskov substitution

**Task.** The starter's `Checkout.total` mixes pricing, discount rules and string building in one `if/else` method. Every new promotion means editing it. Refactor so that:

1. Each rule is its own class implementing `DiscountPolicy` (`appliesTo(cart)`, `apply(amount)`, `label()`).
2. `Checkout` receives a `List<DiscountPolicy>` through its **constructor** and knows nothing about specific rules.
3. A **new** rule — `BulkDiscount`: 5 % off when the cart has more than 5 units — is added **without touching `Checkout`**.
4. `total` returns a `Receipt` (amount + applied labels); printing stays in `main`.

**Starter code** · `CheckoutRefactor.java`

```java
import java.util.ArrayList;
import java.util.List;

public class CheckoutRefactor {
    public static void main(String[] args) {
        List<Item> cart = List.of(new Item("Book", 500, 2), new Item("Pen", 50, 4));
        Checkout checkout = new Checkout();
        System.out.println("regular: " + checkout.total(cart, "REGULAR", null));
        System.out.println("premium: " + checkout.total(cart, "PREMIUM", null));
        System.out.println("employee + FESTIVE50: " + checkout.total(cart, "EMPLOYEE", "FESTIVE50"));
        // TODO: after refactoring, add "premium + bulk" for cart and for a 1-book cart (see expected output)
    }
}

record Item(String name, double price, int qty) { }

class Checkout {                                         // BEFORE: every rule hard-coded here
    String total(List<Item> cart, String customerType, String coupon) {
        double sum = 0;
        for (Item i : cart) sum += i.price() * i.qty();
        List<String> applied = new ArrayList<>();
        if ("PREMIUM".equals(customerType)) { sum *= 0.90; applied.add("premium -10%"); }
        else if ("EMPLOYEE".equals(customerType)) { sum *= 0.70; applied.add("employee -30%"); }
        if ("FESTIVE50".equals(coupon)) { sum -= 50; applied.add("FESTIVE50 -50.00"); }
        return String.format("%.2f %s", sum, applied);
    }
}
```

**Expected output**

```text
regular: 1200.00 []
premium: 1080.00 [premium -10%]
employee + FESTIVE50: 790.00 [employee -30%, FESTIVE50 -50.00]
premium + bulk: 1026.00 [premium -10%, bulk -5%]
premium + bulk, 1 book: 450.00 [premium -10%]
```

<!-- hints -->
- `interface DiscountPolicy { boolean appliesTo(List<Item> cart); double apply(double amount); String label(); }`
- `PercentOff(name, percent)` and `FlatCoupon(code, amount)` cover the old rules; give `appliesTo` a default of `true` in the interface.
- `Checkout` loops over its policies in order: `if (p.appliesTo(cart)) { amount = p.apply(amount); labels.add(p.label()); }`.
- A `record Receipt(double amount, List<String> applied)` with a custom `toString()` keeps formatting out of the pricing logic.
- Liskov check: every policy must be safe to drop into any `Checkout` — no policy should throw for a valid cart or require callers to know its concrete type.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

public class CheckoutRefactor {
    public static void main(String[] args) {
        List<Item> cart = List.of(new Item("Book", 500, 2), new Item("Pen", 50, 4));
        List<Item> oneBook = List.of(new Item("Book", 500, 1));

        Checkout regular = new Checkout(List.of());
        Checkout premium = new Checkout(List.of(new PercentOff("premium", 10)));
        Checkout employeeFestive = new Checkout(List.of(new PercentOff("employee", 30), new FlatCoupon("FESTIVE50", 50)));
        Checkout premiumBulk = new Checkout(List.of(new PercentOff("premium", 10), new BulkDiscount(5, 5)));

        System.out.println("regular: " + regular.total(cart));
        System.out.println("premium: " + premium.total(cart));
        System.out.println("employee + FESTIVE50: " + employeeFestive.total(cart));
        System.out.println("premium + bulk: " + premiumBulk.total(cart));
        System.out.println("premium + bulk, 1 book: " + premiumBulk.total(oneBook));
    }
}

record Item(String name, double price, int qty) { }

record Receipt(double amount, List<String> applied) {
    @Override
    public String toString() { return String.format("%.2f %s", amount, applied); }
}

interface DiscountPolicy {                                   // the abstraction Checkout depends on (DIP)
    default boolean appliesTo(List<Item> cart) { return true; }
    double apply(double amount);
    String label();
}

record PercentOff(String name, int percent) implements DiscountPolicy {
    public double apply(double amount) { return amount * (100 - percent) / 100.0; }
    public String label() { return name + " -" + percent + "%"; }
}

record FlatCoupon(String code, double off) implements DiscountPolicy {
    public double apply(double amount) { return Math.max(0, amount - off); }
    public String label() { return String.format("%s -%.2f", code, off); }
}

record BulkDiscount(int minUnitsExclusive, int percent) implements DiscountPolicy {   // NEW rule, Checkout untouched (OCP)
    public boolean appliesTo(List<Item> cart) {
        return cart.stream().mapToInt(Item::qty).sum() > minUnitsExclusive;
    }
    public double apply(double amount) { return amount * (100 - percent) / 100.0; }
    public String label() { return "bulk -" + percent + "%"; }
}

class Checkout {                                             // one job: apply the configured policies (SRP)
    private final List<DiscountPolicy> policies;

    Checkout(List<DiscountPolicy> policies) { this.policies = List.copyOf(policies); }   // injected

    Receipt total(List<Item> cart) {
        double amount = 0;
        for (Item i : cart) amount += i.price() * i.qty();
        List<String> applied = new ArrayList<>();
        for (DiscountPolicy p : policies) {
            if (p.appliesTo(cart)) {
                amount = p.apply(amount);
                applied.add(p.label());
            }
        }
        return new Receipt(amount, applied);
    }
}
```

**Spring connection.** In a Spring app each policy would be a `@Component`, and `Checkout` would receive `List<DiscountPolicy>` through its constructor — Spring injects every bean implementing the interface. A new promotion is a new class; nothing else changes. (For real money use `BigDecimal`, not `double`.)

<!-- exercise: d10_e2 | Medium | Build a mini Bean Validation with custom annotations -->
**Concepts:** custom annotations · `@Retention(RUNTIME)` · `@Target(FIELD)` · annotation attributes · reflection: `getDeclaredFields`, `isAnnotationPresent`, `getAnnotation`, `setAccessible`

**Task.** Write three annotations — `@NotBlank`, `@Min(value)` and `@Email` — and a `Validator.validate(Object)` that inspects **private** fields through reflection and returns a sorted list of messages like `age: must be >= 18`. This is a tiny version of what `jakarta.validation` + `@Valid` do in Spring controllers.

**Starter code** · `MiniValidation.java`

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

public class MiniValidation {
    public static void main(String[] args) throws Exception {
        SignupRequest ok = new SignupRequest("Asha", "asha@mail.com", 25, "s3cret!");
        SignupRequest bad = new SignupRequest(" ", "asha-at-mail", 16, "");
        System.out.println("valid request errors: " + Validator.validate(ok));
        System.out.println("invalid request errors:");
        Validator.validate(bad).forEach(e -> System.out.println("  " + e));
        System.out.println("annotated fields: " + Validator.annotatedFieldCount(SignupRequest.class));
    }
}

// TODO: @NotBlank (optional message, default "must not be blank"), @Min(long value), @Email — all RUNTIME + FIELD

class SignupRequest {
    private final String name;        // TODO: @NotBlank
    private final String email;       // TODO: @Email
    private final int age;            // TODO: @Min(18)
    private final String password;    // TODO: @NotBlank(message = "password is required")

    SignupRequest(String name, String email, int age, String password) {
        this.name = name; this.email = email; this.age = age; this.password = password;
    }
}

class Validator {
    static List<String> validate(Object target) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();
        // TODO: loop over declared fields, setAccessible(true), check each annotation, sort the result
        return errors;
    }

    static long annotatedFieldCount(Class<?> type) {
        return 0; // TODO
    }
}
```

**Expected output**

```text
valid request errors: []
invalid request errors:
  age: must be >= 18
  email: must be a valid email
  name: must not be blank
  password: password is required
annotated fields: 4
```

<!-- hints -->
- `@Retention(RetentionPolicy.RUNTIME)` is essential — the default (`CLASS`) keeps annotations in the bytecode but **invisible to reflection**.
- Annotation attributes look like methods: `@interface Min { long value(); }` and `@interface NotBlank { String message() default "must not be blank"; }`. With a single attribute named `value` you can write `@Min(18)`.
- `field.setAccessible(true)` lets you read a `private` field; then `Object v = field.get(target)`.
- A simple email check is enough here: `s.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")`.
- `getDeclaredFields()` doesn't guarantee an order — that's why the errors are sorted.

<!-- solution -->
```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class MiniValidation {
    public static void main(String[] args) throws Exception {
        SignupRequest ok = new SignupRequest("Asha", "asha@mail.com", 25, "s3cret!");
        SignupRequest bad = new SignupRequest(" ", "asha-at-mail", 16, "");
        System.out.println("valid request errors: " + Validator.validate(ok));
        System.out.println("invalid request errors:");
        Validator.validate(bad).forEach(e -> System.out.println("  " + e));
        System.out.println("annotated fields: " + Validator.annotatedFieldCount(SignupRequest.class));
    }
}

@Retention(RetentionPolicy.RUNTIME)       // visible to reflection at runtime
@Target(ElementType.FIELD)                // only allowed on fields
@interface NotBlank {
    String message() default "must not be blank";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Min {
    long value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Email { }

class SignupRequest {
    @NotBlank private final String name;
    @Email private final String email;
    @Min(18) private final int age;
    @NotBlank(message = "password is required") private final String password;

    SignupRequest(String name, String email, int age, String password) {
        this.name = name; this.email = email; this.age = age; this.password = password;
    }
}

class Validator {
    static List<String> validate(Object target) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();
        for (Field field : target.getClass().getDeclaredFields()) {
            field.setAccessible(true);                                  // read private fields
            Object value = field.get(target);
            String name = field.getName();

            NotBlank notBlank = field.getAnnotation(NotBlank.class);
            if (notBlank != null && (value == null || value.toString().isBlank())) {
                errors.add(name + ": " + notBlank.message());          // read the attribute
            }
            Min min = field.getAnnotation(Min.class);
            if (min != null && ((Number) value).longValue() < min.value()) {
                errors.add(name + ": must be >= " + min.value());
            }
            if (field.isAnnotationPresent(Email.class)
                    && (value == null || !value.toString().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+"))) {
                errors.add(name + ": must be a valid email");
            }
        }
        Collections.sort(errors);                                       // field order isn't guaranteed
        return errors;
    }

    static long annotatedFieldCount(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields())
                .filter(f -> f.getAnnotations().length > 0)
                .count();
    }
}
```

**How Spring does it.** Hibernate Validator scans `@NotBlank`, `@Email`, `@Min`… with exactly this kind of reflection (cached per class, because reflection is slow), and Spring MVC runs it for `@Valid @RequestBody` parameters, turning errors into a `400 Bad Request`.

<!-- exercise: d10_e3 | Hard | A `@Transactional`-style dynamic proxy -->
**Concepts:** `java.lang.reflect.Proxy` · `InvocationHandler` · reading annotations on the target's method · `InvocationTargetException` unwrapping · why self-invocation isn't intercepted

**Task.** Implement `Proxies.wrap(target, iface)` that returns a JDK dynamic proxy which:

- Logs every call as `-> pay(o-1, 500)` and its result as `<- pay returned: …`.
- If the **implementation's** method is annotated with `@Transactional`, prints `BEGIN` before the call, `COMMIT` after success, or `ROLLBACK (<ExceptionName>)` on failure — then rethrows the **original** exception.
- Then observe the classic Spring trap: `payTwice` calls `this.pay(...)` internally, and those inner calls are **not** intercepted.

**Starter code** · `TxProxyDemo.java`

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class TxProxyDemo {
    public static void main(String[] args) {
        PaymentService service = Proxies.wrap(new PaymentServiceImpl(), PaymentService.class);
        service.pay("o-1", 500);
        try {
            service.pay("o-2", 0);
        } catch (IllegalStateException e) {
            System.out.println("caller saw: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        service.refund("o-1");
        service.payTwice("o-3", 100);
        System.out.println("proxy is a PaymentService: " + (service instanceof PaymentService));
        System.out.println("proxy class is the impl: " + (service.getClass() == PaymentServiceImpl.class));
    }
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Transactional { }

interface PaymentService {
    String pay(String orderId, int amount);
    void refund(String orderId);
    String payTwice(String orderId, int amount);
}

class PaymentServiceImpl implements PaymentService {
    @Transactional
    public String pay(String orderId, int amount) {
        if (amount <= 0) throw new IllegalStateException("amount must be positive");
        return "paid " + amount + " for " + orderId;
    }

    public void refund(String orderId) {
        System.out.println("  refunding " + orderId);
    }

    public String payTwice(String orderId, int amount) {
        return pay(orderId, amount) + " & " + pay(orderId, amount);   // self-invocation: this.pay(...)
    }
}

class Proxies {
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface) {
        return target; // TODO: Proxy.newProxyInstance(...) with an InvocationHandler
    }
}
```

**Expected output**

```text
-> pay(o-1, 500)
  BEGIN
  COMMIT
<- pay returned: paid 500 for o-1
-> pay(o-2, 0)
  BEGIN
  ROLLBACK (IllegalStateException)
caller saw: IllegalStateException: amount must be positive
-> refund(o-1)
  refunding o-1
<- refund returned: null
-> payTwice(o-3, 100)
<- payTwice returned: paid 100 for o-3 & paid 100 for o-3
proxy is a PaymentService: true
proxy class is the impl: false
```

<!-- hints -->
- `Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, handler)` — JDK proxies can only implement **interfaces** (Spring uses CGLIB subclasses for classes).
- The handler receives the **interface** method. Find the implementation's method with `target.getClass().getMethod(method.getName(), method.getParameterTypes())` and check `isAnnotationPresent(Transactional.class)` there.
- `method.invoke(target, args)` wraps any exception thrown by the target in `InvocationTargetException` — rethrow `e.getCause()`.
- `args` is `null` for methods with no parameters; `String.join(", ", ...)` over `String.valueOf` of each arg builds `o-1, 500`.
- `payTwice` runs **inside** the real object, so its `this.pay(...)` calls never pass through the proxy — no BEGIN/COMMIT, no logging.

<!-- solution -->
```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Arrays;
import java.util.stream.Collectors;

public class TxProxyDemo {
    public static void main(String[] args) {
        PaymentService service = Proxies.wrap(new PaymentServiceImpl(), PaymentService.class);
        service.pay("o-1", 500);
        try {
            service.pay("o-2", 0);
        } catch (IllegalStateException e) {
            System.out.println("caller saw: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        service.refund("o-1");
        service.payTwice("o-3", 100);
        System.out.println("proxy is a PaymentService: " + (service instanceof PaymentService));
        System.out.println("proxy class is the impl: " + (service.getClass() == PaymentServiceImpl.class));
    }
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Transactional { }

interface PaymentService {
    String pay(String orderId, int amount);
    void refund(String orderId);
    String payTwice(String orderId, int amount);
}

class PaymentServiceImpl implements PaymentService {
    @Transactional
    public String pay(String orderId, int amount) {
        if (amount <= 0) throw new IllegalStateException("amount must be positive");
        return "paid " + amount + " for " + orderId;
    }

    public void refund(String orderId) {
        System.out.println("  refunding " + orderId);
    }

    public String payTwice(String orderId, int amount) {
        return pay(orderId, amount) + " & " + pay(orderId, amount);   // this.pay → bypasses the proxy
    }
}

class Proxies {
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface) {
        InvocationHandler handler = (proxy, method, args) -> {
            String argText = args == null ? "" : Arrays.stream(args).map(String::valueOf).collect(Collectors.joining(", "));
            System.out.println("-> " + method.getName() + "(" + argText + ")");

            Method impl = target.getClass().getMethod(method.getName(), method.getParameterTypes());
            boolean tx = impl.isAnnotationPresent(Transactional.class);   // annotation lives on the impl
            if (tx) System.out.println("  BEGIN");
            try {
                Object result = method.invoke(target, args);             // call the real object
                if (tx) System.out.println("  COMMIT");
                System.out.println("<- " + method.getName() + " returned: " + result);
                return result;
            } catch (InvocationTargetException e) {
                Throwable cause = e.getCause();                          // the target's real exception
                if (tx) System.out.println("  ROLLBACK (" + cause.getClass().getSimpleName() + ")");
                throw cause;
            }
        };
        return (T) Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, handler);
    }
}
```

**This is Spring AOP in miniature.** Spring wraps beans that have `@Transactional`, `@Cacheable`, `@Async` or custom aspects in a proxy (JDK dynamic proxy for interfaces, CGLIB subclass otherwise). Because the advice lives in the proxy, a call from **inside** the bean (`this.pay()`) skips it — the self-invocation pitfall from Day 22. Fixes: move the method to another bean, inject the bean into itself (`@Lazy` self-reference), or use `TransactionTemplate`.
