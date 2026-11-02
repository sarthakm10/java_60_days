The fastest way to *really* understand `ArrayList` and `LinkedList` is to build them. Today you'll write both from scratch, then run a "predict the output" lab on the list traps interviewers love.

<!-- exercise: d11_e1 | Medium | Build your own `ArrayList` -->
**Concepts:** backing `Object[]` · lazy allocation (capacity 10 on first add) · growth by 1.5× (`old + (old >> 1)`) · `System.arraycopy` for shifting · fail-fast iterator with `modCount` · `Objects.checkIndex`

**Task.** Implement `MyArrayList<E> implements Iterable<E>` with `add(e)`, `add(index, e)`, `get`, `remove(index)`, `size()`, `capacity()` and a **fail-fast** iterator. It must reproduce the JDK's growth sequence and throw `ConcurrentModificationException` if the list is changed during iteration.

**Starter code** · `MyArrayListDemo.java`

```java
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

public class MyArrayListDemo {
    public static void main(String[] args) {
        MyArrayList<Integer> list = new MyArrayList<>();
        System.out.println("capacity before first add: " + list.capacity());

        List<Integer> steps = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            list.add(i);
            if (steps.isEmpty() || steps.get(steps.size() - 1) != list.capacity()) steps.add(list.capacity());
        }
        System.out.println("capacity steps: " + steps);

        list.add(0, 0);
        System.out.println("after add(0, 0): size=" + list.size() + " first=" + list.get(0) + " last=" + list.get(list.size() - 1));
        System.out.println("remove(50) returned " + list.remove(50) + ", size=" + list.size());

        int sum = 0;
        for (int x : list) sum += x;
        System.out.println("sum via for-each: " + sum);

        try {
            for (int x : list) if (x == 3) list.add(99);
        } catch (ConcurrentModificationException e) {
            System.out.println("modifying while iterating: " + e.getClass().getSimpleName());
        }

        try {
            list.get(99);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("get(99): " + e.getMessage());
        }
    }
}

class MyArrayList<E> implements Iterable<E> {
    private static final Object[] EMPTY = {};
    private Object[] data = EMPTY;      // allocated lazily, like the JDK
    private int size;
    private int modCount;               // bumped on every structural change

    void add(E e) { /* TODO */ }
    void add(int index, E e) { /* TODO */ }
    E get(int index) { return null; }   // TODO
    E remove(int index) { return null; } // TODO
    int size() { return size; }
    int capacity() { return data.length; }

    public Iterator<E> iterator() {
        return new Iterator<>() {        // TODO: fail-fast iterator
            public boolean hasNext() { return false; }
            public E next() { throw new NoSuchElementException(); }
        };
    }
}
```

**Expected output**

```text
capacity before first add: 0
capacity steps: [10, 15, 22, 33, 49, 73]
after add(0, 0): size=51 first=0 last=50
remove(50) returned 50, size=50
sum via for-each: 1225
modifying while iterating: ConcurrentModificationException
get(99): Index 99 out of bounds for length 51
```

<!-- hints -->
- Grow in a helper: `if (size == data.length) data = Arrays.copyOf(data, data.length == 0 ? 10 : data.length + (data.length >> 1));`
- Insert at `index`: `System.arraycopy(data, index, data, index + 1, size - index)` shifts the tail right by one — that's why it's O(n).
- Remove: shift left with `arraycopy`, then set `data[--size] = null` so the removed object can be garbage-collected.
- The iterator remembers `expectedModCount = modCount` when created and checks it in `next()`.
- `Objects.checkIndex(index, size)` throws `IndexOutOfBoundsException` with exactly the JDK's message.
- Look at the size in the last line: `add(99)` really happened — fail-fast iterators only notice the change on the **next** `next()` call.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

public class MyArrayListDemo {
    public static void main(String[] args) {
        MyArrayList<Integer> list = new MyArrayList<>();
        System.out.println("capacity before first add: " + list.capacity());

        List<Integer> steps = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            list.add(i);
            if (steps.isEmpty() || steps.get(steps.size() - 1) != list.capacity()) steps.add(list.capacity());
        }
        System.out.println("capacity steps: " + steps);

