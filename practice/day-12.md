HashMap is the most-asked collection topic, and "implement a HashMap" is a real interview question. Today you'll build one, watch collisions and resizes happen at the bit level, and pick the right map for the job.

<!-- exercise: d12_e1 | Hard | Implement your own `HashMap` -->
**Concepts:** bucket array of nodes · hash spreading `h ^ (h >>> 16)` · index `hash & (n - 1)` · chaining · load factor 0.75 and doubling · splitting buckets into "lo" and "hi" lists on resize · `null` key in bucket 0

**Task.** Implement `MyHashMap<K, V>` with `put` (returns the old value), `get`, `remove`, `size()` and `capacity()`:

- Lazily allocate 16 buckets; when `size > capacity × 0.75`, **double** the table.
- On resize, split each chain into a *lo* list (stays at index `i`) and a *hi* list (moves to `i + oldCapacity`) using `(hash & oldCapacity) == 0` — no rehashing needed.
- Append new nodes at the **tail** of a chain (Java 8 behaviour).
- Support a `null` key.

**Starter code** · `MyHashMapDemo.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class MyHashMapDemo {
    public static void main(String[] args) {
        MyHashMap<String, Integer> map = new MyHashMap<>();
        List<Integer> steps = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            map.put("key" + i, i);
            if (steps.isEmpty() || steps.get(steps.size() - 1) != map.capacity()) steps.add(map.capacity());
        }
        System.out.println("capacity steps: " + steps);
        System.out.println("size: " + map.size());
        System.out.println("get(key42): " + map.get("key42"));
        System.out.println("put(key42, 4200) returned old value: " + map.put("key42", 4200));
        System.out.println("get(key42) now: " + map.get("key42"));
        map.put(null, -1);
        System.out.println("null key: " + map.get(null));
        System.out.println("remove(key7) returned " + map.remove("key7") + ", size " + map.size());
        System.out.println("get(missing): " + map.get("missing"));
        map.put("Aa", 1);
        map.put("BB", 2);
        System.out.println("Aa=" + map.get("Aa") + ", BB=" + map.get("BB") + " (same hashCode " + "Aa".hashCode() + ")");
        System.out.println("final size: " + map.size());
    }
}

class MyHashMap<K, V> {
    private static final class Node<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;
        Node(int hash, K key, V value) { this.hash = hash; this.key = key; this.value = value; }
    }

    private Node<K, V>[] table;
    private int size, threshold;

    static int hash(Object key) {
        return 0; // TODO: 0 for null, otherwise spread the high bits into the low bits
    }

    V put(K key, V value) { return null; }   // TODO
    V get(Object key) { return null; }       // TODO
    V remove(Object key) { return null; }    // TODO
    int size() { return size; }
    int capacity() { return table == null ? 0 : table.length; }

    private void resize() { }                // TODO: allocate 16 or double, split chains lo/hi
}
```

**Expected output**

```text
capacity steps: [16, 32, 64, 128, 256]
size: 100
get(key42): 42
put(key42, 4200) returned old value: 42
get(key42) now: 4200
null key: -1
remove(key7) returned 7, size 100
get(missing): null
Aa=1, BB=2 (same hashCode 2112)
final size: 102
```

<!-- hints -->
- `hash`: `int h; return key == null ? 0 : (h = key.hashCode()) ^ (h >>> 16);` — mixing the high 16 bits matters because the index only uses the **low** bits.
- Index: `hash & (table.length - 1)` equals `hash % length` when length is a power of two, but is much cheaper.
- In `put`, walk the chain comparing `n.hash == h && Objects.equals(n.key, key)` — checking the stored hash first skips most `equals` calls.
- Resize split: if `(n.hash & oldCap) == 0` the node stays at `i`, otherwise it moves to `i + oldCap`. Keep two head/tail pairs to preserve order.
- Generic arrays: `(Node<K, V>[]) new Node[capacity]` with `@SuppressWarnings("unchecked")`.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class MyHashMapDemo {
    public static void main(String[] args) {
        MyHashMap<String, Integer> map = new MyHashMap<>();
        List<Integer> steps = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            map.put("key" + i, i);
            if (steps.isEmpty() || steps.get(steps.size() - 1) != map.capacity()) steps.add(map.capacity());
        }
        System.out.println("capacity steps: " + steps);
        System.out.println("size: " + map.size());
        System.out.println("get(key42): " + map.get("key42"));
        System.out.println("put(key42, 4200) returned old value: " + map.put("key42", 4200));
        System.out.println("get(key42) now: " + map.get("key42"));
        map.put(null, -1);
        System.out.println("null key: " + map.get(null));
        System.out.println("remove(key7) returned " + map.remove("key7") + ", size " + map.size());
        System.out.println("get(missing): " + map.get("missing"));
        map.put("Aa", 1);
        map.put("BB", 2);
        System.out.println("Aa=" + map.get("Aa") + ", BB=" + map.get("BB") + " (same hashCode " + "Aa".hashCode() + ")");
        System.out.println("final size: " + map.size());
    }
}

