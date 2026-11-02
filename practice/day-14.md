Sets look simple, but they hide two classic traps — mutating the original during set operations, and a `TreeSet` comparator that silently drops elements — and they power several O(n) interview solutions. Let's code all three.

<!-- exercise: d14_e1 | Easy | Deduplicate and combine with set operations -->
**Concepts:** `HashSet` / `LinkedHashSet` / `TreeSet` ordering · `add` returning `false` for duplicates · union (`addAll`), intersection (`retainAll`), difference (`removeAll`) on **copies** · `stream().distinct()`

**Task.**

1. Remove duplicates from a list of emails **keeping first-seen order** — once with `LinkedHashSet`, once with `distinct()` — and once sorted with `TreeSet`.
2. Find the first email that repeats, using the return value of `Set.add`.
3. Given skill sets A and B, compute union, intersection, A − B and the symmetric difference **without modifying A or B**.

**Starter code** · `SetBasics.java`

```java
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class SetBasics {
    public static void main(String[] args) {
        List<String> emails = List.of("b@x.com", "a@x.com", "b@x.com", "c@x.com", "a@x.com");
        System.out.println("LinkedHashSet: " + List.of());        // TODO
        System.out.println("distinct(): " + List.of());           // TODO
        System.out.println("TreeSet: " + List.of());              // TODO
        System.out.println("first repeated: " + null);            // TODO: loop, seen.add(e) returns false

        Set<String> a = Set.of("java", "spring", "kafka", "sql");
        Set<String> b = Set.of("kafka", "aws", "sql", "docker");
        // TODO: union, intersection, a - b, symmetric difference — each into a NEW TreeSet
        System.out.println("union: ");
        System.out.println("intersection: ");
        System.out.println("a - b: ");
        System.out.println("symmetric difference: ");
        System.out.println("a unchanged: " + new TreeSet<>(a));
    }
}
```

**Expected output**

```text
LinkedHashSet: [b@x.com, a@x.com, c@x.com]
distinct(): [b@x.com, a@x.com, c@x.com]
TreeSet: [a@x.com, b@x.com, c@x.com]
first repeated: b@x.com
union: [aws, docker, java, kafka, spring, sql]
intersection: [kafka, sql]
a - b: [java, spring]
symmetric difference: [aws, docker, java, spring]
a unchanged: [java, kafka, spring, sql]
```

<!-- hints -->
- `new LinkedHashSet<>(emails)` keeps the first occurrence of each element in insertion order.
- `Set.add` returns `false` when the element is already present — no separate `contains` call needed.
- `retainAll`, `removeAll`, `addAll` **mutate** the set they're called on. Always start from a copy: `Set<String> inter = new TreeSet<>(a); inter.retainAll(b);`
- `Set.of(...)` is immutable — calling `retainAll` on `a` directly would throw anyway.
- Symmetric difference = union − intersection.

<!-- solution -->
```java
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class SetBasics {
    public static void main(String[] args) {
        List<String> emails = List.of("b@x.com", "a@x.com", "b@x.com", "c@x.com", "a@x.com");
        System.out.println("LinkedHashSet: " + new LinkedHashSet<>(emails));        // first-seen order
        System.out.println("distinct(): " + emails.stream().distinct().toList());
        System.out.println("TreeSet: " + new TreeSet<>(emails));                    // sorted

        Set<String> seen = new LinkedHashSet<>();
        String firstRepeated = null;
        for (String e : emails) {
            if (!seen.add(e)) { firstRepeated = e; break; }                         // add → false = duplicate
        }
        System.out.println("first repeated: " + firstRepeated);

        Set<String> a = Set.of("java", "spring", "kafka", "sql");
        Set<String> b = Set.of("kafka", "aws", "sql", "docker");

        Set<String> union = new TreeSet<>(a);
        union.addAll(b);
        Set<String> inter = new TreeSet<>(a);
        inter.retainAll(b);
        Set<String> diff = new TreeSet<>(a);
        diff.removeAll(b);
        Set<String> sym = new TreeSet<>(union);
        sym.removeAll(inter);

        System.out.println("union: " + union);
        System.out.println("intersection: " + inter);
        System.out.println("a - b: " + diff);
        System.out.println("symmetric difference: " + sym);
        System.out.println("a unchanged: " + new TreeSet<>(a));
    }
}
```

**Under the hood.** `HashSet` is just a `HashMap` whose keys are your elements and whose values are one shared dummy object (`PRESENT`) — so `add`/`contains`/`remove` are O(1) and depend on correct `equals`/`hashCode`, exactly like map keys. `LinkedHashSet` wraps a `LinkedHashMap`; `TreeSet` wraps a `TreeMap` (O(log n), sorted).