        list.add(0, 0);
        System.out.println("after add(0, 0): size=" + list.size() + " first=" + list.get(0) + " last=" + list.get(list.size() - 1));
        System.out.println("remove(50) returned " + list.remove(50) + ", size=" + list.size());

        int sum = 0;
        for (int x : list) sum += x;
        System.out.println("sum via for-each: " + sum);

        try {
            for (int x : list) if (x == 3) list.add(99);
        } catch (ConcurrentModificationException e) {
            System.out.println("modifying while iterating: " + e.getClass().getSimpleName());
        }

        try {
            list.get(99);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("get(99): " + e.getMessage());
        }
    }
}

class MyArrayList<E> implements Iterable<E> {
    private static final Object[] EMPTY = {};
    private Object[] data = EMPTY;
    private int size;
    private int modCount;

    void add(E e) {
        ensureRoom();
        data[size++] = e;                                       // amortised O(1)
        modCount++;
    }

    void add(int index, E e) {
        Objects.checkIndex(index, size + 1);                    // index == size means "append"
        ensureRoom();
        System.arraycopy(data, index, data, index + 1, size - index);   // shift right: O(n)
        data[index] = e;
        size++;
        modCount++;
    }

    @SuppressWarnings("unchecked")
    E get(int index) {
        Objects.checkIndex(index, size);
        return (E) data[index];                                 // O(1) random access
    }

    E remove(int index) {
        E old = get(index);
        System.arraycopy(data, index + 1, data, index, size - index - 1);   // shift left: O(n)
        data[--size] = null;                                    // let GC reclaim the object
        modCount++;
        return old;
    }

    int size() { return size; }
    int capacity() { return data.length; }

    private void ensureRoom() {
        if (size == data.length) {
            int newCapacity = data.length == 0 ? 10 : data.length + (data.length >> 1);   // 1.5x
            data = Arrays.copyOf(data, newCapacity);
        }
    }

    public Iterator<E> iterator() {
        return new Iterator<>() {
            private int cursor;
            private final int expectedModCount = modCount;     // snapshot at creation

            public boolean hasNext() { return cursor < size; }

            public E next() {
                if (modCount != expectedModCount) throw new ConcurrentModificationException();
                if (cursor >= size) throw new NoSuchElementException();
                return get(cursor++);
            }
        };
    }
}
```

**Takeaways.** Appending is amortised O(1) because each resize copies the array but happens rarely (1.5× growth). Inserting or removing in the middle is O(n) because of the shifts. If you know the final size, `new ArrayList<>(n)` or `ensureCapacity(n)` avoids every intermediate copy.

<!-- exercise: d11_e2 | Medium | Build a doubly linked list that is also a deque -->
**Concepts:** doubly linked nodes · sentinel head/tail · O(1) `addFirst`/`addLast`/`removeFirst`/`removeLast` · O(n) `get(index)` (walk from the nearer end) · in-place reversal · using one structure as stack **and** queue

**Task.** Implement `MyDeque<E>` backed by a doubly linked list with **sentinel** nodes, so there are no `null` checks for empty-list edge cases. Support `addFirst`, `addLast`, `removeFirst`, `removeLast`, `peekFirst`, `get(index)`, `reverse()`, `size()` and `toString()`. `get` should start from the **tail** when the index is in the second half (the JDK's `LinkedList` does this too).

**Starter code** · `MyDequeDemo.java`

```java
import java.util.NoSuchElementException;

public class MyDequeDemo {
    public static void main(String[] args) {
        MyDeque<String> d = new MyDeque<>();
        d.addLast("b");
        d.addLast("c");
        d.addFirst("a");
        d.addLast("d");
        d.addLast("e");
        System.out.println("deque: " + d + " size=" + d.size());
        System.out.println("get(3): " + d.get(3) + " (steps walked: " + d.lastWalkSteps() + ")");
        System.out.println("removeFirst: " + d.removeFirst() + ", removeLast: " + d.removeLast() + " -> " + d);
        d.reverse();
        System.out.println("reversed: " + d);

        MyDeque<Integer> stack = new MyDeque<>();      // stack = push/pop at the same end
        for (int i = 1; i <= 3; i++) stack.addFirst(i);
        System.out.println("stack pops: " + stack.removeFirst() + " " + stack.removeFirst() + " " + stack.removeFirst());

        MyDeque<Integer> queue = new MyDeque<>();      // queue = add at one end, remove at the other
        for (int i = 1; i <= 3; i++) queue.addLast(i);
        System.out.println("queue polls: " + queue.removeFirst() + " " + queue.removeFirst() + " " + queue.removeFirst());

        try {
            queue.removeFirst();
        } catch (NoSuchElementException e) {
            System.out.println("removeFirst on empty: " + e.getClass().getSimpleName());
        }
        System.out.println("peekFirst on empty: " + queue.peekFirst());
    }
}

