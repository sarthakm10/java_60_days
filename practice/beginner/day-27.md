Warm up with the most common map job of all, counting, before choosing between map types in the second exercise.

<!-- exercise: b27_e1 | Easy | Word counts and first repeated word -->
**Concepts:** `HashMap` · `getOrDefault` and `merge` · `TreeMap` for sorted output · `entrySet` loops

**Task.** For the sentence below (lower-cased, punctuation removed, split on spaces):

1. count how often each word appears, and print the counts **alphabetically**;
2. print the most frequent word and its count;
3. print the **first word that appears a second time** while reading left to right.

**Starter code** · `WordCounts.java`

```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

public class WordCounts {
    public static void main(String[] args) {
        String text = "The cat and the dog and THE bird. A dog!";
        String[] words = text.toLowerCase().replaceAll("[^a-z ]", "").split(" ");

        Map<String, Integer> counts = new HashMap<>();
        // TODO: count each word

        // TODO: print counts alphabetically (hint: a TreeMap built from counts)
        // TODO: most frequent word
        // TODO: first repeated word (use a Set of words seen so far)
    }
}
```

**Expected output**

```text
a=1
and=2
bird=1
cat=1
dog=2
the=3
Most frequent: the (3)
First repeat: the
```

<!-- hints -->
- Counting, the long way: `counts.put(w, counts.getOrDefault(w, 0) + 1);` The short way: `counts.merge(w, 1, Integer::sum);`
- `new TreeMap<>(counts)` copies the map with its keys sorted; loop over its `entrySet()` and print `getKey() + "=" + getValue()`.
- Most frequent: loop over the entries, keeping the best key and count so far (the same "running max" as Day 7).
- First repeat: `Set<String> seen = new HashSet<>();` and `if (!seen.add(w))`: `add` returns `false` when the word was already there.

<!-- solution -->
```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

public class WordCounts {
    public static void main(String[] args) {
        String text = "The cat and the dog and THE bird. A dog!";
        String[] words = text.toLowerCase().replaceAll("[^a-z ]", "").split(" ");

        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) {
            counts.merge(w, 1, Integer::sum);
        }

        for (Map.Entry<String, Integer> e : new TreeMap<>(counts).entrySet()) {
            System.out.println(e.getKey() + "=" + e.getValue());
        }

        String best = null;
        int bestCount = 0;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (e.getValue() > bestCount) {
                best = e.getKey();
                bestCount = e.getValue();
            }
        }
        System.out.println("Most frequent: " + best + " (" + bestCount + ")");

        Set<String> seen = new HashSet<>();
        for (String w : words) {
            if (!seen.add(w)) {
                System.out.println("First repeat: " + w);
                break;
            }
        }
    }
}
```

`replaceAll("[^a-z ]", "")` removes everything that isn't a lowercase letter or a space (a *regular expression*; you'll meet more of them later). The HashMap's own loop order isn't predictable, which is why the alphabetical listing copies it into a `TreeMap` first.