class MyHashMap<K, V> {
    private static final int DEFAULT_CAPACITY = 16;
    private static final float LOAD_FACTOR = 0.75f;

    private static final class Node<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;
        Node(int hash, K key, V value) { this.hash = hash; this.key = key; this.value = value; }
    }

    private Node<K, V>[] table;
    private int size, threshold;

    static int hash(Object key) {
        int h;
        return key == null ? 0 : (h = key.hashCode()) ^ (h >>> 16);    // spread high bits downward
    }

    V put(K key, V value) {
        if (table == null) resize();
        int h = hash(key), i = h & (table.length - 1);
        Node<K, V> n = table[i], last = null;
        for (; n != null; last = n, n = n.next) {
            if (n.hash == h && Objects.equals(n.key, key)) {             // existing key → replace
                V old = n.value;
                n.value = value;
                return old;
            }
        }
        Node<K, V> created = new Node<>(h, key, value);
        if (last == null) table[i] = created; else last.next = created;  // append at the tail
        if (++size > threshold) resize();
        return null;
    }

    V get(Object key) {
        if (table == null) return null;
        int h = hash(key);
        for (Node<K, V> n = table[h & (table.length - 1)]; n != null; n = n.next) {
            if (n.hash == h && Objects.equals(n.key, key)) return n.value;
        }
        return null;
    }

    V remove(Object key) {
        if (table == null) return null;
        int h = hash(key), i = h & (table.length - 1);
        for (Node<K, V> n = table[i], prev = null; n != null; prev = n, n = n.next) {
            if (n.hash == h && Objects.equals(n.key, key)) {
                if (prev == null) table[i] = n.next; else prev.next = n.next;
                size--;
                return n.value;
            }
        }
        return null;
    }

    int size() { return size; }
    int capacity() { return table == null ? 0 : table.length; }

    @SuppressWarnings("unchecked")
    private void resize() {
        Node<K, V>[] old = table;
        int oldCap = old == null ? 0 : old.length;
        int newCap = oldCap == 0 ? DEFAULT_CAPACITY : oldCap * 2;
        Node<K, V>[] fresh = (Node<K, V>[]) new Node[newCap];
        for (int i = 0; i < oldCap; i++) {
            Node<K, V> loHead = null, loTail = null, hiHead = null, hiTail = null;
            for (Node<K, V> n = old[i], next; n != null; n = next) {
                next = n.next;
                n.next = null;
                if ((n.hash & oldCap) == 0) {                            // new bit is 0 → same index
                    if (loTail == null) loHead = n; else loTail.next = n;
                    loTail = n;
                } else {                                                 // new bit is 1 → index + oldCap
                    if (hiTail == null) hiHead = n; else hiTail.next = n;
                    hiTail = n;
                }
            }
            fresh[i] = loHead;
            fresh[i + oldCap] = hiHead;
        }
        table = fresh;
        threshold = (int) (newCap * LOAD_FACTOR);
    }
}
```

**What the real `HashMap` adds:** when one bucket reaches **8** nodes (and the table has ≥ 64 buckets) it converts the chain into a **red-black tree**, so a flood of colliding keys costs O(log n) instead of O(n); `tableSizeFor` rounds any requested capacity up to a power of two; and `modCount` makes its iterators fail-fast. Tip: `new HashMap<>(expected / 0.75f + 1)` (or `HashMap.newHashMap(expected)` on Java 19+) avoids every resize.

<!-- exercise: d12_e2 | Medium | Collisions, bucket indexes and the mutable-key bug -->
**Concepts:** how `hashCode` maps to a bucket · power-of-two masking · lo/hi split on resize · `String` hash collisions · why keys must be immutable · `null` handling across `HashMap` / `ConcurrentHashMap` / `TreeMap`

**Task.** Write a small "HashMap X-ray" program:

1. For `Integer` keys 1, 17, 33, 49, print their bucket index in a table of 16 and of 32 buckets, using the real formula. Explain why they collide at 16.
2. Show that `"Aa"` and `"BB"` have the same `hashCode`.
3. Put a **mutable** `Point` into a `HashMap`, change one of its fields, and show the entry can no longer be found — although the map still contains it.
4. Show which maps accept a `null` key.

**Starter code** · `HashMapXray.java`

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;

public class HashMapXray {
    static int spread(int h) { return h ^ (h >>> 16); }
    static int index(Object key, int capacity) { return 0; }   // TODO: spread(hashCode) & (capacity - 1)

    public static void main(String[] args) {
        List<Integer> keys = List.of(1, 17, 33, 49);
        // TODO 1: print "buckets at 16: [...]" and "buckets at 32: [...]"
        // TODO 1b: for each key print whether it stays (lo) or moves (+16) on resize: "split: [lo, hi, lo, hi]"
        // TODO 2: print "Aa vs BB hash: 2112 2112"
        // TODO 3: mutable key experiment (see expected output)
        // TODO 4: try a null key on HashMap, ConcurrentHashMap, TreeMap
    }
}

class Point {                       // deliberately mutable — DON'T do this for map keys
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) { return o instanceof Point p && p.x == x && p.y == y; }
    @Override public int hashCode() { return Objects.hash(x, y); }
}
```

