# Day 27 — HashMap: Using It Well

> HashMap is probably the single most useful class in Java, and in coding interviews. Today is about **using** it; tomorrow you'll see how it works inside.

**Today's goal:** store and look up values by key, loop over a map, and use the handy methods that turn counting and grouping into one-liners.

<!-- topic: b27_t1 -->
## ☕ Collections — Using HashMap

<!-- intro: d5_t2_s1 -->
A **map** stores **key → value** pairs, like a dictionary (word → meaning) or a phone book (name → number). You look things up by key, instantly, no matter how many entries there are:

```java
Map<String, Integer> stock = new HashMap<>();   // import java.util.HashMap and java.util.Map
stock.put("apple", 50);                // add (or replace) a key's value
stock.put("banana", 20);
stock.put("apple", 45);                // same key again: replaces 50 with 45

System.out.println(stock.get("apple"));        // 45
System.out.println(stock.get("mango"));        // null: not in the map
System.out.println(stock.getOrDefault("mango", 0));   // 0: safer than get
System.out.println(stock.containsKey("banana"));      // true
stock.remove("banana");
System.out.println(stock.size());              // 1
```

Keys are **unique** (putting the same key replaces the value); values can repeat. A `HashMap` doesn't keep any particular order. The section below shows these basics with interview-style problems.

<!-- intro: d12_t1_s9 -->
To loop over a map, go through its **entries** (key and value together):

```java
for (Map.Entry<String, Integer> e : stock.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}
```

`keySet()` gives just the keys and `values()` just the values. Looping over `keySet()` and calling `get(key)` each time works, but does two lookups per key; `entrySet()` is the clean way.

<!-- intro: d12_t1_s3 -->
A `HashMap` finds keys using two methods every object has (Day 19): `hashCode()` to jump to the right spot quickly, and `equals()` to confirm the match. For `String` and `Integer` keys this just works. If you use **your own class** as a key, you must override **both** `equals` and `hashCode` consistently, or the map won't find keys that look equal. Records (Day 20) do this for you.

<!-- intro: d12_t1_s8 -->
Three maps, three orders: `HashMap` has no order (fastest), `LinkedHashMap` remembers **insertion order**, and `TreeMap` keeps keys **sorted** (a bit slower, O(log n)). Pick by asking "do I care about the order when I loop over it?"

<!-- intro: d13_t1_s3 -->
`getOrDefault(key, fallback)` avoids `null` checks, `putIfAbsent(key, value)` only adds a missing key, and `computeIfAbsent(key, k -> new ArrayList<>())` creates a value the first time a key is seen and returns it. That last one makes grouping easy: `groups.computeIfAbsent(city, k -> new ArrayList<>()).add(name);` (lambdas `->` are Day 34; copy the pattern for now).

<!-- intro: d13_t1_s4 -->
**Counting** is the most common map job (word counts, letter frequencies, votes). The long way: get the old count (or 0), add 1, put it back. The one-liner: `counts.merge(word, 1, Integer::sum);`, which means "put 1 if the word is new, otherwise add 1 to what's there". You'll see `merge` and `compute` in solutions everywhere.

<!-- topic: b27_t2 -->
## 🧮 DSA — Arrays: Two Sum & Easy Patterns

**Hashing in simple words:** the trick behind most of these problems is to **remember what you've already seen** in a `HashSet` or `HashMap`, so you can answer "have I seen the number that pairs with this one?" instantly instead of searching again. Two Sum is the classic: the obvious solution checks every pair (O(n²)); with a map from value → index, one pass is enough (O(n)). That's Day 11's "trade space for time" in action.

## 📝 Day 27 Recap

1. What does a Map store? → **key → value pairs**
2. put with an existing key? → **replaces that key's value**
3. get for a missing key returns? → **null**
4. Lookup with a fallback value? → **map.getOrDefault(key, fallback)**
5. Loop over keys and values together? → **for (Map.Entry<K, V> e : map.entrySet())**
6. Your own class as a key needs? → **equals() and hashCode() overridden consistently**
7. HashMap vs LinkedHashMap vs TreeMap order? → **none / insertion order / sorted by key**
8. Count words in one line? → **counts.merge(word, 1, Integer::sum)**
9. Group values by key? → **map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)**
10. Why is Two Sum with a HashMap O(n)? → **each number is checked against remembered values in O(1)**