<!-- exercise: d14_e2 | Medium | The `TreeSet` comparator trap and `NavigableSet` -->
**Concepts:** `TreeSet` uses `compare() == 0` (not `equals`) to decide duplicates · consistent comparators with `thenComparing` · `floor` / `ceiling` / `lower` / `higher` · `headSet` / `tailSet` / `subSet` · `descendingSet` · `pollFirst` / `pollLast`

**Task.**

1. Create a `TreeSet<String>` ordered **by length** and add `"cat"`, `"dog"`, `"bird"`, `"ox"`. Print it and check `contains("pig")`. Explain the result.
2. Fix it with a comparator that breaks ties alphabetically.
3. On a `TreeSet<Integer>` of 10, 20, 30, 40, 50, use every navigation method listed in the expected output.

**Starter code** · `TreeSetTrap.java`

```java
import java.util.Comparator;
import java.util.List;
import java.util.NavigableSet;
import java.util.TreeSet;

public class TreeSetTrap {
    public static void main(String[] args) {
        TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
        byLength.addAll(List.of("cat", "dog", "bird", "ox"));
        System.out.println("by length only: " + byLength + " size=" + byLength.size());
        System.out.println("contains(\"pig\"): " + byLength.contains("pig"));

        TreeSet<String> fixed = new TreeSet<>();   // TODO: length, then alphabetical
        fixed.addAll(List.of("cat", "dog", "bird", "ox"));
        System.out.println("length then alpha: " + fixed);

        NavigableSet<Integer> s = new TreeSet<>(List.of(10, 20, 30, 40, 50));
        // TODO: print each line of the expected output using the NavigableSet API
    }
}
```

**Expected output**

```text
by length only: [ox, cat, bird] size=3
contains("pig"): true
length then alpha: [ox, cat, dog, bird]
floor(25)=20 ceiling(25)=30 lower(20)=10 higher(50)=null
headSet(30)=[10, 20] tailSet(30)=[30, 40, 50]
subSet[15,45)=[20, 30, 40]
descending=[50, 40, 30, 20, 10]
pollFirst=10 pollLast=50 remaining=[20, 30, 40]
```

<!-- hints -->
- With a length-only comparator, `"dog"` compares as **equal** to `"cat"` (both length 3), so `add("dog")` returns `false` and it's silently dropped. `contains("pig")` finds a length-3 element and says `true`.
- Rule: a `TreeSet`/`TreeMap` comparator must be **consistent with equals** — it should return 0 only for truly equal elements.
- `Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())`.
- `floor`/`ceiling` include the value itself; `lower`/`higher` are strict. `headSet(x)` excludes x, `tailSet(x)` includes it.

<!-- solution -->
```java
import java.util.Comparator;
import java.util.List;
import java.util.NavigableSet;
import java.util.TreeSet;

public class TreeSetTrap {
    public static void main(String[] args) {
        TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
        byLength.addAll(List.of("cat", "dog", "bird", "ox"));                 // "dog" compares equal to "cat" → dropped
        System.out.println("by length only: " + byLength + " size=" + byLength.size());
        System.out.println("contains(\"pig\"): " + byLength.contains("pig"));  // any length-3 string "matches"

        TreeSet<String> fixed = new TreeSet<>(Comparator.comparingInt(String::length)
                .thenComparing(Comparator.naturalOrder()));                    // 0 only for equal strings
        fixed.addAll(List.of("cat", "dog", "bird", "ox"));
        System.out.println("length then alpha: " + fixed);

        NavigableSet<Integer> s = new TreeSet<>(List.of(10, 20, 30, 40, 50));
        System.out.println("floor(25)=" + s.floor(25) + " ceiling(25)=" + s.ceiling(25)
                + " lower(20)=" + s.lower(20) + " higher(50)=" + s.higher(50));
        System.out.println("headSet(30)=" + s.headSet(30) + " tailSet(30)=" + s.tailSet(30));
        System.out.println("subSet[15,45)=" + s.subSet(15, true, 45, false));
        System.out.println("descending=" + s.descendingSet());
        System.out.println("pollFirst=" + s.pollFirst() + " pollLast=" + s.pollLast() + " remaining=" + s);
    }
}
```

**Same trap elsewhere.** `TreeMap` keys, `PriorityQueue` ordering and `Collections.sort` stability all depend on comparators. A comparator that returns 0 for different objects merges them in sorted collections — a bug that never throws and is hard to spot in production data.

<!-- exercise: d14_e3 | Medium | Sets in algorithms: O(n) solutions -->
**Concepts:** `HashSet` for O(1) membership · sliding-window set · set intersection · "only start counting at the beginning of a run"

**Task.** Implement four classic set-based solutions:

