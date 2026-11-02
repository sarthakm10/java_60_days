Today you'll use the map APIs that replace whole blocks of `if/else`: atomic `merge`/`compute` on a `ConcurrentHashMap`, an LRU cache two ways, and `TreeMap`'s navigation methods for time-based lookups and bookings.

<!-- exercise: d13_e1 | Medium | Concurrent word count with `ConcurrentHashMap` -->
**Concepts:** `ConcurrentHashMap.merge` (atomic) · `computeIfAbsent` + `LongAdder` for hot counters · multimap with `computeIfAbsent(k, x -> new ArrayList<>())` · `compute` returning `null` removes · `putIfAbsent` · why check-then-act is unsafe

**Task.** Four threads each process one "document" 1,000 times and count words into **one shared** map.

1. Count with `ConcurrentHashMap<String, Integer>` and `merge`.
2. Count again with `ConcurrentHashMap<String, LongAdder>` and `computeIfAbsent(word, k -> new LongAdder()).increment()` — better under heavy contention.
3. Build a multimap "first letter → words" with `computeIfAbsent`.
4. Use `compute` to decrement a count, and to **remove** a key by returning `null`; show `putIfAbsent` returning the existing value.

**Starter code** · `ConcurrentWordCount.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.LongAdder;

public class ConcurrentWordCount {
    public static void main(String[] args) throws InterruptedException {
        List<String> docs = List.of("java kafka spring", "java spring", "kafka java", "spring boot java");

        Map<String, Integer> counts = new ConcurrentHashMap<>();
        Map<String, LongAdder> adders = new ConcurrentHashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (String doc : docs) {
            pool.submit(() -> {
                for (int round = 0; round < 1000; round++) {
                    for (String word : doc.split(" ")) {
                        // TODO 1: count with merge
                        // TODO 2: count with computeIfAbsent + LongAdder
                    }
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);

        System.out.println("merge counts: " + new TreeMap<>(counts));
        Map<String, Long> adderCounts = new TreeMap<>();
        adders.forEach((w, a) -> adderCounts.put(w, a.sum()));
        System.out.println("LongAdder counts: " + adderCounts);

        Map<Character, List<String>> byLetter = new TreeMap<>();
        // TODO 3: for each distinct word (sorted), group by first letter with computeIfAbsent
        System.out.println("by first letter: " + byLetter);

        // TODO 4a: compute("java", ...) to subtract 1 → print "java after compute: 3999"
        // TODO 4b: compute("boot", (k, v) -> null) → print "boot still present: false"
        // TODO 4c: putIfAbsent("kafka", 0) → print "putIfAbsent returned: 2000"
    }
}
```

**Expected output**

```text
merge counts: {boot=1000, java=4000, kafka=2000, spring=3000}
LongAdder counts: {boot=1000, java=4000, kafka=2000, spring=3000}
by first letter: {b=[boot], j=[java], k=[kafka], s=[spring]}
java after compute: 3999
boot still present: false
putIfAbsent returned: 2000
```

