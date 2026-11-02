# Day 17 — Polymorphism: One Name, Many Forms

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** tell overloading and overriding apart, understand why `Animal a = new Dog()` calls the Dog's method, and check an object's real type safely.

<!-- topic: b17_t1 -->
## ☕ Java — Polymorphism

<!-- intro: d2_t1_s2 -->
You already know this one from Day 6: **overloading** means several methods with the same name but different parameters, like `add(int, int)` and `add(double, double)`. The compiler picks which one to call by looking at the arguments, before the program runs. That's why it's called *compile-time* polymorphism. The one rule to remember: changing only the return type isn't enough.

<!-- intro: d2_t1_s3 -->
**Overriding** is different: a subclass **replaces** a method it inherited with its own version, keeping exactly the same name and parameters.

```java
class Animal {
    String sound() { return "..."; }
}
class Dog extends Animal {
    @Override
    String sound() { return "Woof"; }   // replaces Animal's version for dogs
}
class Cat extends Animal {
    @Override
    String sound() { return "Meow"; }
}
```

Always write `@Override` above it. It asks the compiler to check that you really are overriding something; a typo like `sounds()` then becomes a compile error instead of a silent new method.

| | Overloading | Overriding |
|---|---|---|
| Where | same class (or subclass) | subclass replaces the parent's method |
| Parameters | must **differ** | must be the **same** |
| Decided | at compile time, from the arguments | at run time, from the real object |

<!-- intro: d2_t1_s4 -->
Not everything can be overridden. Three things stay as they are: `private` methods (the subclass can't even see them), `final` methods (Day 15: "can't be changed"), and `static` methods (they belong to the class, not to objects, so a subclass's static method with the same name just *hides* the parent's one). Constructors aren't inherited, so they can't be overridden either.

<!-- subtopic: b17_t1_s4 -->
### Parent reference, child object

A variable of a **parent** type can hold an object of **any subclass**:

```java
Animal a = new Dog();     // a Dog IS an Animal, so this is allowed
Animal b = new Cat();
```

Now the key question: what does `a.sound()` print? The **object** decides, not the variable's type:

```java
System.out.println(a.sound());   // Woof
System.out.println(b.sound());   // Meow
```

Java looks at the **real object** at run time and runs *its* version of the method. This is **polymorphism** ("many forms"): one call, `sound()`, behaves differently depending on the object behind it.

Why it's so useful: you can write code once for the parent type, and it works for every subclass, including ones written later:

```java
Animal[] zoo = { new Dog(), new Cat(), new Dog() };
for (Animal animal : zoo) {
    System.out.println(animal.sound());   // Woof, Meow, Woof
}
```

Add a `Cow` class tomorrow, and this loop works with it without a single change.

The variable's type does still matter for **what you're allowed to call**. The compiler only knows that `a` is *some* `Animal`:

```java
Animal a = new Dog();
a.sound();       // ✓ every Animal has sound()
a.fetch();       // ✗ compile error, even though the object is a Dog: Animal has no fetch()
```

Rule of thumb: **the variable's type decides what you may call; the object's type decides which version runs.**

<details>
<summary>Animal a = new Dog(); a.sound(): whose sound() runs?</summary>

Dog's. For overridden methods, Java picks the version from the actual object at run time, not from the variable's type.
</details>

<details>
<summary>Animal a = new Dog(); can you call a Dog-only method like a.fetch()?</summary>

No. The compiler only allows methods that exist in the variable's type (Animal). You'd have to check and cast first.
</details>

<!-- subtopic: b17_t1_s5 -->
### instanceof and safe casting

Sometimes you hold an `Animal` but need something only a `Dog` can do. First **check** the real type with `instanceof`, then **cast**:

```java
Animal a = getAnimal();

if (a instanceof Dog) {
    Dog d = (Dog) a;        // cast: "treat this Animal as a Dog"
    d.fetch();
}
```

Casting without checking is risky: if the object isn't really a `Dog`, Java throws **`ClassCastException`** at run time.

```java
Animal c = new Cat();
Dog d = (Dog) c;            // 💥 ClassCastException: Cat cannot be cast to Dog
```

Modern Java (16+) combines the check and the cast into one step, called **pattern matching**:

```java
if (a instanceof Dog d) {   // if a is a Dog, give me it as variable d
    d.fetch();
}
```

Use it whenever you need `instanceof`. But notice: lots of `instanceof` checks usually mean a missed chance for polymorphism. Instead of

```java
if (a instanceof Dog) { System.out.println("Woof"); }
else if (a instanceof Cat) { System.out.println("Meow"); }
```

just call `a.sound()` and let each class answer for itself.

<details>
<summary>What does if (a instanceof Dog d) do?</summary>

It checks whether the object is a Dog and, if so, gives you a variable `d` of type Dog that you can use inside the if block. No separate cast needed.
</details>

<!-- topic: b17_t2 -->
## 🧮 DSA — Sliding Window

**Sliding window in simple words:** many problems ask about a **run of consecutive elements**: the best sum of any 3 days in a row, the shortest stretch adding up to at least 7. Trying every start and end is O(n²). Instead, imagine a window over the array that **slides** right: add the element entering on the right, remove the one leaving on the left, and update the answer. Each element enters and leaves once, so it's O(n). Two flavours: a **fixed** window size, and a **variable** window that grows until a rule breaks, then shrinks from the left.

## 📝 Day 17 Recap

1. Overloading vs overriding? → **overloading: same name, different parameters; overriding: a subclass replaces an inherited method with the same signature**
2. Which is decided at run time? → **overriding (by the real object)**
3. Why write @Override? → **the compiler checks you really override something, catching typos**
4. Can you override static, final or private methods? → **no**
5. Animal a = new Dog(); a.sound() runs? → **Dog's version**
6. What decides which methods you may call on a? → **the variable's type (Animal)**
7. What does instanceof check? → **whether an object is of a given type (or a subtype)**
8. Exception for a bad cast? → **ClassCastException**
9. Pattern matching syntax? → **if (a instanceof Dog d) { ... }**
10. Many instanceof checks often mean? → **a missed chance to use polymorphism (an overridden method)**
