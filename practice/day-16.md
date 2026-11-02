Today is about the toolbox around the collections: the `Collections` utility methods, immutable views vs copies, the map/set tricks that show up in coding rounds, and three specialised collections — `BitSet`, `IdentityHashMap` and `DelayQueue`.

<!-- exercise: d16_e1 | Medium | `Collections` utilities lab -->
**Concepts:** `binarySearch` and its negative insertion point · stable sorting (TimSort) · `unmodifiableList` (a read-only **view**) vs `List.copyOf` (a true copy) · `frequency`, `nCopies`, `rotate`, `max` with a comparator, `disjoint`

**Task.** Use one `Collections`/`List` utility per line to produce the expected output — no hand-written loops. Then explain lines 2, 3 and 4 in your own words.

**Starter code** · `CollectionsLab.java`

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class CollectionsLab {
    record Person(String name, String dept) { }

    public static void main(String[] args) {
        List<Integer> sorted = List.of(10, 20, 30, 40, 50);
        System.out.println("1. binarySearch(30) = " + 0);                       // TODO
        int missing = 0;                                                          // TODO: binarySearch(35)
        System.out.println("2. binarySearch(35) = " + missing + " -> insert at " + (-missing - 1));

        List<Person> people = new ArrayList<>(List.of(new Person("Ravi", "Eng"), new Person("Asha", "Sales"),
                new Person("Neha", "Eng"), new Person("Kabir", "Sales")));
        // TODO: sort people by dept only
        System.out.println("3. stable sort by dept: " + people.stream().map(Person::name).toList());

        List<String> base = new ArrayList<>(List.of("a", "b"));
        List<String> view = List.of();     // TODO: unmodifiable view of base
        List<String> copy = List.of();     // TODO: immutable copy of base
        base.add("c");
        System.out.println("4. view " + view + ", copy " + copy);

        System.out.println("5. frequency of a: " + 0);                          // TODO on List.of("a","b","a","c","a")
        System.out.println("6. divider: " + "");                                // TODO: 5 x "=" using nCopies
        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5));
        // TODO: rotate nums by 2
        System.out.println("7. rotated by 2: " + nums);
        System.out.println("8. longest word: " + "");                           // TODO: max by length of ("kafka","aws","spring")
        System.out.println("9. disjoint: " + false);                            // TODO: [1,2] vs [3,4]
    }
}
```

**Expected output**

```text
1. binarySearch(30) = 2
2. binarySearch(35) = -4 -> insert at 3
3. stable sort by dept: [Ravi, Neha, Asha, Kabir]
4. view [a, b, c], copy [a, b]
5. frequency of a: 3
6. divider: =====
7. rotated by 2: [4, 5, 1, 2, 3]
8. longest word: spring
9. disjoint: true
```

<!-- hints -->
- `Collections.binarySearch` returns `-(insertionPoint) - 1` when the key is missing, so a negative result still tells you where the key **would** go. The list must already be sorted — otherwise the result is undefined.
- `people.sort(Comparator.comparing(Person::dept))` — `List.sort` is stable, so Ravi stays before Neha and Asha before Kabir.
- `Collections.unmodifiableList(base)` wraps `base` (you see later changes). `List.copyOf(base)` snapshots it.
- `String.join("", Collections.nCopies(5, "="))` — or `"=".repeat(5)` on Java 11+.
- `Collections.rotate(list, 2)` moves the last two elements to the front.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class CollectionsLab {
    record Person(String name, String dept) { }

    public static void main(String[] args) {
        List<Integer> sorted = List.of(10, 20, 30, 40, 50);
        System.out.println("1. binarySearch(30) = " + Collections.binarySearch(sorted, 30));
        int missing = Collections.binarySearch(sorted, 35);                     // -(3) - 1
        System.out.println("2. binarySearch(35) = " + missing + " -> insert at " + (-missing - 1));

        List<Person> people = new ArrayList<>(List.of(new Person("Ravi", "Eng"), new Person("Asha", "Sales"),
                new Person("Neha", "Eng"), new Person("Kabir", "Sales")));
        people.sort(Comparator.comparing(Person::dept));                        // TimSort: stable
        System.out.println("3. stable sort by dept: " + people.stream().map(Person::name).toList());

        List<String> base = new ArrayList<>(List.of("a", "b"));
        List<String> view = Collections.unmodifiableList(base);                 // read-only window onto base
        List<String> copy = List.copyOf(base);                                   // independent snapshot
        base.add("c");
        System.out.println("4. view " + view + ", copy " + copy);

        System.out.println("5. frequency of a: " + Collections.frequency(List.of("a", "b", "a", "c", "a"), "a"));
        System.out.println("6. divider: " + String.join("", Collections.nCopies(5, "=")));
        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5));
        Collections.rotate(nums, 2);
        System.out.println("7. rotated by 2: " + nums);
        System.out.println("8. longest word: " + Collections.max(List.of("kafka", "aws", "spring"), Comparator.comparingInt(String::length)));
        System.out.println("9. disjoint: " + Collections.disjoint(List.of(1, 2), List.of(3, 4)));
    }
}
```

