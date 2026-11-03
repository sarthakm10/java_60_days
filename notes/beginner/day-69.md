# Day 69 — Creational Design Patterns

> A **design pattern** is a named, proven solution to a problem that keeps coming up, like a recipe every chef knows. Knowing the names lets you say "use a Builder here" instead of explaining it from scratch. Today: patterns for **creating** objects.

**Today's goal:** know Singleton, Factory Method, Abstract Factory, Builder and Prototype: what problem each solves, and when to pick which.

<!-- topic: b69_t1 -->
## 🏗️ LLD — Creational Patterns

<!-- intro: d32_t1_s1 -->
**Singleton:** a class that may have **exactly one** instance in the whole program, with one shared way to reach it, like a country's one central bank. Examples: a configuration object, a connection pool. The simplest safe version in Java is an `enum` with one value. Be careful: singletons are global state, hard to fake in tests, and in Spring you rarely write them yourself, because Spring beans are already singletons by default (Day 53).

<!-- intro: d32_t1_s2 -->
**Factory Method:** instead of calling `new` with a specific class everywhere, call a method that **decides which class to create**: `Notification.create("sms")` returns an `SmsNotification`. Callers depend only on the interface, and adding a new type changes one place. `List.of(...)` and `Integer.valueOf(...)` are factory methods.

<!-- intro: d32_t1_s3 -->
**Abstract Factory:** a factory for a whole **family** of related objects that must match, like a furniture shop's "Victorian" or "Modern" line: chair, sofa and table that go together. In code: a `UiFactory` that creates matching buttons and checkboxes for a dark or a light theme. Less common day to day, but a classic interview question.

<!-- intro: d32_t1_s4 -->
**Builder:** builds a complex object **step by step**, with readable named steps, instead of a constructor with ten parameters nobody can read (`new Pizza("large", true, false, true, 3, null)`). `Pizza.builder().size("large").extraCheese().toppings(3).build()` reads like a sentence, and the final object can be immutable (Day 20). Lombok's `@Builder` generates it; `StringBuilder` and `HttpRequest.newBuilder()` are builders you already know.

<!-- intro: d32_t1_s5 -->
**Prototype:** create new objects by **copying** an existing, ready-configured one instead of building from scratch, like a template document you duplicate. In Java, prefer a copy constructor (Day 22) over `clone()`.

<!-- intro: d32_t1_s6 -->
The quick way to choose: exactly one instance → Singleton (or a Spring bean); "which class?" decided at run time → Factory; families that must match → Abstract Factory; many optional settings → Builder; cheap copies of a configured object → Prototype.

👉 **Code Practice** builds a Builder, an enum Singleton and a Factory in one small exercise.

## 📝 Day 69 Recap

1. What is a design pattern? → **a named, proven solution to a common design problem**
2. Singleton? → **exactly one instance with a global access point**
3. Safest simple Singleton in Java? → **an enum with a single value**
4. Why are hand-written singletons rare in Spring apps? → **Spring beans are singletons by default**
5. Factory Method? → **a method decides which concrete class to create; callers use the interface**
6. Abstract Factory? → **creates families of related objects that must match**
7. Builder solves? → **constructors with many (optional) parameters; creates objects step by step**
8. A Builder you use often? → **StringBuilder (or Lombok's @Builder)**
9. Prototype? → **create objects by copying a configured instance**
10. Preferred way to copy in Java? → **a copy constructor rather than clone()**
