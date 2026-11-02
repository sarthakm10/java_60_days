# Day 29 — Sets

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** use sets to keep things unique, pick between `HashSet`, `LinkedHashSet` and `TreeSet`, and do union and intersection.

<!-- topic: b29_t1 -->
## ☕ Collections — Sets

<!-- intro: d14_t1_s1 -->
A **set** is a collection with **no duplicates**, like the set of countries you've visited: visiting France twice doesn't add it twice. `add` returns `false` when the item was already there, and `contains` is instant:

```java
Set<String> visited = new HashSet<>();
visited.add("France");
visited.add("Japan");
System.out.println(visited.add("France"));    // false: already there
System.out.println(visited.size());           // 2
System.out.println(visited.contains("Japan")); // true, in O(1)
```

Fun fact from the section below: a `HashSet` is really a `HashMap` (Day 28) that only uses the keys. So everything about `hashCode` and `equals` applies to set items too.

<!-- intro: d14_t1_s2 -->
The same three orders as maps: `HashSet` (no order, fastest), `LinkedHashSet` (keeps insertion order) and `TreeSet` (always sorted, O(log n)). Choose by how you want to loop over it.

<!-- intro: d14_t1_s3 -->
A very common job: remove duplicates from a list **but keep the original order**. `new LinkedHashSet<>(list)` does it in one step (then turn it back into a list with `new ArrayList<>(...)` if you need one). A plain `HashSet` would lose the order.

<!-- intro: d14_t1_s4 -->
Sets do school-maths set operations: **union** (everything in either set) with `addAll`, **intersection** (only what's in both) with `retainAll`, and **difference** (in the first but not the second) with `removeAll`. These methods **change** the set you call them on, so work on a copy (`new HashSet<>(a)`) if you still need the original.

<!-- intro: d14_t1_s5 -->
A `TreeSet` decides "duplicate or not" using your **comparator**, not `equals`. If you sort students by marks and two students have the same marks, the comparator says they're "equal", and the second one silently **disappears** from the set. The fix is to break ties: compare by marks, then by name (`thenComparing`, Day 20).

<!-- intro: d14_t1_s6 -->
Because a `TreeSet` is sorted, it can answer "nearest" questions instantly: `floor(x)` (the biggest item ≤ x), `ceiling(x)` (the smallest ≥ x), `lower`/`higher` (strictly less/greater), plus `first()`, `last()` and `pollFirst()`. Example: "which exam slot is the closest one at or after 2:30?" is one `ceiling` call.

<!-- topic: b29_t2 -->
## 🧮 DSA — Prefix Sum & Hashing Patterns

**Prefix sums in simple words:** if you keep a running total as you walk an array (`prefix[i]` = the sum of everything before index i), then the sum of **any** stretch from i to j is just `prefix[j + 1] − prefix[i]`, one subtraction instead of a loop. Combined with a `HashMap` of "running totals I've seen so far", it answers "how many subarrays add up to K?" in one pass. Longest Consecutive Sequence uses today's `HashSet`: put every number in a set, then only start counting from numbers whose `n − 1` isn't in the set.

## 📝 Day 29 Recap

1. What does a Set guarantee? → **no duplicate elements**
2. What does add return for an existing element? → **false**
3. Cost of contains on a HashSet? → **O(1) on average**
4. What is a HashSet built on? → **a HashMap (only its keys are used)**
5. HashSet vs LinkedHashSet vs TreeSet order? → **none / insertion order / sorted**
6. Remove duplicates from a list keeping order? → **new LinkedHashSet<>(list)**
7. Union / intersection / difference methods? → **addAll / retainAll / removeAll**
8. Why can a TreeSet lose elements? → **its comparator treats ties as duplicates**
9. Smallest element ≥ x in a TreeSet? → **ceiling(x)**
10. Sum of a[i..j] from prefix sums? → **prefix[j + 1] - prefix[i]**