1. `longestConsecutive(nums)` — LeetCode 128, in **O(n)** (no sorting).
2. `containsNearbyDuplicate(nums, k)` — LeetCode 219: is there `i != j` with `nums[i] == nums[j]` and `|i − j| ≤ k`?
3. `firstRepeatedChar(s)` — the first character whose **second** occurrence comes earliest.
4. `intersection(a, b)` — LeetCode 349: unique common values, sorted.

**Starter code** · `SetAlgorithms.java`

```java
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class SetAlgorithms {
    public static void main(String[] args) {
        System.out.println("longest consecutive: " + longestConsecutive(new int[]{100, 4, 200, 1, 3, 2}));
        System.out.println("longest consecutive (dupes): " + longestConsecutive(new int[]{0, 3, 7, 2, 5, 8, 4, 6, 0, 1}));
        System.out.println("nearby duplicate k=3: " + containsNearbyDuplicate(new int[]{1, 2, 3, 1}, 3));
        System.out.println("nearby duplicate k=2: " + containsNearbyDuplicate(new int[]{1, 2, 3, 1, 2, 3}, 2));
        System.out.println("first repeated char: " + firstRepeatedChar("interview"));
        System.out.println("first repeated char: " + firstRepeatedChar("abc"));
        System.out.println("intersection: " + intersection(new int[]{4, 9, 5}, new int[]{9, 4, 9, 8, 4}));
    }

    static int longestConsecutive(int[] nums) { return 0; }                         // TODO
    static boolean containsNearbyDuplicate(int[] nums, int k) { return false; }     // TODO
    static Character firstRepeatedChar(String s) { return null; }                   // TODO
    static Set<Integer> intersection(int[] a, int[] b) { return Set.of(); }         // TODO
}
```

**Expected output**

```text
longest consecutive: 4
longest consecutive (dupes): 9
nearby duplicate k=3: true
nearby duplicate k=2: false
first repeated char: i
first repeated char: null
intersection: [4, 9]
```

<!-- hints -->
- Longest consecutive: put everything in a `HashSet`. Only start counting from `x` if `x - 1` is **not** in the set (x starts a run), then walk `x+1, x+2…`. Each number is visited at most twice → O(n).
- Nearby duplicate: keep a set of the last `k` values; before adding `nums[i]`, remove `nums[i - k - 1]`. If `add` returns `false`, you found one.
- First repeated char: scan left to right; the first time `seen.add(c)` returns `false`, return `c`.
- Intersection: put `a` into a set, then keep elements of `b` that are in it, collecting into a `TreeSet` for sorted output.

<!-- solution -->
```java
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class SetAlgorithms {
    public static void main(String[] args) {
        System.out.println("longest consecutive: " + longestConsecutive(new int[]{100, 4, 200, 1, 3, 2}));
        System.out.println("longest consecutive (dupes): " + longestConsecutive(new int[]{0, 3, 7, 2, 5, 8, 4, 6, 0, 1}));
        System.out.println("nearby duplicate k=3: " + containsNearbyDuplicate(new int[]{1, 2, 3, 1}, 3));
        System.out.println("nearby duplicate k=2: " + containsNearbyDuplicate(new int[]{1, 2, 3, 1, 2, 3}, 2));
        System.out.println("first repeated char: " + firstRepeatedChar("interview"));
        System.out.println("first repeated char: " + firstRepeatedChar("abc"));
        System.out.println("intersection: " + intersection(new int[]{4, 9, 5}, new int[]{9, 4, 9, 8, 4}));
    }

    static int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);
        int best = 0;
        for (int n : set) {
            if (set.contains(n - 1)) continue;          // not the start of a run
            int len = 1;
            while (set.contains(n + len)) len++;        // walk the run once
            best = Math.max(best, len);
        }
        return best;                                     // O(n)
    }

    static boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> window = new HashSet<>();
        for (int i = 0; i < nums.length; i++) {
            if (i > k) window.remove(nums[i - k - 1]);   // keep only the last k values
            if (!window.add(nums[i])) return true;       // already in the window
        }
        return false;
    }

    static Character firstRepeatedChar(String s) {
        Set<Character> seen = new HashSet<>();
        for (char c : s.toCharArray()) {
            if (!seen.add(c)) return c;
        }
        return null;
    }

    static Set<Integer> intersection(int[] a, int[] b) {
        Set<Integer> inA = new HashSet<>();
        for (int x : a) inA.add(x);
        Set<Integer> result = new TreeSet<>();
        for (int x : b) if (inA.contains(x)) result.add(x);   // O(n + m) instead of O(n × m)
        return result;
    }
}
```

**Interview tip.** When a brute force has a nested loop that asks "have I seen X?", a `HashSet` usually turns O(n²) into O(n) at the cost of O(n) memory — say that trade-off out loud.
