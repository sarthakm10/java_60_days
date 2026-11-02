JVM internals usually feel like pure theory. These programs make them observable: you'll watch class initialisation happen, trigger real JVM errors on purpose, and find and fix four classic memory leaks.

<!-- exercise: d17_e1 | Medium | Predict the output: class loading and initialisation order -->
**Concepts:** lazy class initialisation · compile-time constants are inlined (no init) · arrays of a class don't initialise it · static blocks run once · instance initialisers and constructor order with inheritance · `Class.forName` · bootstrap vs platform class loaders

**Task.** Copy the program, **predict the full output** (including where the bracketed lines appear), then run it and explain every line you got wrong. Initialisation order is a favourite "what does this print?" question.

**Starter code** · `InitOrder.java`

```java
public class InitOrder {
    public static void main(String[] args) throws Exception {
        System.out.println("1. main starts");
        System.out.println("2. constant: " + Config.VERSION);
        Config[] arr = new Config[3];
        System.out.println("3. array created, length " + arr.length);
        System.out.println("4. counter: " + Config.counter);
        System.out.println("5. creating Child");
        new Child();
        System.out.println("6. creating second Child");
        new Child();
        System.out.println("7. forName");
        Class.forName("Lazy");
        System.out.println("8. String loader: " + String.class.getClassLoader());
        System.out.println("9. platform loader: " + ClassLoader.getPlatformClassLoader().getName());
    }
}

class Config {
    static final String VERSION = "1.0";
    static int counter = 42;
    static { System.out.println("   [Config static init]"); }
}

class Parent {
    static { System.out.println("   [Parent static]"); }
    { System.out.println("   [Parent instance init]"); }
    Parent() { System.out.println("   [Parent constructor]"); }
}

class Child extends Parent {
    static { System.out.println("   [Child static]"); }
    { System.out.println("   [Child instance init]"); }
    Child() { System.out.println("   [Child constructor]"); }
}

class Lazy {
    static { System.out.println("   [Lazy static init]"); }
}
```

<!-- hints -->
- A class is **initialised** (static blocks run) on first *active use*: creating an instance, calling a static method, reading/writing a non-constant static field, `Class.forName`, or initialising a subclass.
- `static final String VERSION = "1.0"` is a **compile-time constant** — the compiler copies `"1.0"` into `InitOrder`, so `Config` isn't touched.
- `new Config[3]` creates an array object; it doesn't initialise `Config`.
- In `"4. counter: " + Config.counter`, the right-hand side is evaluated (initialising `Config`) **before** `println` prints the line.
- For `new Child()`: parent static → child static (only the first time), then for each object: parent instance initialisers → parent constructor → child instance initialisers → child constructor.

<!-- solution -->
```java
public class InitOrder {
    public static void main(String[] args) throws Exception {
        System.out.println("1. main starts");
        System.out.println("2. constant: " + Config.VERSION);       // inlined constant → Config NOT initialised
        Config[] arr = new Config[3];                                 // array creation → no init
        System.out.println("3. array created, length " + arr.length);
        System.out.println("4. counter: " + Config.counter);        // non-constant static field → init now
        System.out.println("5. creating Child");
        new Child();                                                  // statics once, then instance chain
        System.out.println("6. creating second Child");
        new Child();                                                  // statics already done
        System.out.println("7. forName");
        Class.forName("Lazy");                                        // forName initialises by default
        System.out.println("8. String loader: " + String.class.getClassLoader());   // bootstrap → null
        System.out.println("9. platform loader: " + ClassLoader.getPlatformClassLoader().getName());
    }
}

class Config {
    static final String VERSION = "1.0";
    static int counter = 42;
    static { System.out.println("   [Config static init]"); }
}

class Parent {
    static { System.out.println("   [Parent static]"); }
    { System.out.println("   [Parent instance init]"); }
    Parent() { System.out.println("   [Parent constructor]"); }
}

class Child extends Parent {
    static { System.out.println("   [Child static]"); }
    { System.out.println("   [Child instance init]"); }
    Child() { System.out.println("   [Child constructor]"); }
}

class Lazy {
    static { System.out.println("   [Lazy static init]"); }
}
```

