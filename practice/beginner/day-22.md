More OOP tools. Both exercises are about **references**: when two objects share the same inner data, and how a class can keep a small helper class inside itself.

<!-- exercise: b22_e1 | Medium | Shallow copy vs deep copy -->
**Concepts:** copying references vs copying objects · copy constructors · `Arrays.copyOf`

**Task.** A `Team` has a name and an `int[]` of scores. Write two ways to copy a team: `shallowCopy()` (a new `Team` that **shares** the same scores array) and a **copy constructor** `Team(Team other)` that copies the array too. Then show the difference by changing a score in each copy.

**Starter code** · `Teams.java`

```java
import java.util.Arrays;

class Team {
    String name;
    int[] scores;

    Team(String name, int[] scores) {
        this.name = name;
        this.scores = scores;
    }

    Team(Team other) {
        // TODO: deep copy: same name, but a NEW array with the same values
    }

    Team shallowCopy() {
        return null; // TODO: a new Team that reuses this.scores
    }

    @Override
    public String toString() {
        return name + " " + Arrays.toString(scores);
    }
}

public class Teams {
    public static void main(String[] args) {
        Team original = new Team("Tigers", new int[]{10, 20, 30});

        Team shallow = original.shallowCopy();
        shallow.scores[0] = 99;
        System.out.println("after shallow change: " + original);

        Team deep = new Team(original);
        deep.scores[1] = 77;
        deep.name = "Tigers B";
        System.out.println("after deep change:    " + original);
        System.out.println("deep copy:            " + deep);
    }
}
```

**Expected output**

```text
after shallow change: Tigers [99, 20, 30]
after deep change:    Tigers [99, 20, 30]
deep copy:            Tigers B [99, 77, 30]
```

<!-- hints -->
- `shallowCopy()`: `return new Team(name, scores);` creates a new Team, but both point to the same array object.
- The copy constructor needs a new array: `this.scores = Arrays.copyOf(other.scores, other.scores.length);` (or `other.scores.clone()`).
- Strings can be shared safely between copies: they're immutable (Day 8), so `this.name = other.name;` is fine.

<!-- solution -->
```java
import java.util.Arrays;

class Team {
    String name;
    int[] scores;

    Team(String name, int[] scores) {
        this.name = name;
        this.scores = scores;
    }

    Team(Team other) {
        this.name = other.name;                                      // Strings are immutable, so sharing is safe
        this.scores = Arrays.copyOf(other.scores, other.scores.length); // a new array: changes stay separate
    }

    Team shallowCopy() {
        return new Team(name, scores);                               // new Team, SAME array
    }

    @Override
    public String toString() {
        return name + " " + Arrays.toString(scores);
    }
}

public class Teams {
    public static void main(String[] args) {
        Team original = new Team("Tigers", new int[]{10, 20, 30});

        Team shallow = original.shallowCopy();
        shallow.scores[0] = 99;
        System.out.println("after shallow change: " + original);

        Team deep = new Team(original);
        deep.scores[1] = 77;
        deep.name = "Tigers B";
        System.out.println("after deep change:    " + original);
        System.out.println("deep copy:            " + deep);
    }
}
```

Changing the shallow copy's score changed the **original** too, because there was only ever one array. The deep copy has its own array, so the original keeps its 20. Mutable things inside objects (arrays, lists) are exactly where copies go wrong.

<!-- exercise: b22_e2 | Medium | A stack built from a static nested Node class -->
**Concepts:** a `static` nested class · references between nodes · push and pop at the top

**Task.** Build a stack of `String`s from linked nodes. `Node` is a `private static` class nested inside `NodeStack`: each node holds a value and a reference to the node below it. Implement `push`, `pop` (returns the top value and removes it; throws `IllegalStateException` with the message `stack is empty` when empty), `peek`, `size` and `toString` (top first).

**Starter code** · `NodeStack.java`

```java
public class NodeStack {
    private static class Node {
        final String value;
        final Node below;

        Node(String value, Node below) {
            this.value = value;
            this.below = below;
        }
    }

    private Node top;    // null when the stack is empty
    private int size;

    void push(String value) {
        // TODO: a new node on top, pointing at the old top
    }

    String pop() {
        return null; // TODO
    }

    String peek() {
        return top == null ? null : top.value;
    }

    int size() {
        return size;
    }

    @Override
    public String toString() {
        return "[]"; // TODO: walk from top to bottom: [c, b, a]
    }

    public static void main(String[] args) {
        NodeStack s = new NodeStack();
        s.push("a");
        s.push("b");
        s.push("c");
        System.out.println(s + " size=" + s.size());
        System.out.println(s.pop() + " " + s.pop());
        System.out.println(s + " peek=" + s.peek());
        s.pop();
        System.out.println(s + " size=" + s.size());
        try {
            s.pop();
        } catch (IllegalStateException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

**Expected output**

```text
[c, b, a] size=3
c b
[a] peek=a
[] size=0
Error: stack is empty
```

<!-- hints -->
- push: `top = new Node(value, top); size++;` The new node points at what used to be on top.
- pop: check for empty first, then remember `top.value`, move `top = top.below`, decrease `size`, return the remembered value.
- toString: use a `StringBuilder`, start at `Node n = top`, and loop `while (n != null)`, moving with `n = n.below`. Add `", "` between values.

<!-- solution -->
```java
public class NodeStack {
    private static class Node {
        final String value;
        final Node below;

        Node(String value, Node below) {
            this.value = value;
            this.below = below;
        }
    }

    private Node top;
    private int size;

    void push(String value) {
        top = new Node(value, top);
        size++;
    }

    String pop() {
        if (top == null) {
            throw new IllegalStateException("stack is empty");
        }
        String value = top.value;
        top = top.below;
        size--;
        return value;
    }

    String peek() {
        return top == null ? null : top.value;
    }

    int size() {
        return size;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("[");
        for (Node n = top; n != null; n = n.below) {
            sb.append(n.value);
            if (n.below != null) {
                sb.append(", ");
            }
        }
        return sb.append("]").toString();
    }

    public static void main(String[] args) {
        NodeStack s = new NodeStack();
        s.push("a");
        s.push("b");
        s.push("c");
        System.out.println(s + " size=" + s.size());
        System.out.println(s.pop() + " " + s.pop());
        System.out.println(s + " peek=" + s.peek());
        s.pop();
        System.out.println(s + " size=" + s.size());
        try {
            s.pop();
        } catch (IllegalStateException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

`Node` is `static` because a node doesn't need to reach into the stack object; it only holds its own data. It's `private` because nobody outside `NodeStack` should know nodes exist. Push and pop only touch the top node, so both are O(1). This is exactly how linked-list stacks work inside libraries.