<!-- hints -->
- `counts.merge(word, 1, Integer::sum)` is one **atomic** operation on `ConcurrentHashMap`. The tempting `counts.put(w, counts.getOrDefault(w, 0) + 1)` is check-then-act and loses updates.
- `computeIfAbsent` creates the `LongAdder` exactly once per key, even if several threads race; `increment()` itself is thread-safe.
- `new TreeMap<>(counts)` gives a sorted snapshot for printing — `ConcurrentHashMap` iteration order is undefined.
- `compute(key, (k, v) -> v == null ? null : v - 1)` — returning `null` from the remapping function removes the entry.
- `putIfAbsent` returns the **existing** value when the key is present (and doesn't overwrite it).

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.LongAdder;

public class ConcurrentWordCount {
    public static void main(String[] args) throws InterruptedException {
        List<String> docs = List.of("java kafka spring", "java spring", "kafka java", "spring boot java");

        Map<String, Integer> counts = new ConcurrentHashMap<>();
        Map<String, LongAdder> adders = new ConcurrentHashMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(4);
        for (String doc : docs) {
            pool.submit(() -> {
                for (int round = 0; round < 1000; round++) {
                    for (String word : doc.split(" ")) {
                        counts.merge(word, 1, Integer::sum);                               // atomic per key
                        adders.computeIfAbsent(word, k -> new LongAdder()).increment();    // low-contention counter
                    }
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);

        System.out.println("merge counts: " + new TreeMap<>(counts));
        Map<String, Long> adderCounts = new TreeMap<>();
        adders.forEach((w, a) -> adderCounts.put(w, a.sum()));
        System.out.println("LongAdder counts: " + adderCounts);

        Map<Character, List<String>> byLetter = new TreeMap<>();
        for (String word : new TreeSet<>(counts.keySet())) {
            byLetter.computeIfAbsent(word.charAt(0), k -> new ArrayList<>()).add(word);   // multimap idiom
        }
        System.out.println("by first letter: " + byLetter);

        counts.compute("java", (k, v) -> v == null ? null : v - 1);
        System.out.println("java after compute: " + counts.get("java"));
        counts.compute("boot", (k, v) -> null);                                        // null → remove
        System.out.println("boot still present: " + counts.containsKey("boot"));
        System.out.println("putIfAbsent returned: " + counts.putIfAbsent("kafka", 0));
    }
}
```

**Why not `Hashtable` or `synchronizedMap`?** Both lock the **whole map** for every call, so threads queue up. `ConcurrentHashMap` (Java 8+) uses CAS to fill empty bins and locks only the **first node of one bin** for updates, so writes to different keys proceed in parallel and reads never lock. It also never throws `ConcurrentModificationException` while iterating.

<!-- exercise: d13_e2 | Medium | LRU cache two ways -->
**Concepts:** `LinkedHashMap(capacity, 0.75f, true)` + `removeEldestEntry` · hand-written O(1) LRU with `HashMap` + doubly linked list · eviction order

**Task.** Implement the same LRU cache (LeetCode 146) twice and run the **same** operations on both:

1. `LinkedLru<K, V>` — extend `LinkedHashMap` with access order and override `removeEldestEntry`.
2. `ManualLru` — `HashMap<Integer, Node>` + doubly linked list with sentinels; `get`/`put` in O(1); `get` of a missing key returns -1.

Operations (capacity 2): `put(1)`, `put(2)`, `get(1)`, `put(3)`, `get(2)`, `put(4)`, `get(1)`, `get(3)`, `get(4)`.

**Starter code** · `LruTwoWays.java`

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LruTwoWays {
    public static void main(String[] args) {
        LinkedLru<Integer, Integer> a = new LinkedLru<>(2);
        ManualLru b = new ManualLru(2);
        List<String> outA = new ArrayList<>(), outB = new ArrayList<>();

        a.put(1, 1); a.put(2, 2);
        outA.add(String.valueOf(a.getOrDefault(1, -1)));
        a.put(3, 3);
        outA.add(String.valueOf(a.getOrDefault(2, -1)));
        a.put(4, 4);
        for (int k : new int[]{1, 3, 4}) outA.add(String.valueOf(a.getOrDefault(k, -1)));

        b.put(1, 1); b.put(2, 2);
        outB.add(String.valueOf(b.get(1)));
        b.put(3, 3);
        outB.add(String.valueOf(b.get(2)));
        b.put(4, 4);
        for (int k : new int[]{1, 3, 4}) outB.add(String.valueOf(b.get(k)));

        System.out.println("LinkedHashMap LRU gets: " + outA + " keys " + a.keySet());
        System.out.println("manual LRU gets:        " + outB + " keys " + b.keysLruToMru());
    }
}

class LinkedLru<K, V> /* TODO: extends LinkedHashMap<K, V> */ {
    LinkedLru(int capacity) { /* TODO */ }
    void put(K k, V v) { }                          // TODO: remove once you extend LinkedHashMap
    V getOrDefault(Object k, V d) { return d; }     // TODO: remove once you extend LinkedHashMap
    List<K> keySet() { return List.of(); }          // TODO: remove once you extend LinkedHashMap
}

class ManualLru {
    // TODO: Node class, map, sentinels, capacity
    ManualLru(int capacity) { }
    int get(int key) { return -1; }                  // TODO
    void put(int key, int value) { }                 // TODO
    List<Integer> keysLruToMru() { return List.of(); }   // TODO: walk from head to tail
}
```

**Expected output**

```text
LinkedHashMap LRU gets: [1, -1, -1, 3, 4] keys [3, 4]
manual LRU gets:        [1, -1, -1, 3, 4] keys [3, 4]
```

<!-- hints -->
- `super(capacity, 0.75f, true)` — the third argument switches iteration order from insertion to **access** order.
- `removeEldestEntry(Map.Entry<K, V> eldest)` is called after every `put`; return `size() > capacity` to evict the least-recently-used entry.
- `getOrDefault` on an access-ordered `LinkedHashMap` counts as an access only when the key exists — so it also refreshes recency.
- Manual version: on `get`, move the node to the front; on `put` of a new key at capacity, remove `tail.prev` from both the list and the map.
- Once `LinkedLru` extends `LinkedHashMap`, delete the three stub methods — the inherited ones do the job.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LruTwoWays {
    public static void main(String[] args) {
        LinkedLru<Integer, Integer> a = new LinkedLru<>(2);
        ManualLru b = new ManualLru(2);
        List<String> outA = new ArrayList<>(), outB = new ArrayList<>();

        a.put(1, 1); a.put(2, 2);
        outA.add(String.valueOf(a.getOrDefault(1, -1)));
        a.put(3, 3);                                         // evicts 2 (1 was used more recently)
        outA.add(String.valueOf(a.getOrDefault(2, -1)));
        a.put(4, 4);                                         // evicts 1
        for (int k : new int[]{1, 3, 4}) outA.add(String.valueOf(a.getOrDefault(k, -1)));

        b.put(1, 1); b.put(2, 2);
        outB.add(String.valueOf(b.get(1)));
        b.put(3, 3);
        outB.add(String.valueOf(b.get(2)));
        b.put(4, 4);
        for (int k : new int[]{1, 3, 4}) outB.add(String.valueOf(b.get(k)));

        System.out.println("LinkedHashMap LRU gets: " + outA + " keys " + a.keySet());
        System.out.println("manual LRU gets:        " + outB + " keys " + b.keysLruToMru());
    }
}

class LinkedLru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LinkedLru(int capacity) {
        super(capacity, 0.75f, true);                        // accessOrder = true
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;                            // evict the least recently used
    }
}

class ManualLru {
    private static final class Node {
        int key, value;
        Node prev, next;
        Node(int key, int value) { this.key = key; this.value = value; }
    }

    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);   // head side = LRU, tail side = MRU
    private final int capacity;

    ManualLru(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        unlink(n);
        addBeforeTail(n);                                    // most recently used
        return n.value;
    }

    void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) {
            n.value = value;
            unlink(n);
            addBeforeTail(n);
            return;
        }
        if (map.size() == capacity) {
            Node lru = head.next;                            // least recently used
            unlink(lru);
            map.remove(lru.key);
        }
        n = new Node(key, value);
        map.put(key, n);
        addBeforeTail(n);
    }

    List<Integer> keysLruToMru() {
        List<Integer> keys = new ArrayList<>();
        for (Node n = head.next; n != tail; n = n.next) keys.add(n.key);
        return keys;
    }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }

    private void addBeforeTail(Node n) {
        n.prev = tail.prev;
        n.next = tail;
        tail.prev.next = n;
        tail.prev = n;
    }
}
```

**In production** use a library cache — **Caffeine** (Spring Boot's default local cache) uses W-TinyLFU, which beats plain LRU on real traffic, supports size and time limits, and is concurrent. `LinkedHashMap`-based LRU is **not thread-safe**; wrap it with `Collections.synchronizedMap` if you must share it.

<!-- exercise: d13_e3 | Medium | `TreeMap` navigation: price history, bookings, ranges -->
**Concepts:** `floorEntry` / `ceilingEntry` / `higherKey` · `headMap` / `tailMap` / `subMap` (views) · `firstKey` / `lastKey` / `pollFirstEntry` · `descendingMap` · `EnumMap`

**Task.**

1. **Price history** (like LeetCode 981 Time Based Key-Value Store): prices are recorded at times 10, 20 and 30. What was the price at time 25? At 5 (before any record)?
2. **Calendar** (LeetCode 729): `book(start, end)` accepts a half-open interval `[start, end)` only if it doesn't overlap an existing booking — check just the neighbours with `floorEntry` and `ceilingEntry`.
3. **Ranges:** count scores in `[60, 80)`, list everything ≥ 90, and print the scores high-to-low.
4. **EnumMap:** working hours per weekday, printed in enum order.

**Starter code** · `TreeMapNavigation.java`

```java
import java.time.DayOfWeek;
import java.util.EnumMap;
import java.util.Map;
import java.util.TreeMap;

