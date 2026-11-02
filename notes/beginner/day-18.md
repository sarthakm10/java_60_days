# Day 18 — Abstraction: Abstract Classes and Interfaces

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** describe *what* objects can do without saying *how*, choose between an abstract class and an interface, and know when to prefer "has a" over "is a".

<!-- topic: b18_t1 -->
## ☕ Java — Abstraction

<!-- intro: d2_t1_s5 -->
Yesterday every `Animal` had a `sound()` returning `"..."`, which is a bit silly: there's no such thing as a plain "animal" sound. An **abstract class** is a class that is **incomplete on purpose**: it can declare a method without a body and say "every subclass must fill this in".

```java
abstract class Shape {
    abstract double area();                 // no body: each shape must provide one

    void describe() {                       // normal methods are allowed too
        System.out.println("Area: " + area());
    }
}

class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    @Override
    double area() { return Math.PI * r * r; }
}

new Shape();          // ✗ compile error: can't create an object of an abstract class
new Circle(2);        // ✓
```

Think of it as a form with blanks: the abstract class prints the form, each subclass fills in the blanks. A subclass that doesn't fill in every abstract method must be abstract itself.

<!-- intro: d2_t1_s6 -->
An **interface** is a pure promise: a list of methods a class guarantees to have, with no fields to store data. "Anything that is `Payable` has a `pay(amount)` method", whether it's a credit card, UPI or cash.

```java
interface Payable {
    boolean pay(double amount);       // no body, and automatically public and abstract
}

class UpiPayment implements Payable {
    @Override
    public boolean pay(double amount) { ... }
}
```

Classes `implement` interfaces (rather than `extend` them), and the big difference from classes: a class can implement **many** interfaces (`class Phone implements Camera, MusicPlayer, Callable`), but extend only one class. You'll use interfaces constantly: Java's `List`, `Comparable` and `Runnable` are all interfaces.

<!-- intro: d2_t1_s7 -->
Since Java 8, interfaces can contain **default methods**: methods *with* a body that implementing classes get for free. That raises a puzzle: if a class implements two interfaces that both have a default method with the same name, which one does it get? Java refuses to guess. It's a compile error until the class overrides the method itself (and it may pick one with `InterfaceName.super.method()`). That's the "diamond problem" in the section below; you won't hit it often.

<!-- intro: d2_t1_s8 -->
Inheritance ("is a") isn't the only way to reuse code. **Composition** means a class **has** another object as a field and uses it: a `Car` *has an* `Engine`. It's usually the better choice, because you can swap the part, combine several parts, and you don't inherit methods you never wanted.

```java
class Car {
    private final Engine engine;        // has-a
    Car(Engine engine) { this.engine = engine; }
    void start() { engine.start(); }    // delegate the work to the part
}
```

Quick test: if "X is a Y" sounds right, inheritance can fit. If "X has a Y" fits better, use a field. When unsure, prefer composition.

<!-- topic: b18_t2 -->
## 🧮 DSA — Bit Manipulation & Math

**Bits in simple words:** inside the computer every `int` is 32 binary digits (bits), each 0 or 1. The number 5 is `101`, 6 is `110`. Bitwise operators work on those bits directly: `&` (AND: 1 only if both bits are 1), `|` (OR), `^` (XOR: 1 if the bits differ) and the shifts `<<` and `>>`. A few tricks come up again and again: `x ^ x` is 0 and `x ^ 0` is x (so XOR-ing a list cancels out pairs), `n & 1` tells you if `n` is odd, and `1 << k` is 2ᵏ. Write numbers in binary on paper while you solve these.

## 📝 Day 18 Recap

1. Can you create an object of an abstract class? → **no, only of its concrete subclasses**
2. What is an abstract method? → **a method with no body that subclasses must implement**
3. Can an abstract class have normal methods and fields? → **yes**
4. Keyword to use an interface? → **implements**
5. How many interfaces can a class implement? → **many (but extend only one class)**
6. Abstract class or interface for "can be paid"? → **an interface: a capability many unrelated classes can have**
7. What is a default method? → **an interface method with a body, inherited by implementing classes**
8. Two interfaces give the same default method. What must the class do? → **override it (optionally calling Interface.super.method())**
9. Composition means? → **"has a": using another object as a field and delegating to it**
10. When unsure between inheritance and composition? → **prefer composition**