**Expected output**

```text
1. main starts
2. constant: 1.0
3. array created, length 3
   [Config static init]
4. counter: 42
5. creating Child
   [Parent static]
   [Child static]
   [Parent instance init]
   [Parent constructor]
   [Child instance init]
   [Child constructor]
6. creating second Child
   [Parent instance init]
   [Parent constructor]
   [Child instance init]
   [Child constructor]
7. forName
   [Lazy static init]
8. String loader: null
9. platform loader: platform
```

**Class loaders in one line each.** **Bootstrap** (native, shown as `null`) loads `java.base` — `String`, `Object`. **Platform** loads other JDK modules (`java.sql`…). **Application** loads your classpath. Each first asks its **parent** (parent delegation), which is why you can't replace `java.lang.String` with your own. Lazy initialisation is also why the **holder-class singleton** idiom is thread-safe without locks.

<!-- exercise: d17_e2 | Medium | Stack vs heap, pass-by-value and JVM errors -->
**Concepts:** primitives and references live in stack frames, objects live on the heap · Java is always **pass-by-value** (a copy of the reference) · `StackOverflowError` from deep recursion · `OutOfMemoryError` variants · `Runtime` memory figures

**Task.**

1. Show that `swap(a, b)` on two `StringBuilder` parameters doesn't swap the caller's variables, but `append` through a parameter **does** change the caller's object.
2. Reassigning a parameter to a new list doesn't affect the caller.
3. Trigger a `StackOverflowError` with unbounded recursion and catch it (print only the error type — the depth varies by machine).
4. Request `new long[Integer.MAX_VALUE]` and catch the `OutOfMemoryError`; print its message.
5. Print whether `maxMemory() >= totalMemory() >= freeMemory()` holds (the numbers themselves vary).

**Starter code** · `StackHeapLab.java`

```java
import java.util.ArrayList;
import java.util.List;

public class StackHeapLab {
    public static void main(String[] args) {
        StringBuilder a = new StringBuilder("A"), b = new StringBuilder("B");
        swap(a, b);
        System.out.println("after swap: a=" + a + ", b=" + b);
        appendBang(a);
        System.out.println("after appendBang: a=" + a);

        List<String> list = new ArrayList<>(List.of("x"));
        reassign(list);
        System.out.println("after reassign: " + list);

        // TODO 3: call recurse(0) and catch StackOverflowError → "deep recursion: StackOverflowError"
        // TODO 4: new long[Integer.MAX_VALUE], catch OutOfMemoryError → "huge array: OutOfMemoryError (<message>)"
        // TODO 5: Runtime checks → "memory ordering holds: true"
    }

    static void swap(StringBuilder x, StringBuilder y) { StringBuilder t = x; x = y; y = t; }
    static void appendBang(StringBuilder x) { x.append("!"); }
    static void reassign(List<String> l) { l = new ArrayList<>(List.of("new")); }
    static int recurse(int depth) { return recurse(depth + 1) + 1; }
}
```

**Expected output**

```text
after swap: a=A, b=B
after appendBang: a=A!
after reassign: [x]
deep recursion: StackOverflowError
huge array: OutOfMemoryError (Requested array size exceeds VM limit)
memory ordering holds: true
```

<!-- hints -->
- Each method call gets its own **stack frame** with its own copies of the parameters. `swap` only swaps its local copies of the references.
- `appendBang` follows its copy of the reference to the **same heap object** and mutates it — so the caller sees the change.
- The default thread stack is ~512 KB–1 MB; tune with `-Xss`. Catching `StackOverflowError` is fine for a demo, never as control flow.
- A `long[Integer.MAX_VALUE]` would need 16 GB *and* exceeds the JVM's maximum array length, so HotSpot fails fast with "Requested array size exceeds VM limit". Normal heap exhaustion says "Java heap space".
- `Runtime.getRuntime()`: `maxMemory()` = `-Xmx`, `totalMemory()` = heap currently reserved, `freeMemory()` = unused part of that.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;

