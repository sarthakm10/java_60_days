# Day 70 — Structural and Behavioral Design Patterns

> Seven more patterns: how to **fit objects together** (structural) and how objects **share work and talk to each other** (behavioral). You've already used most of them without knowing their names. Read each 🌱 **In simple words** box first.

**Today's goal:** recognise Adapter, Decorator, Proxy, Observer, Strategy, Template Method and Command, and know one real Java or Spring example of each.

<!-- topic: b70_t1 -->
## 🏗️ LLD — Structural & Behavioral Patterns

<!-- intro: d33_t1_s1 -->
**Adapter:** makes an existing class fit an interface it wasn't written for, like a travel plug adapter. Your app expects a `PaymentGateway`; an old vendor library has `makeTxn(...)`. A small `VendorPaymentAdapter implements PaymentGateway` translates the calls, and nothing else changes.

<!-- intro: d33_t1_s2 -->
**Decorator:** adds behaviour to an object by **wrapping** it in another object with the same interface, like adding toppings to a pizza without changing the pizza. Wrappers can stack. Java's I/O is built this way: `new BufferedReader(new FileReader("data.txt"))` adds buffering around a plain reader.

<!-- intro: d33_t1_s3 -->
**Proxy:** a stand-in that controls access to the real object: checking permissions, caching, logging, or loading the real thing only when needed. You met it on Day 44 and in Spring's `@Transactional` (Day 60). Decorator vs proxy: a decorator *adds features*; a proxy *controls access*. They look alike in code.

<!-- intro: d33_t1_s4 -->
**Observer:** when one object changes, everyone who **subscribed** is notified automatically, like a YouTube channel notifying its subscribers. The publisher doesn't need to know who's listening. Spring's application events and Kafka (Day 79) are this idea at different scales.

<!-- intro: d33_t1_s5 -->
**Strategy:** several interchangeable ways to do one job, each in its own class behind one interface, chosen at run time: pay by card, UPI or wallet; sort by price or rating. A `Comparator` (Day 20) is a strategy for ordering. It's the go-to fix for a growing `if/else` on "which way?".

<!-- intro: d33_t1_s6 -->
**Template Method:** a parent class fixes the **steps** of an algorithm and lets subclasses fill in some of them, like a recipe that says "prepare, cook, serve" where only "cook" differs per dish. Spring's `JdbcTemplate` handles connections and errors and lets you supply just the SQL and row mapping.

<!-- intro: d33_t1_s7 -->
**Command:** turns a request into an **object** you can store, queue, log or undo: "add text", "delete line". Undo/redo in an editor is a stack (Day 30) of command objects; job queues and scheduled tasks are commands waiting to run.

👉 **Code Practice**: Strategy + Observer in a checkout, and a Decorator for pricing.

## 📝 Day 70 Recap

1. Adapter? → **makes an existing class fit an interface it wasn't written for**
2. Decorator? → **wraps an object with the same interface to add behaviour; wrappers can stack**
3. Decorator example in the JDK? → **BufferedReader wrapping a FileReader**
4. Proxy vs decorator? → **a proxy controls access; a decorator adds features**
5. Observer? → **subscribers are notified automatically when a publisher changes**
6. Strategy? → **interchangeable algorithms behind one interface, chosen at run time**
7. A strategy you've used? → **a Comparator**
8. Template Method? → **a parent fixes the algorithm's steps; subclasses fill in some of them**
9. Command? → **a request turned into an object that can be queued, logged or undone**
10. Pattern behind undo/redo? → **Command (with a stack)**
