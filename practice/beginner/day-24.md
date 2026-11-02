A gentle start with generics before the generics lab. Write each class once and use it with several types.

<!-- exercise: b24_e1 | Easy | A generic Box and Pair -->
**Concepts:** a type parameter `<T>` · two type parameters `<A, B>` · a generic method · the diamond `<>`

**Task.** Complete `Box<T>` (holds one item; `isEmpty()` when it holds `null`), `Pair<A, B>` (two values of possibly different types, with `swap()` returning a new `Pair<B, A>`), and the generic method `firstOrDefault`, which returns the first element of an array, or the default if the array is empty.

**Starter code** · `GenericsWarmup.java`

```java
class Box<T> {
    private T item;

    void put(T item) { /* TODO */ }
    T get() { return null; }               // TODO
    boolean isEmpty() { return true; }     // TODO
}

class Pair<A, B> {
    private final A first;
    private final B second;

    Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    A getFirst() { return first; }
    B getSecond() { return second; }

    Pair<B, A> swap() {
        return null; // TODO
    }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

public class GenericsWarmup {
    static <T> T firstOrDefault(T[] items, T fallback) {
        return null; // TODO
    }

    public static void main(String[] args) {
        Box<String> word = new Box<>();
        System.out.println(word.isEmpty());
        word.put("hello");
        System.out.println(word.get().toUpperCase() + " " + word.isEmpty());

        Box<Integer> number = new Box<>();
        number.put(41);
        System.out.println(number.get() + 1);

        Pair<String, Integer> age = new Pair<>("Asha", 21);
        System.out.println(age + " -> " + age.swap());

        String[] names = {"Ravi", "Meera"};
        Integer[] none = {};
        System.out.println(firstOrDefault(names, "nobody") + " " + firstOrDefault(none, -1));
    }
}
```

**Expected output**

```text
true
HELLO false
42
(Asha, 21) -> (21, Asha)
Ravi -1
```

<!-- hints -->
- Inside `Box`, `T` is just a type name: `this.item = item;` and `return item;` work as usual.
- `swap()` builds a new pair with the order reversed: `new Pair<>(second, first)`. The compiler works out that it's a `Pair<B, A>`.
- `firstOrDefault`: `return items.length > 0 ? items[0] : fallback;`
- `word.get().toUpperCase()` compiles without a cast because the compiler knows `word` holds Strings. That's the point of generics.

<!-- solution -->
```java
class Box<T> {
    private T item;

    void put(T item) { this.item = item; }
    T get() { return item; }
    boolean isEmpty() { return item == null; }
}

class Pair<A, B> {
    private final A first;
    private final B second;

    Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    A getFirst() { return first; }
    B getSecond() { return second; }

    Pair<B, A> swap() {
        return new Pair<>(second, first);
    }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

public class GenericsWarmup {
    static <T> T firstOrDefault(T[] items, T fallback) {
        return items.length > 0 ? items[0] : fallback;
    }

    public static void main(String[] args) {
        Box<String> word = new Box<>();
        System.out.println(word.isEmpty());
        word.put("hello");
        System.out.println(word.get().toUpperCase() + " " + word.isEmpty());

        Box<Integer> number = new Box<>();
        number.put(41);
        System.out.println(number.get() + 1);

        Pair<String, Integer> age = new Pair<>("Asha", 21);
        System.out.println(age + " -> " + age.swap());

        String[] names = {"Ravi", "Meera"};
        Integer[] none = {};
        System.out.println(firstOrDefault(names, "nobody") + " " + firstOrDefault(none, -1));
    }
}
```

One `Box` class served Strings and Integers, and the compiler checked every use: try `word.put(5);` and see the error. `number.get() + 1` works because the `Integer` is unboxed automatically (Day 19).