public class StackHeapLab {
    public static void main(String[] args) {
        StringBuilder a = new StringBuilder("A"), b = new StringBuilder("B");
        swap(a, b);                                                    // swaps copies of the references
        System.out.println("after swap: a=" + a + ", b=" + b);
        appendBang(a);                                                 // mutates the shared heap object
        System.out.println("after appendBang: a=" + a);

        List<String> list = new ArrayList<>(List.of("x"));
        reassign(list);                                                // rebinding a parameter is local
        System.out.println("after reassign: " + list);

        try {
            recurse(0);
        } catch (StackOverflowError e) {                               // each call pushed a new frame
            System.out.println("deep recursion: " + e.getClass().getSimpleName());
        }

        try {
            long[] huge = new long[Integer.MAX_VALUE];
            System.out.println(huge.length);
        } catch (OutOfMemoryError e) {
            System.out.println("huge array: " + e.getClass().getSimpleName() + " (" + e.getMessage() + ")");
        }

        Runtime rt = Runtime.getRuntime();
        boolean ordered = rt.maxMemory() >= rt.totalMemory() && rt.totalMemory() >= rt.freeMemory();
        System.out.println("memory ordering holds: " + ordered);
    }

    static void swap(StringBuilder x, StringBuilder y) { StringBuilder t = x; x = y; y = t; }
    static void appendBang(StringBuilder x) { x.append("!"); }
    static void reassign(List<String> l) { l = new ArrayList<>(List.of("new")); }
    static int recurse(int depth) { return recurse(depth + 1) + 1; }
}
```

**OutOfMemoryError cheat sheet.** `Java heap space` — too many live objects (leak or undersized `-Xmx`). `GC overhead limit exceeded` — spending > 98 % of time in GC recovering < 2 % heap. `Metaspace` — too many classes (class-loader leaks, runaway proxies). `unable to create native thread` — OS thread limit (use pools or virtual threads). `Direct buffer memory` — off-heap NIO buffers. Run services with `-XX:+HeapDumpOnOutOfMemoryError` so you get a heap dump to analyse.

<!-- exercise: d17_e3 | Medium | Find and fix four memory leaks -->
**Concepts:** unbounded static caches · listeners never unregistered · inner classes holding a hidden reference to the outer object · `ThreadLocal` values left on pooled threads

**Task.** Each section of the starter has a leak, measured with a counter so the result is repeatable. Fix each one and make the program print the "fixed" numbers:

1. **Static cache** — caches every request forever. Bound it to 100 entries (LRU).
2. **Listeners** — short-lived components subscribe to an event bus but never unsubscribe. Return an `AutoCloseable` subscription and use try-with-resources.
3. **Inner class** — a non-static inner class keeps its outer object alive. Show the hidden synthetic field, then use a `static` nested class.
4. **`ThreadLocal`** — a value set by one task is still visible to the next task on the same pooled thread. Always `remove()` in `finally`.

**Starter code** · `LeakHunt.java`

```java
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class LeakHunt {
    static final Map<Integer, byte[]> CACHE = new HashMap<>();     // TODO 1: bounded LRU of 100

    public static void main(String[] args) throws Exception {
        for (int id = 0; id < 10_000; id++) CACHE.computeIfAbsent(id, k -> new byte[16]);
        System.out.println("1. cache entries after 10,000 requests: " + CACHE.size());

        EventBus bus = new EventBus();
        for (int i = 0; i < 1_000; i++) {
            bus.subscribe(event -> { });                            // TODO 2: unsubscribe when the component is done
        }
        System.out.println("2. listeners still registered: " + bus.listenerCount());

        System.out.println("3. inner class holds outer: " + hasHiddenOuterRef(Outer.Inner.class)
                + ", static nested holds outer: " + hasHiddenOuterRef(Outer.Nested.class));

        ThreadLocal<String> currentUser = new ThreadLocal<>();
        ExecutorService single = Executors.newSingleThreadExecutor();
        single.submit(() -> currentUser.set("asha")).get();         // TODO 4: remove() in finally
        Future<String> next = single.submit(currentUser::get);
        System.out.println("4. next task on the same thread sees user: " + next.get());
        single.shutdown();
    }

    static boolean hasHiddenOuterRef(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).anyMatch(Field::isSynthetic);
    }
}

