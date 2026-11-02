# Day 52 — Spring Core: IoC and Dependency Injection

> **Phase 7: Spring Boot.** Everything so far has led here: OOP, interfaces, annotations, HTTP, Maven and SQL all come together. Today is the idea underneath all of Spring. Read each 🌱 **In simple words** box first.

**Today's goal:** understand the problem Spring solves, what "dependency injection" means, and how Spring creates and connects your objects.

<!-- topic: b52_t1 -->
## 🌿 Spring — IoC & Dependency Injection

<!-- subtopic: b52_t1_s1 -->
### The problem Spring solves

Imagine an `OrderService` that needs somewhere to save orders and a way to send emails. The obvious code creates what it needs itself:

```java
public class OrderService {
    private final OrderRepository repository = new PostgresOrderRepository();   // ✗ hard-wired
    private final EmailSender email = new SmtpEmailSender("smtp.gmail.com");    // ✗ hard-wired

    public void placeOrder(Order order) {
        repository.save(order);
        email.send(order.getCustomerEmail(), "Order placed!");
    }
}
```

Problems:

1. **Testing is painful.** Every test of `placeOrder` writes to a real database and sends a real email. You can't swap in a fake.
2. **Changing is painful.** Moving to MySQL or another email provider means editing `OrderService`, and every other class that did the same.
3. **Configuration is scattered.** The SMTP host is buried inside a business class.

The fix: the class **doesn't create** its helpers; it **receives** them, usually through its constructor:

```java
public class OrderService {
    private final OrderRepository repository;      // interfaces (Day 18), not specific classes
    private final EmailSender email;

    public OrderService(OrderRepository repository, EmailSender email) {   // "here's what I need"
        this.repository = repository;
        this.email = email;
    }
}
```

This is **dependency injection (DI)**: a class's dependencies are *injected* (handed in) from outside. Now a test can pass in a fake repository and a fake email sender, and production can pass the real ones, without touching `OrderService`.

But someone still has to create all the objects and pass each one to the right constructor, in the right order, for hundreds of classes. **That's Spring's main job.** You describe your classes; Spring creates them and connects them. Handing that control to the framework is called **Inversion of Control (IoC)**: instead of your code calling `new` and wiring things up, the framework does it and calls your code.

<details>
<summary>What is dependency injection, in one sentence?</summary>

A class receives the objects it depends on (usually through its constructor) instead of creating them itself.
</details>

<details>
<summary>Why does dependency injection make testing easier?</summary>

Tests can pass in fake or mock dependencies (no real database or email) without changing the class being tested.
</details>

<!-- intro: d19_t1_s1 -->
The **IoC container** (in Spring, the `ApplicationContext`) is the part of Spring that creates your objects, wires them together, and keeps them for the whole life of the app. The objects it manages are called **beans**. When your app starts, Spring scans your code, creates every bean, fills in their dependencies, and then the app is ready.

<!-- intro: d19_t1_s2 -->
How does Spring know which classes to manage? You label them with annotations (Day 44): `@Component` means "please create and manage this class". The specialised versions say what *kind* of class it is: `@Service` for business logic, `@Repository` for data access, `@Controller` / `@RestController` for web endpoints. They all make a bean; the names make code self-explaining (and `@Repository` adds database-error translation).

<!-- intro: d19_t1_s3 -->
`@Autowired` asks Spring to inject a dependency. Use **constructor injection**: just declare a constructor with the dependencies as parameters (with a single constructor you don't even need `@Autowired`). Fields can be `final`, the class can't exist half-built, and tests can call the constructor directly. Field injection (`@Autowired private X x;`) is shorter but hides dependencies and makes testing harder; you'll see it in older code.

<!-- intro: d19_t1_s4 -->
If there are **two** beans of the same type (say, `SmsSender` and `EmailSender`, both implementing `NotificationSender`), Spring can't guess which one you want and refuses to start. `@Primary` marks the default choice; `@Qualifier("sms")` picks a specific one at the injection point.

👉 **Code Practice** today starts the Spring Boot project you'll use for the rest of the phase. Its first exercise has the one-time setup steps.

<!-- topic: b52_t2 -->
## 🧮 DSA — Revision Problems

A revision day: implement the LRU cache, a trie and Union-Find from memory (Days 33, 41, 42), then the DP and graph classics. From now on DSA takes a lighter, revision-style role while you learn Spring; keep doing one or two problems a day to stay sharp for interviews.

## 📝 Day 52 Recap

1. Problem with a class creating its own dependencies? → **hard to test, hard to change, configuration scattered**
2. What is dependency injection? → **a class receives its dependencies from outside instead of creating them**
3. What is Inversion of Control? → **the framework creates and wires objects and calls your code**
4. What is a Spring bean? → **an object created and managed by the Spring container**
5. Name of Spring's IoC container? → **ApplicationContext**
6. @Component vs @Service vs @Repository? → **all create beans; the names show the role (repository adds DB error translation)**
7. Preferred injection style? → **constructor injection**
8. Why is constructor injection better? → **final fields, no half-built objects, easy to test**
9. Two beans of the same type: how to choose? → **@Primary for a default, @Qualifier to pick one**
10. Does a single constructor need @Autowired? → **no, Spring uses it automatically**