public class TreeMapNavigation {
    public static void main(String[] args) {
        TreeMap<Integer, Integer> prices = new TreeMap<>(Map.of(10, 100, 20, 120, 30, 90));
        System.out.println("price at 25: " + priceAt(prices, 25));
        System.out.println("price at 5: " + priceAt(prices, 5));
        System.out.println("next change after 20: t=" + 0);       // TODO: higherKey

        Calendar cal = new Calendar();
        System.out.println("book [10,20): " + cal.book(10, 20));
        System.out.println("book [15,25): " + cal.book(15, 25));
        System.out.println("book [20,30): " + cal.book(20, 30));
        System.out.println("book [5,10): " + cal.book(5, 10));
        System.out.println("book [8,12): " + cal.book(8, 12));

        TreeMap<Integer, String> scores = new TreeMap<>(Map.of(55, "Ravi", 62, "Neha", 71, "Kabir", 79, "Zoya", 90, "Asha", 95, "Arjun"));
        System.out.println("scores in [60, 80): 0");              // TODO: subMap(60, true, 80, false).size()
        System.out.println(">= 90: {}");                          // TODO: tailMap(90, true)
        System.out.println("high to low: []");                    // TODO: descendingMap().values()
        System.out.println("lowest removed: " + null + ", next lowest: " + null);   // TODO: pollFirstEntry, firstKey

        Map<DayOfWeek, Integer> hours = new EnumMap<>(DayOfWeek.class);
        hours.put(DayOfWeek.FRIDAY, 6);
        hours.put(DayOfWeek.MONDAY, 8);
        hours.put(DayOfWeek.WEDNESDAY, 9);
        System.out.println("hours: " + hours);
    }