**Immutability cheat sheet.** `List.of` / `Set.of` / `Map.of`: immutable, no nulls, throw on mutation. `List.copyOf`: immutable snapshot (returns the same instance if the input is already immutable). `Collections.unmodifiableX`: read-only **view** — the owner can still change it underneath you. `Arrays.asList`: fixed-size, writable, array-backed. Return `copyOf` from getters when you need a defensive copy.

<!-- exercise: d16_e2 | Medium | Map and set patterns for coding rounds -->
**Concepts:** sort a map by value into a `LinkedHashMap` · find duplicates with `Set.add` · multiset intersection with counts (`merge`) · first non-repeating character with `LinkedHashMap`

**Task.** Implement four helpers that appear constantly in interviews and code reviews:

1. `sortByValueDesc(map)` — highest value first, ties broken by key, returned as a `LinkedHashMap`.
2. `findDuplicates(nums)` — every value that appears more than once, sorted, in O(n).
3. `intersectWithCounts(a, b)` — LeetCode 350: common elements including repeats.
4. `firstUnique(s)` — first character that appears exactly once, or `'_'`.

**Starter code** · `MapSetPatterns.java`

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public class MapSetPatterns {
    public static void main(String[] args) {
        Map<String, Integer> skills = Map.of("java", 5, "sql", 3, "kafka", 5, "aws", 1);
        System.out.println("by value: " + sortByValueDesc(skills));
        System.out.println("duplicates: " + findDuplicates(new int[]{4, 3, 2, 7, 8, 2, 3, 1}));
        System.out.println("intersection: " + intersectWithCounts(new int[]{1, 2, 2, 1}, new int[]{2, 2}));
        System.out.println("intersection: " + intersectWithCounts(new int[]{4, 9, 5}, new int[]{9, 4, 9, 8, 4}));
        System.out.println("first unique: " + firstUnique("leetcode") + " " + firstUnique("loveleetcode") + " " + firstUnique("aabb"));
    }

    static Map<String, Integer> sortByValueDesc(Map<String, Integer> map) { return map; }   // TODO
    static Set<Integer> findDuplicates(int[] nums) { return Set.of(); }                   // TODO
    static List<Integer> intersectWithCounts(int[] a, int[] b) { return List.of(); }      // TODO
    static char firstUnique(String s) { return '_'; }                                      // TODO
}
```

**Expected output**

```text
by value: {java=5, kafka=5, sql=3, aws=1}
duplicates: [2, 3]
intersection: [2, 2]
intersection: [9, 4]
first unique: l v _
```

<!-- hints -->
- `map.entrySet().stream().sorted(Map.Entry.<String, Integer>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))` then `collect(toMap(..., ..., (x, y) -> x, LinkedHashMap::new))` — the `LinkedHashMap` factory is what keeps the sorted order.
- Duplicates: `if (!seen.add(n)) dupes.add(n);` with `dupes` as a `TreeSet` for sorted output.
- Counts intersection: count `a` with `merge`, then for each `x` in `b`, if `count > 0` add it and decrement.
- First unique: count characters into a `LinkedHashMap` (keeps first-seen order), then return the first key with count 1.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class MapSetPatterns {
    public static void main(String[] args) {
        Map<String, Integer> skills = Map.of("java", 5, "sql", 3, "kafka", 5, "aws", 1);
        System.out.println("by value: " + sortByValueDesc(skills));
        System.out.println("duplicates: " + findDuplicates(new int[]{4, 3, 2, 7, 8, 2, 3, 1}));
        System.out.println("intersection: " + intersectWithCounts(new int[]{1, 2, 2, 1}, new int[]{2, 2}));
        System.out.println("intersection: " + intersectWithCounts(new int[]{4, 9, 5}, new int[]{9, 4, 9, 8, 4}));
        System.out.println("first unique: " + firstUnique("leetcode") + " " + firstUnique("loveleetcode") + " " + firstUnique("aabb"));
    }

    static Map<String, Integer> sortByValueDesc(Map<String, Integer> map) {
        return map.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (x, y) -> x, LinkedHashMap::new));                       // keeps the sorted order
    }

    static Set<Integer> findDuplicates(int[] nums) {
        Set<Integer> seen = new HashSet<>(), dupes = new TreeSet<>();
        for (int n : nums) {
            if (!seen.add(n)) dupes.add(n);                                      // O(n) overall
        }
        return dupes;
    }

    static List<Integer> intersectWithCounts(int[] a, int[] b) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : a) counts.merge(x, 1, Integer::sum);
        List<Integer> result = new ArrayList<>();
        for (int x : b) {
            if (counts.getOrDefault(x, 0) > 0) {
                result.add(x);
                counts.merge(x, -1, Integer::sum);
            }
        }
        return result;
    }

    static char firstUnique(String s) {
        Map<Character, Integer> counts = new LinkedHashMap<>();                  // first-seen order
        for (char c : s.toCharArray()) counts.merge(c, 1, Integer::sum);
        for (Map.Entry<Character, Integer> e : counts.entrySet()) {
            if (e.getValue() == 1) return e.getKey();
        }
        return '_';
    }
}
```