**Expected output**

```text
buckets at 16: [1, 1, 1, 1]
buckets at 32: [1, 17, 1, 17]
split: [lo, hi, lo, hi]
Aa vs BB hash: 2112 2112
before mutation get: A
after mutation get(p): null
after mutation get(new Point(1, 2)): null
map still has size 1, containsValue(A): true
HashMap null key: ok
ConcurrentHashMap null key: NullPointerException
TreeMap null key: NullPointerException
```

<!-- hints -->
- `Integer.hashCode()` is the value itself, and small values have no high bits, so `spread` doesn't change them: index = value & 15. 1, 17, 33, 49 all end in binary `…0001`.
- With 32 buckets the mask has one more bit (`& 31`), and that bit — `value & 16` — decides lo or hi.
- After `p.x = 99`, `get(p)` looks in the bucket for hash(99, 2) — the entry is still in the bucket for hash(1, 2).
- `get(new Point(1, 2))` finds the right bucket, but `equals` compares against the stored (mutated) key, which is now (99, 2).
- `ConcurrentHashMap` bans `null` because `get` returning `null` would be ambiguous under concurrency (absent vs null value); `TreeMap` must call `compareTo` on the key.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;

public class HashMapXray {
    static int spread(int h) { return h ^ (h >>> 16); }
    static int index(Object key, int capacity) { return spread(key.hashCode()) & (capacity - 1); }

    public static void main(String[] args) {
        List<Integer> keys = List.of(1, 17, 33, 49);
        List<Integer> at16 = new ArrayList<>(), at32 = new ArrayList<>();
        List<String> split = new ArrayList<>();
        for (int k : keys) {
            at16.add(index(k, 16));
            at32.add(index(k, 32));
            split.add((spread(k) & 16) == 0 ? "lo" : "hi");          // the bit the bigger mask adds
        }
        System.out.println("buckets at 16: " + at16);
        System.out.println("buckets at 32: " + at32);
        System.out.println("split: " + split);

        System.out.println("Aa vs BB hash: " + "Aa".hashCode() + " " + "BB".hashCode());

        Map<Point, String> map = new HashMap<>();
        Point p = new Point(1, 2);
        map.put(p, "A");
        System.out.println("before mutation get: " + map.get(p));
        p.x = 99;                                                    // hashCode changes!
        System.out.println("after mutation get(p): " + map.get(p));  // looks in the wrong bucket
        System.out.println("after mutation get(new Point(1, 2)): " + map.get(new Point(1, 2)));   // right bucket, equals fails
        System.out.println("map still has size " + map.size() + ", containsValue(A): " + map.containsValue("A"));

        System.out.println("HashMap null key: " + tryNullKey(new HashMap<>()));
        System.out.println("ConcurrentHashMap null key: " + tryNullKey(new ConcurrentHashMap<>()));
        System.out.println("TreeMap null key: " + tryNullKey(new TreeMap<>()));
    }

    static String tryNullKey(Map<String, Integer> m) {
        try {
            m.put(null, 1);
            return "ok";
        } catch (NullPointerException e) {
            return e.getClass().getSimpleName();
        }
    }
}

