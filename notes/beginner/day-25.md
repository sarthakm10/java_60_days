# Day 25 — The Collections Framework and ArrayList

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** meet Java's collections, use `ArrayList` for everyday lists, and understand how it grows behind the scenes.

<!-- topic: b25_t1 -->
## ☕ Collections — ArrayList

<!-- intro: d11_t1_s1 -->
Arrays have a fixed size (Day 7). Real programs need containers that **grow and shrink**: a shopping cart, a list of search results, the members of a library. Java's **Collections Framework** is a set of ready-made containers, each good at something different:

- **List**: an ordered sequence; duplicates allowed (a playlist).
- **Set**: no duplicates (the set of unique visitors).
- **Queue**: things waiting in line (print jobs).
- **Map**: key → value lookups (a phone book). Technically not a "Collection", but part of the same family.

Each is an **interface** (Day 18), with several classes implementing it. You'll learn one per day, starting with the most used of all: `ArrayList`.

<!-- subtopic: b25_t1_s2 -->
### Using ArrayList

`ArrayList` is a list that grows as you add to it. You need `import java.util.ArrayList;` (and `java.util.List`).

```java
List<String> cart = new ArrayList<>();     // declare as List, create an ArrayList

cart.add("milk");                          // add to the end
cart.add("bread");
cart.add("eggs");
cart.add(1, "butter");                     // insert at index 1: [milk, butter, bread, eggs]

System.out.println(cart);                  // [milk, butter, bread, eggs]  (prints nicely, unlike arrays)
System.out.println(cart.size());           // 4  (size(), not length)
System.out.println(cart.get(0));           // milk
cart.set(0, "oat milk");                   // replace index 0
cart.remove("bread");                      // remove by value
cart.remove(0);                            // remove by index
System.out.println(cart.contains("eggs")); // true
System.out.println(cart.indexOf("eggs"));  // 1
System.out.println(cart.isEmpty());        // false
```

Looping is just like arrays:

```java
for (String item : cart) {
    System.out.println(item);
}
for (int i = 0; i < cart.size(); i++) {
    System.out.println(i + ": " + cart.get(i));
}
```

| Array | ArrayList |
|---|---|
| `String[] a = new String[5];` fixed size | `List<String> a = new ArrayList<>();` grows |
| `a.length` | `a.size()` |
| `a[2]` / `a[2] = x` | `a.get(2)` / `a.set(2, x)` |
| holds primitives (`int[]`) | holds objects only (`List<Integer>`) |
| print with `Arrays.toString(a)` | `System.out.println(a)` works |

Why `List<String> cart = new ArrayList<>()` and not `ArrayList<String> cart`? Declaring the variable with the **interface** type means the rest of your code only relies on "it's a list", so you could switch to another kind of list later by changing one word. (This is Day 68's dependency-inversion idea in miniature.)

One trap with numbers: `List<Integer>` has two `remove` methods. `nums.remove(1)` removes **index** 1; to remove the **value** 1, write `nums.remove(Integer.valueOf(1))`.

<details>
<summary>How do you get the number of elements in an ArrayList?</summary>

`list.size()`. (Arrays use `length` without brackets; Strings use `length()`.)
</details>

<details>
<summary>Why write List&lt;String&gt; x = new ArrayList&lt;&gt;() instead of ArrayList&lt;String&gt; x?</summary>

Code that only depends on the List interface keeps working if you later swap in a different List implementation.
</details>

<!-- intro: d17_t1_s4 -->
The for-each loop works on anything that is **`Iterable`**: arrays, lists, sets. Under the hood it uses an **`Iterator`**, an object that walks through a collection one element at a time with `hasNext()` and `next()`. You'll rarely write one by hand, except for one important case: removing elements *while* looping (Day 26 shows why the for-each loop can't do that).

<!-- intro: d11_t1_s2 -->
How can an `ArrayList` grow when arrays can't? It keeps an ordinary array inside. When that array is full and you `add`, it creates a **bigger array** (about 1.5× the size), copies everything across, and carries on with the new one. You never see it happen, but it explains the timings in the next section.

<!-- intro: d11_t1_s3 -->
Because there's an array inside, `get(i)` is instant: O(1), just like `arr[i]`. Adding at the **end** is usually instant too (it occasionally pays for a copy, but on average it's still O(1), called *amortised*). Adding or removing in the **middle** is slow, O(n): everything after that position has to shift along by one, like people moving seats in a row.

<!-- intro: d11_t1_s8 -->
Two quick ways to make a small list: `List.of("a", "b", "c")` creates a list that can **never be changed** (adding throws an exception), and `Arrays.asList(...)` wraps an array as a fixed-size list (you can change elements, but not add or remove). When you need a list you can grow, copy it: `new ArrayList<>(List.of("a", "b"))`.

<!-- topic: b25_t2 -->
## 🧮 DSA — Trees: Medium Problems

Yesterday's tree problems needed one value back from each subtree (a depth, true/false). These ask for a bit more: the **diameter** combines answers from both sides, **path sum** carries a running total (and a `List` of the path, now that you have `ArrayList`) down the tree, and building a tree from traversals uses recursion on index ranges. Keep asking: *"if my two subtrees already gave me their answers, how do I combine them?"*

## 📝 Day 25 Recap

1. Four main collection types? → **List, Set, Queue and Map**
2. Add to the end / insert at index 1? → **list.add(x) / list.add(1, x)**
3. Read / replace element i? → **list.get(i) / list.set(i, x)**
4. Size of a list? → **list.size()**
5. Can a List hold int? → **no, it holds Integer objects (autoboxing converts)**
6. `nums.remove(1)` on a `List<Integer>` removes? → **the element at index 1, not the value 1**
7. What is inside an ArrayList? → **a regular array, replaced by a bigger copy when full**
8. Cost of get(i) and of inserting in the middle? → **O(1) and O(n)**
9. Can you add to List.of(...)? → **no, it's unmodifiable**
10. What does a for-each loop use underneath? → **an Iterator**
