# Day 16 — Inheritance

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** build a new class on top of an existing one with `extends`, use `super` to reach the parent, and understand the order in which constructors run.

<!-- topic: b16_t1 -->
## ☕ Java — Inheritance

<!-- intro: d2_t1_s1 -->
**Inheritance** lets a new class take everything an existing class has and add to it. A `Dog` *is an* `Animal`: it has everything every animal has (a name, the ability to eat) plus dog-only things (barking). Instead of copying the animal code into `Dog`, you write `class Dog extends Animal` and only add what's new.

```java
class Animal {
    String name;
    void eat() { System.out.println(name + " is eating"); }
}

class Dog extends Animal {          // Dog gets name and eat() for free
    void bark() { System.out.println(name + " says Woof"); }
}

Dog d = new Dog();
d.name = "Bruno";
d.eat();     // inherited from Animal
d.bark();    // Dog's own
```

The parent is called the **superclass** (or parent, base class), the child the **subclass**. The test for using inheritance is the phrase "**is a**": a Dog is an Animal ✓, a Car is a Vehicle ✓, but a Car is **not** an Engine (a car *has* an engine; that's Day 18's composition). A Java class can extend only **one** class.

<!-- subtopic: b16_t1_s2 -->
### The super keyword

`super` means "my parent's version". You use it in two ways.

**1. Calling the parent's constructor**, so the parent can set up its own fields:

```java
class Animal {
    protected String name;
    Animal(String name) {
        this.name = name;
    }
}

class Dog extends Animal {
    private String breed;
    Dog(String name, String breed) {
        super(name);          // let Animal set up the name: must be the FIRST line
        this.breed = breed;   // then set up Dog's own field
    }
}
```

The parent's fields are the parent's job. If `name` were `private` in `Animal`, `Dog` couldn't even assign it; `super(name)` hands it to the constructor that can.

**2. Calling the parent's version of a method** that the child has replaced (overriding, Day 17):

```java
class Animal {
    String describe() { return "An animal called " + name; }
}

class Dog extends Animal {
    @Override
    String describe() {
        return super.describe() + ", a " + breed;   // reuse the parent's text, add to it
    }
}
// "An animal called Bruno, a Labrador"
```

`this` = this object, as this class sees it. `super` = this same object, as the parent class sees it. There is still only **one** object; `super` just picks which class's code to run.

<details>
<summary>What are the two uses of super?</summary>

`super(...)` as the first line of a constructor calls the parent's constructor; `super.method()` calls the parent's version of a method that this class overrides.
</details>

<!-- intro: d1_t1_s3 -->
When you create a `Dog`, Java builds it from the inside out: the `Animal` part is set up **first**, then the `Dog` part. Every constructor's first line is either `this(...)` (another constructor of the same class, Day 14) or `super(...)` (the parent's). If you write neither, Java quietly inserts `super()`, a call to the parent's no-argument constructor.

That quiet `super()` explains a very common compile error: if the parent **only** has a constructor with parameters, there is no no-argument constructor to call, and the child must call `super(...)` with arguments itself.

<!-- subtopic: b16_t1_s4 -->
### What a subclass can and can't see

Inheriting something doesn't always mean you can *use* it directly:

| Member in the parent is… | Can the subclass use it directly? |
|---|---|
| `public` | ✓ yes |
| `protected` | ✓ yes, even from another package. This is what `protected` is for |
| *default* (no modifier) | only if the subclass is in the **same package** |
| `private` | ✗ no: it exists inside the object, but only the parent's own methods can touch it |

```java
class Account {
    private double balance;                    // only Account's code can touch it
    protected void addInterest(double rate) {  // subclasses may call this
        balance += balance * rate;
    }
    public double getBalance() { return balance; }
}

class SavingsAccount extends Account {
    void monthEnd() {
        addInterest(0.004);       // ✓ protected
        // balance += 10;         // ✗ compile error: balance is private in Account
    }
}
```

Good habit: keep fields `private` even in parent classes, and give subclasses `protected` *methods* to work with. Then the parent's rules (like "balance never goes negative") still hold, whatever subclasses do.

Constructors are **not** inherited: a `Dog` doesn't automatically get `Animal`'s constructors, it calls them through `super(...)`.

<details>
<summary>Can a subclass access its parent's private field directly?</summary>

No. The field exists in the object, but only the parent class's own code can use it. The subclass goes through public or protected methods.
</details>

<!-- topic: b16_t2 -->
## 🧮 DSA — Binary Search: Medium

Yesterday's binary search found a value in a sorted array. These problems stretch the same idea: find the **first or last** position of a value, search an array that was sorted and then **rotated**, and the powerful trick of **binary search on the answer** (Koko Eating Bananas): when you can check "is speed X fast enough?" and the answers go no, no, no, yes, yes, yes, binary search finds the first "yes". Take them slowly and trace each one on paper with a small array.

## 📝 Day 16 Recap

1. What does extends do? → **makes a subclass that inherits the parent's fields and methods**
2. The phrase to test whether inheritance fits? → **"is a" (a Dog is an Animal)**
3. How many classes can a Java class extend? → **one**
4. super(name) in a constructor? → **calls the parent's constructor; must be the first line**
5. super.describe()? → **runs the parent's version of a method the child overrides**
6. Which part of an object is built first? → **the parent's (its constructor runs first)**
7. What does Java insert if a constructor has no this() or super()? → **super(), a call to the parent's no-argument constructor**
8. Parent has only Animal(String name). What must Dog's constructor do? → **call super(someName) explicitly**
9. Can a subclass use a private field of its parent? → **no, only through public/protected methods**
10. Are constructors inherited? → **no**