class MyDeque<E> {
    private static final class Node<E> {
        E value;
        Node<E> prev, next;
        Node(E value) { this.value = value; }
    }

    // TODO: sentinel head and tail nodes, linked to each other; a size counter
    private int lastWalkSteps;

    void addFirst(E e) { }            // TODO
    void addLast(E e) { }             // TODO
    E removeFirst() { return null; }  // TODO: NoSuchElementException when empty
    E removeLast() { return null; }   // TODO
    E peekFirst() { return null; }    // TODO: null when empty
    E get(int index) { return null; } // TODO: walk from the nearer end, count steps in lastWalkSteps
    void reverse() { }                // TODO: swap prev/next of every node, then swap head/tail roles
    int size() { return 0; }          // TODO
    int lastWalkSteps() { return lastWalkSteps; }

    @Override
    public String toString() { return "[]"; }   // TODO
}
```

**Expected output**

```text
deque: [a, b, c, d, e] size=5
get(3): d (steps walked: 2)
removeFirst: a, removeLast: e -> [b, c, d]
reversed: [d, c, b]
stack pops: 3 2 1
queue polls: 1 2 3
removeFirst on empty: NoSuchElementException
peekFirst on empty: null
```

<!-- hints -->
- Sentinels: `head.next = tail; tail.prev = head;`. Every real node sits between them, so insert/remove never special-cases "first" or "empty".
- A private `linkBetween(Node a, Node b, E e)` and `unlink(Node n)` make every public method two lines.
- `get(3)` on 5 elements: index ≥ size / 2, so walk **backwards** from `tail.prev` (index 4) — one `.prev` hop reaches index 3. The demo also counts the first hop off the sentinel, so it reports 2.
- Reversal: walk from the head sentinel to the tail sentinel and swap each node's `prev` and `next` (including the sentinels), then swap the `head` and `tail` references.

<!-- solution -->
```java
import java.util.NoSuchElementException;
import java.util.StringJoiner;

public class MyDequeDemo {
    public static void main(String[] args) {
        MyDeque<String> d = new MyDeque<>();
        d.addLast("b");
        d.addLast("c");
        d.addFirst("a");
        d.addLast("d");
        d.addLast("e");
        System.out.println("deque: " + d + " size=" + d.size());
        System.out.println("get(3): " + d.get(3) + " (steps walked: " + d.lastWalkSteps() + ")");
        System.out.println("removeFirst: " + d.removeFirst() + ", removeLast: " + d.removeLast() + " -> " + d);
        d.reverse();
        System.out.println("reversed: " + d);

        MyDeque<Integer> stack = new MyDeque<>();
        for (int i = 1; i <= 3; i++) stack.addFirst(i);
        System.out.println("stack pops: " + stack.removeFirst() + " " + stack.removeFirst() + " " + stack.removeFirst());

        MyDeque<Integer> queue = new MyDeque<>();
        for (int i = 1; i <= 3; i++) queue.addLast(i);
        System.out.println("queue polls: " + queue.removeFirst() + " " + queue.removeFirst() + " " + queue.removeFirst());

        try {
            queue.removeFirst();
        } catch (NoSuchElementException e) {
            System.out.println("removeFirst on empty: " + e.getClass().getSimpleName());
        }
        System.out.println("peekFirst on empty: " + queue.peekFirst());
    }
}

class MyDeque<E> {
    private static final class Node<E> {
        E value;
        Node<E> prev, next;
        Node(E value) { this.value = value; }
    }

    private Node<E> head = new Node<>(null), tail = new Node<>(null);   // sentinels
    private int size;
    private int lastWalkSteps;

    MyDeque() {
        head.next = tail;
        tail.prev = head;
    }

