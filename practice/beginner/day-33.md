The Phase 3 mini project, then two tree exercises that build on Day 31.

<!-- exercise: b33_e1 | Medium | Grade book -->
**Concepts:** `Map<String, List<Integer>>` · `computeIfAbsent` · averages without integer division · sorting with a comparator · `TreeMap` counts

**Task.** Complete the `GradeBook`:

- `addMark(name, mark)` stores a mark, creating the student's list the first time;
- `average(name)` returns the student's average as a `double`;
- `topper()` returns the name with the highest average;
- `report()` prints every student with their average (1 decimal), **highest average first**;
- `gradeCounts()` returns how many students got each grade by average (A ≥ 80, B ≥ 60, C below), in grade order.

**Starter code** · `GradeBookApp.java`

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

class GradeBook {
    private final Map<String, List<Integer>> marks = new LinkedHashMap<>();

    void addMark(String name, int mark) {
        // TODO: computeIfAbsent
    }

    double average(String name) {
        return 0; // TODO
    }

    String topper() {
        return null; // TODO
    }

    void report() {
        // TODO: names sorted by average, highest first; "Asha 85.0"
    }

    Map<String, Integer> gradeCounts() {
        return new TreeMap<>(); // TODO
    }
}

public class GradeBookApp {
    public static void main(String[] args) {
        GradeBook book = new GradeBook();
        book.addMark("Asha", 90);
        book.addMark("Ravi", 55);
        book.addMark("Asha", 80);
        book.addMark("Meera", 72);
        book.addMark("Ravi", 61);
        book.addMark("Meera", 68);
        book.addMark("Kabir", 95);

        System.out.printf("Ravi average: %.1f%n", book.average("Ravi"));
        System.out.println("Topper: " + book.topper());
        book.report();
        System.out.println(book.gradeCounts());
    }
}
```

**Expected output**

```text
Ravi average: 58.0
Topper: Kabir
Kabir 95.0
Asha 85.0
Meera 70.0
Ravi 58.0
{A=2, B=1, C=1}
```

<!-- hints -->
- `marks.computeIfAbsent(name, k -> new ArrayList<>()).add(mark);` creates the list on first use and adds to it.
- Average: sum the list in a loop, then `(double) sum / list.size()`.
- Sorting names by average, highest first: `List<String> names = new ArrayList<>(marks.keySet());` then `names.sort((a, b) -> Double.compare(average(b), average(a)));` (b before a reverses the order).
- Grades: decide the letter for each student's average, then `counts.merge(letter, 1, Integer::sum)` into a `TreeMap`, which prints its keys in order.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

class GradeBook {
    private final Map<String, List<Integer>> marks = new LinkedHashMap<>();

    void addMark(String name, int mark) {
        marks.computeIfAbsent(name, k -> new ArrayList<>()).add(mark);
    }

    double average(String name) {
        List<Integer> list = marks.get(name);
        int sum = 0;
        for (int m : list) {
            sum += m;
        }
        return (double) sum / list.size();
    }

    String topper() {
        String best = null;
        for (String name : marks.keySet()) {
            if (best == null || average(name) > average(best)) {
                best = name;
            }
        }
        return best;
    }

    void report() {
        List<String> names = new ArrayList<>(marks.keySet());
        names.sort((a, b) -> Double.compare(average(b), average(a)));
        for (String name : names) {
            System.out.printf("%s %.1f%n", name, average(name));
        }
    }

    Map<String, Integer> gradeCounts() {
        Map<String, Integer> counts = new TreeMap<>();
        for (String name : marks.keySet()) {
            double avg = average(name);
            String grade = avg >= 80 ? "A" : avg >= 60 ? "B" : "C";
            counts.merge(grade, 1, Integer::sum);
        }
        return counts;
    }
}

public class GradeBookApp {
    public static void main(String[] args) {
        GradeBook book = new GradeBook();
        book.addMark("Asha", 90);
        book.addMark("Ravi", 55);
        book.addMark("Asha", 80);
        book.addMark("Meera", 72);
        book.addMark("Ravi", 61);
        book.addMark("Meera", 68);
        book.addMark("Kabir", 95);

        System.out.printf("Ravi average: %.1f%n", book.average("Ravi"));
        System.out.println("Topper: " + book.topper());
        book.report();
        System.out.println(book.gradeCounts());
    }
}
```

Each collection does the job it's best at: a `LinkedHashMap` for lookups by name in a predictable order, `ArrayList`s for each student's marks, a comparator for the custom sort, and a `TreeMap` so the grade counts print in order. `Double.compare(average(b), average(a))` sorts descending; swapping `a` and `b` would sort ascending.
