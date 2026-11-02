# Day 19 — The Object Class, equals() and Wrapper Classes

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** make your objects print nicely and compare correctly, understand wrapper types like `Integer`, and finally learn why `==` sometimes "works" on Strings.

<!-- topic: b19_t1 -->
## ☕ Java — Object Class & Wrappers

<!-- intro: d2_t4_s1 -->
Every class you write secretly extends a class called **`Object`**, the root of all classes in Java. That's why every object already has a few methods you never wrote. The three you'll override most:

- **`toString()`**: what the object looks like as text. By default it's the unhelpful `Book@1b6d3586` you saw on Day 13. Override it and `System.out.println(book)` prints something useful.
- **`equals(other)`**: "do these two objects mean the same thing?" By default it's the same as `==` (same object?), which is rarely what you want for things like two `Point(3, 4)` objects.
- **`hashCode()`**: a number summarising the object, used by `HashMap` and `HashSet` (Day 27). **Rule: whenever you override `equals`, override `hashCode` too**, so that equal objects get equal hash codes.

IntelliJ writes all three for you: **Alt+Insert** (Windows/Linux) or **Cmd+N** (macOS) → *equals() and hashCode()* / *toString()*.

<!-- intro: d1_t1_s8 -->
This is Day 8's rule, now explained properly. `==` compares **references**: are these two variables pointing at the very same object? `equals()` compares **meaning**: do these objects contain the same value? For Strings and your own classes you almost always want `equals()`.

The second half of the section is about `StringBuilder` vs `StringBuffer`. They do the same job; `StringBuffer` is the old, slower version made safe for several threads at once (Day 39). Use `StringBuilder`.

<!-- intro: d1_t1_s6 -->
The 8 primitive types (`int`, `double`, `boolean`…) aren't objects, but some parts of Java only work with objects, such as the collections you'll meet on Day 25 (`ArrayList<Integer>`, not `ArrayList<int>`). So each primitive has an object "wrapper": `Integer` for `int`, `Double` for `double`, `Boolean`, `Character`, and so on.

Java converts between them automatically: `Integer x = 5;` wraps the 5 (**autoboxing**), and `int y = x;` unwraps it (**unboxing**). The trap: wrappers are objects, so `==` compares references again. It happens to work for small numbers (−128 to 127, which Java caches) and then silently fails for bigger ones. Compare wrappers with `equals()`. And an unboxed `null` crashes with a NullPointerException.

<!-- intro: d1_t1_s7 -->
Strings are used so much that Java keeps a **pool** of string literals: every time your code says `"hello"`, it reuses the same one String object from the pool instead of making a new one. That's why `"hello" == "hello"` is `true`, and why `==` on strings *sometimes* seems to work. But strings made at run time (typed by the user, built with `+` from variables, created with `new String(...)`) are separate objects, and `==` says `false`. The pool is a memory-saving trick, not something to rely on. Keep using `equals()`.

This also connects to Day 8's "Strings never change": sharing one pooled object is only safe because nobody can modify it.

<!-- topic: b19_t2 -->
## 🧮 DSA — Two Pointers: Medium

The two pointers from Day 13, on harder problems. Most of these first **sort** the array (now you know Java's `Arrays.sort`), then move pointers inwards based on a sum. 3Sum adds an outer loop around the Two Sum II idea, and you have to skip duplicates carefully. Container With Most Water and Trapping Rain Water ask "which pointer should move?", and the answer is always the side that can't do better as things stand. The last problem is Day 17's sliding window again, in its two-pointer form.

## 📝 Day 19 Recap

1. Which class does every class extend? → **Object**
2. Default toString() output? → **ClassName@hexHashCode, e.g. Book@1b6d3586**
3. Default equals()? → **the same as ==, i.e. same object**
4. If you override equals, you must also override? → **hashCode**
5. == vs equals() for objects? → **== checks same reference; equals() checks same meaning/value**
6. StringBuilder or StringBuffer? → **StringBuilder (StringBuffer is the older thread-safe, slower one)**
7. Wrapper class for int? → **Integer**
8. Integer a = 1000, b = 1000; a == b? → **false: compare wrappers with equals()**
9. What is the String pool? → **a shared set of String literals that Java reuses**
10. Does "hi" == "hi" being true mean == is safe for Strings? → **no: strings made at run time are different objects**