**Pattern map.** Counting → `HashMap.merge`. "Seen before?" → `HashSet.add`. Order matters → `LinkedHashMap`/`LinkedHashSet`. Sorted output → `TreeMap`/`TreeSet` or sort at the end. Top-K → `PriorityQueue`. Ranges/nearest → `TreeMap` navigation.

<!-- exercise: d16_e3 | Medium | Specialised collections: `BitSet`, `IdentityHashMap`, `DelayQueue` -->
**Concepts:** `BitSet` as a compact boolean array (Sieve of Eratosthenes, `and`/`cardinality`) · `IdentityHashMap` uses `==` instead of `equals` · `DelayQueue` releases elements only after their delay expires, earliest first

**Task.**

1. Implement the **Sieve of Eratosthenes** with a `BitSet`: primes up to 50, and the count of primes below 100.
2. Build bit sets of multiples of 2 and of 3 up to 30, and `and` them (multiples of 6).
3. Put two distinct `new String("key")` objects into a `HashMap` and an `IdentityHashMap`; compare sizes.
4. Add three jobs to a `DelayQueue` with delays 300 ms, 100 ms and 200 ms, then `take()` all three — in which order do they come out?

**Starter code** · `SpecialCollections.java`

```java
import java.util.ArrayList;
import java.util.BitSet;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.DelayQueue;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;

public class SpecialCollections {
    public static void main(String[] args) throws InterruptedException {
        BitSet primes50 = sieve(50);
        System.out.println("primes <= 50: " + primes50);
        System.out.println("count of primes < 100: " + sieve(99).cardinality());

        BitSet twos = new BitSet(), threes = new BitSet();
        // TODO: set multiples of 2 and of 3 from 0 to 30, then and() a copy
        System.out.println("multiples of 6: " + new BitSet());

        String k1 = new String("key"), k2 = new String("key");
        // TODO: put both into a HashMap and an IdentityHashMap
        System.out.println("HashMap size: " + 0 + ", IdentityHashMap size: " + 0);

        DelayQueue<Job> jobs = new DelayQueue<>();
        jobs.add(new Job("report", 300));
        jobs.add(new Job("email", 100));
        jobs.add(new Job("cleanup", 200));
        List<String> order = new ArrayList<>();
        while (!jobs.isEmpty()) order.add(jobs.take().name());
        System.out.println("DelayQueue order: " + order);
    }

    static BitSet sieve(int n) {
        return new BitSet(); // TODO: mark 2..n as candidates, clear multiples of each prime
    }
}

class Job implements Delayed {
    private final String name;
    private final long readyAt;                         // System.nanoTime() when it becomes available

    Job(String name, long delayMs) {
        this.name = name;
        this.readyAt = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(delayMs);
    }

    String name() { return name; }

    @Override
    public long getDelay(TimeUnit unit) {
        return 0; // TODO: remaining delay converted to the requested unit
    }

    @Override
    public int compareTo(Delayed other) {
        return 0; // TODO: earliest readyAt first
    }
}
```