    static Integer priceAt(TreeMap<Integer, Integer> prices, int t) {
        return null; // TODO: floorEntry → value, or null
    }
}

class Calendar {
    private final TreeMap<Integer, Integer> bookings = new TreeMap<>();   // start → end
    boolean book(int start, int end) {
        return false; // TODO
    }
}
```

**Expected output**

```text
price at 25: 120
price at 5: null
next change after 20: t=30
book [10,20): true
book [15,25): false
book [20,30): true
book [5,10): true
book [8,12): false
scores in [60, 80): 3
>= 90: {90=Asha, 95=Arjun}
high to low: [Arjun, Asha, Zoya, Kabir, Neha, Ravi]
lowest removed: 55=Ravi, next lowest: 62
hours: {MONDAY=8, WEDNESDAY=9, FRIDAY=6}
```

<!-- hints -->
- `floorEntry(t)` = greatest key ≤ t; `ceilingEntry(t)` = smallest key ≥ t; `lowerKey`/`higherKey` are the strict versions. All return `null` when nothing qualifies.
- A new booking `[s, e)` overlaps the previous booking if `prev.end > s`, and the next booking if `next.start < e`. Only those two neighbours can overlap — that's what makes it O(log n).
- `subMap(from, true, to, false)`, `headMap`, `tailMap` return **live views** — changes to the view write through to the map.
- `EnumMap` always iterates in the enum's declaration order (MONDAY … SUNDAY), regardless of insertion order.

<!-- solution -->
```java
import java.time.DayOfWeek;
import java.util.EnumMap;
import java.util.Map;
import java.util.TreeMap;

public class TreeMapNavigation {
    public static void main(String[] args) {
        TreeMap<Integer, Integer> prices = new TreeMap<>(Map.of(10, 100, 20, 120, 30, 90));
        System.out.println("price at 25: " + priceAt(prices, 25));
        System.out.println("price at 5: " + priceAt(prices, 5));
        System.out.println("next change after 20: t=" + prices.higherKey(20));     // strictly greater

        Calendar cal = new Calendar();
        System.out.println("book [10,20): " + cal.book(10, 20));
        System.out.println("book [15,25): " + cal.book(15, 25));
        System.out.println("book [20,30): " + cal.book(20, 30));
        System.out.println("book [5,10): " + cal.book(5, 10));
        System.out.println("book [8,12): " + cal.book(8, 12));

        TreeMap<Integer, String> scores = new TreeMap<>(Map.of(55, "Ravi", 62, "Neha", 71, "Kabir", 79, "Zoya", 90, "Asha", 95, "Arjun"));
        System.out.println("scores in [60, 80): " + scores.subMap(60, true, 80, false).size());
        System.out.println(">= 90: " + scores.tailMap(90, true));
        System.out.println("high to low: " + scores.descendingMap().values());
        Map.Entry<Integer, String> lowest = scores.pollFirstEntry();                   // removes it
        System.out.println("lowest removed: " + lowest + ", next lowest: " + scores.firstKey());

        Map<DayOfWeek, Integer> hours = new EnumMap<>(DayOfWeek.class);                // array indexed by ordinal
        hours.put(DayOfWeek.FRIDAY, 6);
        hours.put(DayOfWeek.MONDAY, 8);
        hours.put(DayOfWeek.WEDNESDAY, 9);
        System.out.println("hours: " + hours);
    }

    static Integer priceAt(TreeMap<Integer, Integer> prices, int t) {
        Map.Entry<Integer, Integer> e = prices.floorEntry(t);                         // latest record at or before t
        return e == null ? null : e.getValue();
    }
}

class Calendar {
    private final TreeMap<Integer, Integer> bookings = new TreeMap<>();   // start → end

    boolean book(int start, int end) {
        Map.Entry<Integer, Integer> prev = bookings.floorEntry(start);    // starts at or before us
        Map.Entry<Integer, Integer> next = bookings.ceilingEntry(start);  // starts at or after us
        if (prev != null && prev.getValue() > start) return false;        // previous one runs into us
        if (next != null && next.getKey() < end) return false;            // we run into the next one
        bookings.put(start, end);
        return true;
    }
}
```

**Where TreeMap shows up in real systems:** rate-limit windows and time-series lookups (`floorEntry`), leaderboards and price ladders (`descendingMap`, `headMap`), consistent-hash rings (`ceilingEntry` with wrap-around — Day 55). For concurrent access use `ConcurrentSkipListMap`, which offers the same navigation API.
