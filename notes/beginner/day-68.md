# Day 68 — SOLID and Clean Code Principles

> **Phase 8: Design Principles & Patterns.** You can now build working software. These five days are about building software that stays easy to change as it grows: the difference between a junior and a mid-level developer. Read each 🌱 **In simple words** box first.

**Today's goal:** learn the five SOLID principles with everyday examples, and recognise code that breaks them.

<!-- topic: b68_t1 -->
## 🏗️ Design — SOLID & Clean Code

<!-- intro: d10_t1_s1 -->
**S — Single Responsibility:** a class should have **one reason to change**. An `OrderService` that calculates prices, saves to the database, formats emails *and* writes PDFs changes whenever any of those four things change, and every change risks breaking the other three. Split it into classes that each do one job (`PriceCalculator`, `OrderRepository`, `OrderEmailer`), like a restaurant where the chef cooks and the cashier takes payment. Your Day 55 layers were this principle in action.

<!-- intro: d10_t1_s2 -->
**O — Open/Closed:** code should be **open for extension, closed for modification**: add new behaviour by adding new code, not by editing working code. A `switch` on payment type that grows a new `case` for every payment method breaks this; a `PaymentMethod` interface with one class per method (add a class, touch nothing else) follows it. You did exactly this with notifications on Day 17.

<!-- intro: d10_t1_s3 -->
**L — Liskov Substitution:** a subclass must work **anywhere its parent works**, without surprises. If `Square extends Rectangle`, then code that sets a rectangle's width to 5 and height to 10 expects an area of 50, but a square changes both sides together and breaks that expectation. If a subclass has to throw "not supported" or quietly change behaviour, inheritance was the wrong tool (Day 18's composition may fit better).

<!-- intro: d10_t1_s4 -->
**I — Interface Segregation:** prefer **small, focused interfaces** to one giant one. A `Worker` interface with `work()`, `eat()` and `sleep()` forces a `Robot` to implement `eat()` with nonsense. Split it into `Workable`, `Feedable`… so each class implements only what it really does.

<!-- intro: d10_t1_s5 -->
**D — Dependency Inversion:** depend on **abstractions** (interfaces), not concrete classes. `OrderService` should depend on a `PaymentGateway` interface, not on `RazorpayGateway` directly, so you can swap providers or pass a fake in tests. Spring's dependency injection (Day 52) exists to make this easy.

<!-- intro: d39_t1_s4 -->
Three short rules that work alongside SOLID: **DRY** (don't repeat yourself: one place for each piece of knowledge), **KISS** (keep it simple: the simplest design that works) and **YAGNI** (you aren't gonna need it: don't build features or flexibility "just in case"). They sometimes pull against each other; good judgement is knowing when a little repetition beats a complicated abstraction.

👉 **Code Practice** has you refactor a checkout "god method" using these principles.

## 📝 Day 68 Recap

1. Single Responsibility? → **a class should have only one reason to change**
2. Open/Closed? → **add new behaviour with new code, without editing working code**
3. Typical Open/Closed fix for a growing switch? → **an interface with one class per case**
4. Liskov Substitution? → **a subclass must work anywhere its parent is expected, without surprises**
5. Classic Liskov violation? → **Square extending Rectangle**
6. Interface Segregation? → **many small, focused interfaces instead of one large one**
7. Dependency Inversion? → **depend on interfaces (abstractions), not concrete classes**
8. Which Spring feature supports Dependency Inversion? → **dependency injection**
9. DRY, KISS, YAGNI? → **don't repeat yourself; keep it simple; don't build what you don't need yet**
10. When can a little repetition be better than DRY? → **when removing it would need a complicated abstraction**