    void addFirst(E e) { linkBetween(head, head.next, e); }      // O(1)
    void addLast(E e) { linkBetween(tail.prev, tail, e); }       // O(1)

    E removeFirst() {
        if (size == 0) throw new NoSuchElementException();
        return unlink(head.next);
    }

    E removeLast() {
        if (size == 0) throw new NoSuchElementException();
        return unlink(tail.prev);
    }

    E peekFirst() { return size == 0 ? null : head.next.value; }

    E get(int index) {                                           // O(n): walk from the nearer end
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException(index);
        Node<E> cur;
        int steps = 0;
        if (index < size / 2) {
            cur = head.next;
            for (int i = 0; i < index; i++) { cur = cur.next; steps++; }
        } else {
            cur = tail.prev;
            for (int i = size - 1; i > index; i--) { cur = cur.prev; steps++; }
        }
        lastWalkSteps = steps + 1;                               // +1 for the first hop off the sentinel
        return cur.value;
    }

    void reverse() {
        Node<E> cur = head;
        while (cur != null) {                                    // swap links on every node incl. sentinels
            Node<E> next = cur.next;
            cur.next = cur.prev;
            cur.prev = next;
            cur = next;
        }
        Node<E> oldHead = head;
        head = tail;
        tail = oldHead;
    }

    int size() { return size; }
    int lastWalkSteps() { return lastWalkSteps; }

    private void linkBetween(Node<E> a, Node<E> b, E e) {
        Node<E> n = new Node<>(e);
        n.prev = a;
        n.next = b;
        a.next = n;
        b.prev = n;
        size++;
    }

    private E unlink(Node<E> n) {
        n.prev.next = n.next;
        n.next.prev = n.prev;
        n.prev = n.next = null;                                  // help GC
        size--;
        return n.value;
    }

    @Override
    public String toString() {
        StringJoiner sj = new StringJoiner(", ", "[", "]");
        for (Node<E> cur = head.next; cur != tail; cur = cur.next) sj.add(String.valueOf(cur.value));
        return sj.toString();
    }
}
```

**ArrayList vs LinkedList in practice.** Each `LinkedList` node costs ~24–32 extra bytes for headers and two pointers, and nodes are scattered in memory, so iteration has poor cache locality. Even "insert in the middle" is O(n) because you must *walk* there first. Use `ArrayList` for lists and `ArrayDeque` for stacks/queues; `LinkedList` is rarely the right answer.

<!-- exercise: d11_e3 | Easy | Predict the output: list traps -->
**Concepts:** `Arrays.asList` (fixed-size, array-backed) · `List.of` (immutable, no nulls) · `subList` is a view · `remove(int)` vs `remove(Object)` · `ConcurrentModificationException` · `removeIf` · `CopyOnWriteArrayList` snapshot iteration

**Task.** Copy this program into your IDE. **Before running it**, write the output you expect next to each `println`. Then run it and explain every difference — each line is a real bug someone has shipped.

**Starter code** · `ListTraps.java`

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ListTraps {
    public static void main(String[] args) {
        List<String> fixed = Arrays.asList("a", "b", "c");
        fixed.set(0, "z");
        System.out.println("1. " + fixed);
        System.out.println("2. " + attempt(() -> fixed.add("d")));

        String[] arr = {"x", "y"};
        List<String> view = Arrays.asList(arr);
        arr[0] = "CHANGED";
        System.out.println("3. " + view);

        List<String> immutable = List.of("a", "b");
        System.out.println("4. " + attempt(() -> immutable.set(0, "z")));
        System.out.println("5. " + attempt(() -> List.of("a", null)));

        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        List<Integer> sub = nums.subList(1, 4);
        sub.set(0, 20);
        System.out.println("6. " + nums);
        sub.clear();
        System.out.println("7. " + nums);
        nums.add(7);
        System.out.println("8. " + attempt(sub::size));

        List<Integer> ids = new ArrayList<>(List.of(10, 20, 30));
        ids.remove(1);
        System.out.println("9. " + ids);
        ids.remove(Integer.valueOf(10));
        System.out.println("10. " + ids);

        List<Integer> evens = new ArrayList<>(List.of(1, 2, 3, 4));
        System.out.println("11. " + attempt(() -> { for (Integer n : evens) if (n % 2 == 0) evens.remove(n); }));
        List<Integer> evens2 = new ArrayList<>(List.of(1, 2, 3, 4));
        evens2.removeIf(n -> n % 2 == 0);
        System.out.println("12. " + evens2);

        List<String> cow = new CopyOnWriteArrayList<>(List.of("p", "q", "r"));
        int seen = 0;
        for (String s : cow) { cow.add(s + "!"); seen++; }
        System.out.println("13. iterated " + seen + ", size now " + cow.size());
    }

    static String attempt(Runnable action) {
        try {
            action.run();
            return "ok";
        } catch (RuntimeException e) {
            return e.getClass().getSimpleName();
        }
    }
}
```

