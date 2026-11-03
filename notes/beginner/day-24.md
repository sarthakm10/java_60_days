# Day 24 — Generics

> **Phase 3: Generics & Collections.** For the next ten days you'll learn the tools Java gives you for storing groups of objects. Read each 🌱 **In simple words** box first; the 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** write classes and methods that work for any type while the compiler still checks the types for you, and read signatures like `List<? extends Number>` without panic.

<!-- topic: b24_t1 -->
## ☕ Java — Generics

<!-- subtopic: b24_t1_s1 -->
### Why generics

Imagine a `Box` that can hold one thing. Without generics you'd have to pick a type: an `IntBox`, a `StringBox`, a `StudentBox`… the same code over and over. Or you'd use `Object`, which holds anything but loses track of *what*:

```java
class ObjectBox {
    private Object item;
    void put(Object item) { this.item = item; }
    Object get() { return item; }
}

ObjectBox box = new ObjectBox();
box.put("hello");
String s = (String) box.get();     // you must cast…
Integer n = (Integer) box.get();   // …and a wrong cast compiles fine, then crashes: ClassCastException
```

**Generics** let you write the class once with a **type parameter**, a placeholder written `<T>`, and fill in the real type when you use it:

```java
class Box<T> {                    // T = "some type, decided later"
    private T item;
    void put(T item) { this.item = item; }
    T get() { return item; }
}

Box<String> words = new Box<>();  // T is String for this box
words.put("hello");
String s = words.get();           // no cast needed
words.put(42);                    // ✗ compile error: a Box<String> only takes Strings

Box<Integer> numbers = new Box<>();
numbers.put(42);
```

Two big wins: **one class for every type**, and **mistakes caught by the compiler** instead of crashing at run time. You'll use generics every day from tomorrow: `ArrayList<String>`, `HashMap<String, Integer>`.

A few things to know:

- `<>` on the right (`new Box<>()`) is the "diamond": Java works out the type from the left side.
- Type parameters must be **objects**, not primitives: `Box<Integer>`, not `Box<int>`. Autoboxing (Day 19) converts for you.
- By convention: `T` = type, `E` = element, `K`/`V` = key/value.

<details>
<summary>What problem do generics solve compared with using Object?</summary>

With `Object` you lose the type: you must cast when reading, and a wrong cast only fails at run time. Generics keep the type, so no casts are needed and mistakes are compile errors.
</details>

<!-- intro: d7_t1_s5 -->
Generic **methods** work the same way: `static <T> T first(T[] arr)` works for any array type. You can also limit what `T` may be with a **bound**: `<T extends Comparable<T>>` means "any type that can be compared", so inside the method you're allowed to call `compareTo`. Read `extends` here as "is or is a subtype of" (it works for interfaces too).

<!-- intro: d7_t1_s6 -->
Here's a surprise: a `List<Integer>` is **not** a `List<Number>`, even though an `Integer` is a `Number` (if it were, you could add a `Double` to a list of integers). **Wildcards** (`?`) give flexibility when a method only *reads* or only *writes*: `List<? extends Number>` means "a list of some kind of number, which I'll only read from", and `List<? super Integer>` means "a list I can put Integers into". The memory aid PECS (Producer Extends, Consumer Super) is explained below; it's fine if it takes a couple of readings.

<!-- intro: d7_t1_s7 -->
Generics exist only for the **compiler**. After checking your code, it erases the type parameters, so at run time a `Box<String>` and a `Box<Integer>` are both just `Box`. That's called **type erasure**, and it explains a few odd rules, like why you can't write `new T()` inside a generic class: at run time, nobody knows what `T` was.

<!-- topic: b24_t2 -->
## 🧮 DSA — Trees: Easy

**Trees in simple words:** a linked list (Day 21) is a chain where each node points to *one* next node. A **binary tree** is the same idea where each node points to up to **two** children, `left` and `right`, like a family tree upside down. The top node is the **root**; nodes with no children are **leaves**.

```java
class TreeNode {
    int val;
    TreeNode left, right;
}
```

Trees and recursion (Day 14) are made for each other: a tree is a node plus two smaller trees, so "the depth of a tree" is 1 + the bigger depth of its two subtrees, with an empty tree (`null`) as the base case. Almost every easy tree problem is a few lines of exactly that shape.

## 📝 Day 24 Recap

1. What does `<T>` in `class Box<T>` mean? → **a type parameter: a placeholder for a type chosen when the class is used**
2. `Box<String> b; b.put(42)`? → **compile error: only Strings allowed**
3. Can you write `Box<int>`? → **no, use the wrapper `Box<Integer>`**
4. What is the diamond `<>`? → **`new Box<>()` lets Java infer the type from the left side**
5. Meaning of `<T extends Comparable<T>>`? → **T must be a type that can be compared, so compareTo is allowed**
6. Is `List<Integer>` a `List<Number>`? → **no**
7. `List<? extends Number>` is good for? → **reading numbers from a list of any number type**
8. PECS stands for? → **Producer Extends, Consumer Super**
9. What is type erasure? → **generic types are checked at compile time, then removed; at run time they're gone**
10. Base case for the depth of a tree? → **an empty tree (null) has depth 0**
