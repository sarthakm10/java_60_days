# Day 28 — HashMap: How It Works Inside

> The most asked collection topic in Java interviews. Take it slowly; the 🌱 boxes give you the picture, the sections give you the details.

**Today's goal:** understand buckets, hashing and collisions well enough to explain why `HashMap` is fast, when it slows down, and what breaks it.

<!-- topic: b28_t1 -->
## ☕ Collections — HashMap Internals

<!-- intro: d12_t1_s1 -->
Inside, a `HashMap` is an **array of buckets**. To store a key, it calls the key's `hashCode()` (a number), turns that number into a bucket index, and puts the entry in that bucket. To find the key later, it computes the same index and looks only in that one bucket, instead of searching everything. That's why `get` and `put` are O(1) on average: it's like a cloakroom where your ticket number tells the attendant exactly which hook to go to.

<!-- intro: d12_t1_s2 -->
Different keys can land in the **same bucket**; that's a **collision**. The bucket then holds a small list of entries, and the map checks them one by one with `equals()`. A few collisions are normal and cheap. If one bucket grows very long, Java 8+ turns it into a balanced tree, so even the worst bucket is O(log n) instead of O(n).

<!-- intro: d12_t1_s4 -->
As you add entries, buckets would get crowded. So when the map is 75% full (the **load factor**, 0.75), it doubles the number of buckets and moves every entry to its new place (**rehashing**). Like `ArrayList`'s growth (Day 25), it's occasionally slow but cheap on average. If you know you'll store a million entries, creating the map with that capacity up front avoids repeated rehashing.

<!-- intro: d12_t1_s5 -->
"HashMap is O(1)" is true **on average**, with a decent `hashCode`. The worst case, when every key collides into one bucket, used to be O(n) per lookup (Java 7) and is O(log n) since Java 8 thanks to those tree buckets.

<!-- intro: d12_t1_s6 -->
`HashMap` allows **one `null` key** and any number of `null` values; `ConcurrentHashMap` (Day 41) allows neither, and `TreeMap` can't sort a `null` key. Practical advice: avoid nulls in maps altogether, because `get` returning `null` then can't tell "missing" from "stored null".

<!-- intro: d12_t1_s7 -->
Never change a key after putting it in a map. If you use an object as a key and then change a field that its `hashCode` depends on, the map looks in the **wrong bucket** from then on, and the entry becomes impossible to find (but still takes up space). This is one more reason immutable objects (Day 20), like `String` and records, make the best keys.

<!-- topic: b28_t2 -->
## 🧮 DSA — Strings & HashMap Patterns

Strings plus maps: the classic patterns are **frequency counting** (Ransom Note: count the letters you have, then spend them) and **grouping by a key** (Group Anagrams: sort each word's letters, and words with the same sorted form go in the same group, built with `computeIfAbsent` from Day 27). Isomorphic Strings and Word Pattern keep a **two-way mapping** between characters or words. For lowercase letters, an `int[26]` counter (Day 8) often replaces the map entirely.

## 📝 Day 28 Recap

1. What is inside a HashMap? → **an array of buckets**
2. How does it pick a key's bucket? → **from the key's hashCode(), turned into an index**
3. What is a collision? → **two different keys landing in the same bucket**
4. How are colliding keys told apart? → **with equals()**
5. What happens to a very long bucket in Java 8+? → **it becomes a balanced tree (O(log n))**
6. What is the default load factor? → **0.75**
7. What happens when the map passes the load factor? → **buckets double and entries are rehashed**
8. Average cost of get/put? → **O(1)**
9. How many null keys does HashMap allow? → **one**
10. Why must you not change a key after putting it in a map? → **its hashCode changes, so the map looks in the wrong bucket and can't find it**
