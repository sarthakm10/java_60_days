Start with the warm-up to get comfortable with `ArrayList`, then build your own version of it in the second exercise.

<!-- exercise: b25_e1 | Easy | A to-do list with ArrayList -->
**Concepts:** `List` and `ArrayList` · `add`, `get`, `set`, `remove`, `size`, `contains`, `indexOf` · looping with an index

**Task.** Complete the `TodoList` methods using an `ArrayList<String>` inside. `complete(i)` marks item `i` done by putting `"[x] "` in front of it (only once), `removeDone()` deletes every completed item, and `print()` numbers the items from 1.

**Starter code** · `TodoApp.java`

```java
import java.util.ArrayList;
import java.util.List;

class TodoList {
    private final List<String> items = new ArrayList<>();

    void add(String task) { /* TODO */ }

    void complete(int index) {
        // TODO: add "[x] " in front, unless it's already there
    }

    void removeDone() {
        // TODO: remove every item that starts with "[x] "
    }

    boolean has(String task) {
        return false; // TODO
    }

    int size() { return 0; } // TODO

    void print() {
        // TODO: "1. buy milk" ...
    }
}

public class TodoApp {
    public static void main(String[] args) {
        TodoList todo = new TodoList();
        todo.add("buy milk");
        todo.add("pay rent");
        todo.add("call mom");
        todo.complete(0);
        todo.complete(0);
        todo.complete(2);
        todo.print();
        System.out.println("size " + todo.size() + ", has pay rent? " + todo.has("pay rent"));
        todo.removeDone();
        todo.print();
        System.out.println("size " + todo.size());
    }
}
```

**Expected output**

```text
1. [x] buy milk
2. pay rent
3. [x] call mom
size 3, has pay rent? true
1. pay rent
size 1
```

<!-- hints -->
- `items.get(index)` reads an item and `items.set(index, newText)` replaces it.
- Check `startsWith("[x] ")` before adding the tick, so completing twice doesn't add two ticks.
- For `removeDone`, the simplest correct way is `items.removeIf(item -> item.startsWith("[x] "));`. Removing inside a for-each loop over the same list would crash (Day 26). Looping backwards with an index also works.
- `print`: `for (int i = 0; i < items.size(); i++) System.out.println((i + 1) + ". " + items.get(i));`

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

class TodoList {
    private final List<String> items = new ArrayList<>();

    void add(String task) {
        items.add(task);
    }

    void complete(int index) {
        String item = items.get(index);
        if (!item.startsWith("[x] ")) {
            items.set(index, "[x] " + item);
        }
    }

    void removeDone() {
        for (int i = items.size() - 1; i >= 0; i--) {   // backwards, so removing doesn't skip items
            if (items.get(i).startsWith("[x] ")) {
                items.remove(i);
            }
        }
    }

    boolean has(String task) {
        return items.contains(task);
    }

    int size() {
        return items.size();
    }

    void print() {
        for (int i = 0; i < items.size(); i++) {
            System.out.println((i + 1) + ". " + items.get(i));
        }
    }
}

public class TodoApp {
    public static void main(String[] args) {
        TodoList todo = new TodoList();
        todo.add("buy milk");
        todo.add("pay rent");
        todo.add("call mom");
        todo.complete(0);
        todo.complete(0);
        todo.complete(2);
        todo.print();
        System.out.println("size " + todo.size() + ", has pay rent? " + todo.has("pay rent"));
        todo.removeDone();
        todo.print();
        System.out.println("size " + todo.size());
    }
}
```

Looping **backwards** while removing by index is a classic trick: removing item `i` shifts only the items after it, which you've already checked. Going forwards, you'd skip the item that slides into position `i`. (`removeIf` does it for you.)