**Expected output**

```text
primes <= 50: {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47}
count of primes < 100: 25
multiples of 6: {0, 6, 12, 18, 24, 30}
HashMap size: 1, IdentityHashMap size: 2
DelayQueue order: [email, cleanup, report]
```

<!-- hints -->
- Sieve: `bits.set(2, n + 1)`; for each `p` with `p * p <= n`, if `bits.get(p)`, clear `p*p, p*p + p, …`. Iterate set bits with `nextSetBit`.
- A `BitSet` stores one **bit** per flag — a million flags take ~125 KB instead of ~16 MB for a `boolean[]`-backed `List<Boolean>`.
- `BitSet` ops mutate the receiver: clone first (`(BitSet) twos.clone()`) if you need to keep the original.
- `IdentityHashMap` compares keys with `==` — the two `new String("key")` objects are different objects, so both are kept.
- `getDelay`: `unit.convert(readyAt - System.nanoTime(), TimeUnit.NANOSECONDS)`; `compareTo`: `Long.compare(readyAt, ((Job) other).readyAt)`.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.BitSet;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.DelayQueue;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;

public class SpecialCollections {
    public static void main(String[] args) throws InterruptedException {
        BitSet primes50 = sieve(50);
        System.out.println("primes <= 50: " + primes50);
        System.out.println("count of primes < 100: " + sieve(99).cardinality());   // number of set bits

        BitSet twos = new BitSet(), threes = new BitSet();
        for (int i = 0; i <= 30; i += 2) twos.set(i);
        for (int i = 0; i <= 30; i += 3) threes.set(i);
        BitSet sixes = (BitSet) twos.clone();
        sixes.and(threes);                                                            // bitwise AND
        System.out.println("multiples of 6: " + sixes);

        String k1 = new String("key"), k2 = new String("key");                        // equal, but different objects
        Map<String, Integer> byEquals = new HashMap<>();
        Map<String, Integer> byIdentity = new IdentityHashMap<>();
        byEquals.put(k1, 1);
        byEquals.put(k2, 2);
        byIdentity.put(k1, 1);
        byIdentity.put(k2, 2);
        System.out.println("HashMap size: " + byEquals.size() + ", IdentityHashMap size: " + byIdentity.size());

        DelayQueue<Job> jobs = new DelayQueue<>();
        jobs.add(new Job("report", 300));
        jobs.add(new Job("email", 100));
        jobs.add(new Job("cleanup", 200));
        List<String> order = new ArrayList<>();
        while (!jobs.isEmpty()) order.add(jobs.take().name());                        // blocks until each is due
        System.out.println("DelayQueue order: " + order);
    }

    static BitSet sieve(int n) {
        BitSet bits = new BitSet(n + 1);
        bits.set(2, n + 1);                                                           // candidates 2..n
        for (int p = 2; (long) p * p <= n; p = bits.nextSetBit(p + 1)) {
            for (int m = p * p; m <= n; m += p) bits.clear(m);                        // cross out multiples
        }
        return bits;
    }
}

class Job implements Delayed {
    private final String name;
    private final long readyAt;

    Job(String name, long delayMs) {
        this.name = name;
        this.readyAt = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(delayMs);
    }

    String name() { return name; }

    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(readyAt - System.nanoTime(), TimeUnit.NANOSECONDS);       // <= 0 means ready
    }

    @Override
    public int compareTo(Delayed other) {
        return Long.compare(readyAt, ((Job) other).readyAt);                          // earliest first
    }
}
```

**Where these appear.** `BitSet`: Bloom filters (Day 55), feature flags per user id, sieves, compact visited-sets for huge graphs. `IdentityHashMap`: object-graph traversal (serializers, deep-copy tools track *which object* they've already seen, not which equal value). `DelayQueue`: retry-with-delay queues, session expiry, simple schedulers — in services you'd usually use a `ScheduledExecutorService`.