<!-- hints -->
- `Arrays.asList` returns a fixed-size list **backed by the array**: `set` works and writes through, `add`/`remove` throw.
- `List.of(...)` is fully immutable and rejects `null` elements immediately.
- `subList` returns a **view** of a range — changes go both ways. After a *structural* change to the parent (like `add`), any use of the old view throws.
- `List<Integer>.remove(1)` picks `remove(int index)`, not `remove(Object)` — box explicitly to remove by value.
- `CopyOnWriteArrayList` iterators walk a **snapshot** taken when the loop started.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ListTraps {
    public static void main(String[] args) {
        List<String> fixed = Arrays.asList("a", "b", "c");
        fixed.set(0, "z");                                            // allowed: size doesn't change
        System.out.println("1. " + fixed);
        System.out.println("2. " + attempt(() -> fixed.add("d")));    // fixed-size

        String[] arr = {"x", "y"};
        List<String> view = Arrays.asList(arr);                       // backed by arr
        arr[0] = "CHANGED";
        System.out.println("3. " + view);

        List<String> immutable = List.of("a", "b");
        System.out.println("4. " + attempt(() -> immutable.set(0, "z")));
        System.out.println("5. " + attempt(() -> List.of("a", null)));   // no nulls allowed

        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        List<Integer> sub = nums.subList(1, 4);                       // view of indexes 1..3
        sub.set(0, 20);                                               // writes through to nums
        System.out.println("6. " + nums);
        sub.clear();                                                  // removes 20, 3, 4 from nums
        System.out.println("7. " + nums);
        nums.add(7);                                                  // structural change to the parent
        System.out.println("8. " + attempt(sub::size));               // stale view → CME

        List<Integer> ids = new ArrayList<>(List.of(10, 20, 30));
        ids.remove(1);                                                // remove(int index)
        System.out.println("9. " + ids);
        ids.remove(Integer.valueOf(10));                              // remove(Object)
        System.out.println("10. " + ids);

        List<Integer> evens = new ArrayList<>(List.of(1, 2, 3, 4));
        System.out.println("11. " + attempt(() -> { for (Integer n : evens) if (n % 2 == 0) evens.remove(n); }));
        List<Integer> evens2 = new ArrayList<>(List.of(1, 2, 3, 4));
        evens2.removeIf(n -> n % 2 == 0);                             // the safe way
        System.out.println("12. " + evens2);

        List<String> cow = new CopyOnWriteArrayList<>(List.of("p", "q", "r"));
        int seen = 0;
        for (String s : cow) { cow.add(s + "!"); seen++; }            // iterates the old snapshot
        System.out.println("13. iterated " + seen + ", size now " + cow.size());
    }

    static String attempt(Runnable action) {
        try {
            action.run();
            return "ok";
        } catch (RuntimeException e) {
            return e.getClass().getSimpleName();
        }
    }
}
```

**Expected output**

```text
1. [z, b, c]
2. UnsupportedOperationException
3. [CHANGED, y]
4. UnsupportedOperationException
5. NullPointerException
6. [1, 20, 3, 4, 5, 6]
7. [1, 5, 6]
8. ConcurrentModificationException
9. [10, 30]
10. [30]
11. ConcurrentModificationException
12. [1, 3]
13. iterated 3, size now 6
```

**Thread-safe lists in one table.** `Collections.synchronizedList` locks every call, but you must still wrap iteration in `synchronized (list) { … }`. `CopyOnWriteArrayList` copies the array on every write — perfect for rarely-changed listener lists, terrible for write-heavy data. `Vector` is legacy; don't use it in new code.