class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) { return o instanceof Point p && p.x == x && p.y == y; }
    @Override public int hashCode() { return Objects.hash(x, y); }
}
```

**The lesson.** A key's `hashCode` is computed **once**, at `put`. Change the fields it depends on and the entry is stranded — a silent memory leak and a lookup bug. Use immutable keys (`String`, `Integer`, records with immutable fields). And `"Aa"`/`"BB"` show why `HashMap` must always confirm a match with `equals`.

<!-- exercise: d12_e3 | Medium | Choose the right map: `HashMap`, `LinkedHashMap`, `TreeMap` -->
**Concepts:** insertion order vs access order vs sorted order · `merge` for counting · `entrySet()` iteration (one lookup) vs `keySet()` + `get` (two) · `removeIf` on `entrySet` · `getOrDefault`

**Task.** Process a list of login events (user names) and produce:

1. Login counts in **first-seen** order → `LinkedHashMap` + `merge`.
2. The same counts **alphabetically** → `TreeMap` (copy constructor).
3. The most active user by iterating `entrySet()` once.
4. An access-ordered `LinkedHashMap` (`accessOrder = true`): after reading two keys, they move to the end.
5. Remove users with a single login using `entrySet().removeIf(...)` (no `ConcurrentModificationException`).
6. `getOrDefault` for an unknown user.

**Starter code** · `MapChooser.java`

```java
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class MapChooser {
    public static void main(String[] args) {
        List<String> logins = List.of("zoya", "asha", "ravi", "asha", "zoya", "asha", "kabir");

        Map<String, Integer> firstSeen = new LinkedHashMap<>();
        // TODO 1
        System.out.println("first-seen order: " + firstSeen);

        Map<String, Integer> sorted = Map.of();     // TODO 2
        System.out.println("alphabetical: " + sorted);

        String top = null; int max = 0;
        // TODO 3: one pass over firstSeen.entrySet()
        System.out.println("most active: " + top + " (" + max + ")");

        Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true);
        lru.putAll(firstSeen);
        // TODO 4: get("zoya") then get("ravi")
        System.out.println("access order after reads: " + lru.keySet());

        // TODO 5: remove single-login users from firstSeen
        System.out.println("repeat users: " + firstSeen);

        System.out.println("logins of 'neha': " + 0);   // TODO 6
    }
}
```

**Expected output**

```text
first-seen order: {zoya=2, asha=3, ravi=1, kabir=1}
alphabetical: {asha=3, kabir=1, ravi=1, zoya=2}
most active: asha (3)
access order after reads: [asha, kabir, zoya, ravi]
repeat users: {zoya=2, asha=3}
logins of 'neha': 0
```

<!-- hints -->
- `map.merge(user, 1, Integer::sum)` inserts 1 or adds 1 — no `containsKey` check needed.
- `new TreeMap<>(firstSeen)` re-sorts by key; `TreeMap` operations are O(log n) instead of O(1).
- Iterate `for (Map.Entry<String, Integer> e : map.entrySet())` to get key and value together; `keySet()` + `get(k)` does a second hash lookup per key.
- With `accessOrder = true`, every `get` moves that key to the **end** — the basis of an LRU cache (Day 13).
- `map.entrySet().removeIf(e -> e.getValue() == 1)` removes safely during iteration.

<!-- solution -->
```java
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class MapChooser {
    public static void main(String[] args) {
        List<String> logins = List.of("zoya", "asha", "ravi", "asha", "zoya", "asha", "kabir");

        Map<String, Integer> firstSeen = new LinkedHashMap<>();       // remembers insertion order
        for (String user : logins) firstSeen.merge(user, 1, Integer::sum);
        System.out.println("first-seen order: " + firstSeen);

        Map<String, Integer> sorted = new TreeMap<>(firstSeen);       // sorted by key
        System.out.println("alphabetical: " + sorted);

        String top = null; int max = 0;
        for (Map.Entry<String, Integer> e : firstSeen.entrySet()) {   // key + value, one lookup
            if (e.getValue() > max) { max = e.getValue(); top = e.getKey(); }
        }
        System.out.println("most active: " + top + " (" + max + ")");

        Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true);   // access order
        lru.putAll(firstSeen);
        lru.get("zoya");                                              // moves zoya to the end
        lru.get("ravi");                                              // then ravi
        System.out.println("access order after reads: " + lru.keySet());

        firstSeen.entrySet().removeIf(e -> e.getValue() == 1);        // safe removal while iterating
        System.out.println("repeat users: " + firstSeen);

        System.out.println("logins of 'neha': " + firstSeen.getOrDefault("neha", 0));
    }
}
```

**Picking a map in one line each.** `HashMap` — default, O(1), no order. `LinkedHashMap` — predictable iteration order (insertion or access) for a little extra memory; LRU caches. `TreeMap` — sorted keys and range queries (`floorKey`, `headMap`) at O(log n). `EnumMap` — enum keys, array-backed. `ConcurrentHashMap` — shared between threads.