class EventBus {
    private final List<java.util.function.Consumer<String>> listeners = new ArrayList<>();
    void subscribe(java.util.function.Consumer<String> l) { listeners.add(l); }   // TODO: return AutoCloseable
    int listenerCount() { return listeners.size(); }
}

class Outer {
    private final byte[] bigData = new byte[1_000_000];
    class Inner { int size() { return bigData.length; } }           // uses the outer instance
    static class Nested { int size() { return 0; } }
}
```

**Expected output**

```text
1. cache entries after 10,000 requests: 100
2. listeners still registered: 0
3. inner class holds outer: true, static nested holds outer: false
4. next task on the same thread sees user: null
```

<!-- hints -->
- Leak 1: a `LinkedHashMap` with `removeEldestEntry` returning `size() > 100` bounds the cache. In real apps use Caffeine with `maximumSize` / `expireAfterWrite`.
- Leak 2: `AutoCloseable subscribe(...) { listeners.add(l); return () -> listeners.remove(l); }` and `try (AutoCloseable sub = bus.subscribe(...)) { … }`.
- Leak 3: a non-static inner class has a synthetic field (usually `this$0`) pointing at its outer instance — any `Inner` object keeps the 1 MB `bigData` alive. The check already prints `true` for `Inner`; the fix is to prefer `static` nested classes when you don't need the outer instance.
- Leak 4: pooled threads live for the whole application, and so do their `ThreadLocal` values — a security bug too (one user's data visible to another request).

<!-- solution -->
```java
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Consumer;

public class LeakHunt {
    static final Map<Integer, byte[]> CACHE = new LinkedHashMap<>(16, 0.75f, true) {   // bounded LRU
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, byte[]> eldest) {
            return size() > 100;
        }
    };

    public static void main(String[] args) throws Exception {
        for (int id = 0; id < 10_000; id++) CACHE.computeIfAbsent(id, k -> new byte[16]);
        System.out.println("1. cache entries after 10,000 requests: " + CACHE.size());

        EventBus bus = new EventBus();
        for (int i = 0; i < 1_000; i++) {
            try (AutoCloseable sub = bus.subscribe(event -> { })) {   // unsubscribed when the block ends
                // the short-lived component does its work here
            }
        }
        System.out.println("2. listeners still registered: " + bus.listenerCount());

        System.out.println("3. inner class holds outer: " + hasHiddenOuterRef(Outer.Inner.class)
                + ", static nested holds outer: " + hasHiddenOuterRef(Outer.Nested.class));

        ThreadLocal<String> currentUser = new ThreadLocal<>();
        ExecutorService single = Executors.newSingleThreadExecutor();
        single.submit(() -> {
            currentUser.set("asha");
            try {
                // ... handle the request ...
            } finally {
                currentUser.remove();                                 // never leave values on pooled threads
            }
        }).get();
        Future<String> next = single.submit(currentUser::get);
        System.out.println("4. next task on the same thread sees user: " + next.get());
        single.shutdown();
    }

    static boolean hasHiddenOuterRef(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).anyMatch(Field::isSynthetic);   // e.g. this$0
    }
}

class EventBus {
    private final List<Consumer<String>> listeners = new ArrayList<>();

    AutoCloseable subscribe(Consumer<String> l) {
        listeners.add(l);
        return () -> listeners.remove(l);                             // caller decides when to let go
    }

    int listenerCount() { return listeners.size(); }
}

class Outer {
    private final byte[] bigData = new byte[1_000_000];
    class Inner { int size() { return bigData.length; } }            // hidden reference to Outer.this
    static class Nested { int size() { return 0; } }                 // no outer reference
}
```

**Finding leaks in production.** Watch heap usage *after* full GCs climb over time; take a heap dump (`jcmd <pid> GC.heap_dump file.hprof` or `-XX:+HeapDumpOnOutOfMemoryError`); open it in Eclipse MAT or VisualVM and look at the **dominator tree** / largest retained sizes and the "path to GC roots" — it usually ends in a static field, a thread, or a `ThreadLocal`.
