Your first classes. Put each class in its own file, or keep the helper class in the same file without `public` (as the starters do), so each exercise runs with one click.

<!-- exercise: b13_e1 | Easy | A Book class -->
**Concepts:** fields · a constructor with `this` · instance methods · creating objects with `new`

**Task.** Complete the `Book` class. `borrow()` returns `true` and marks the book borrowed if it was available, otherwise returns `false`. `giveBack()` makes it available again. `describe()` returns text like `Dune by Frank Herbert (available)` or `(borrowed)`.

**Starter code** · `Library.java`

```java
class Book {
    String title;
    String author;
    boolean borrowed;

    Book(String title, String author) {
        // TODO: set the fields (use this.)
    }

    boolean borrow() {
        return false; // TODO
    }

    void giveBack() {
        // TODO
    }

    String describe() {
        return ""; // TODO
    }
}

public class Library {
    public static void main(String[] args) {
        Book dune = new Book("Dune", "Frank Herbert");
        Book hobbit = new Book("The Hobbit", "J.R.R. Tolkien");
        System.out.println(dune.borrow());
        System.out.println(dune.borrow());
        System.out.println(dune.describe());
        System.out.println(hobbit.describe());
        dune.giveBack();
        System.out.println(dune.describe());
    }
}
```

**Expected output**

```text
true
false
Dune by Frank Herbert (borrowed)
The Hobbit by J.R.R. Tolkien (available)
Dune by Frank Herbert (available)
```

<!-- hints -->
- In the constructor, `this.title = title;` copies the parameter into the field of the new object.
- `borrow()`: `if (borrowed) return false;` then set `borrowed = true` and `return true`.
- `describe()` can use a ternary for the last part: `(borrowed ? "borrowed" : "available")`.

<!-- solution -->
```java
class Book {
    String title;
    String author;
    boolean borrowed;

    Book(String title, String author) {
        this.title = title;
        this.author = author;
    }

    boolean borrow() {
        if (borrowed) {
            return false;
        }
        borrowed = true;
        return true;
    }

    void giveBack() {
        borrowed = false;
    }

    String describe() {
        return title + " by " + author + " (" + (borrowed ? "borrowed" : "available") + ")";
    }
}

public class Library {
    public static void main(String[] args) {
        Book dune = new Book("Dune", "Frank Herbert");
        Book hobbit = new Book("The Hobbit", "J.R.R. Tolkien");
        System.out.println(dune.borrow());
        System.out.println(dune.borrow());
        System.out.println(dune.describe());
        System.out.println(hobbit.describe());
        dune.giveBack();
        System.out.println(dune.describe());
    }
}
```

Each method works on the book it's called on: `dune.borrow()` changes only `dune`. Notice the boolean field `borrowed` starts as `false` without any code, because fields get default values. (Tomorrow you'll make these fields `private`.)

<!-- exercise: b13_e2 | Easy | Predict the output: references and null -->
**Concepts:** each object has its own fields · two variables, one object · `==` on references · `null`

**Task.** Write down what this prints **before** running it. Then run it, and for each line you got wrong, draw the variables and the objects they point to.

**Starter code** · `References.java`

```java
class Counter {
    int count;

    void click() {
        count++;
    }
}

public class References {
    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        Counter c = a;

        a.click();
        a.click();
        b.click();
        c.click();

        System.out.println(a.count + " " + b.count + " " + c.count);
        System.out.println(a == c);
        System.out.println(a == b);

        Counter[] slots = new Counter[2];
        System.out.println(slots[0] == null);
        slots[0] = b;
        slots[0].click();
        System.out.println(b.count);

        Counter d = null;
        if (d != null) {
            d.click();
        }
        System.out.println(d == null ? "d points nowhere" : "d is set");
    }
}
```

<!-- hints -->
- `c = a` doesn't create a Counter: `a` and `c` are two names for one object. Clicking through `c` changes `a.count`.
- `==` on objects asks "is it the same object?"
- A new array of objects is full of `null`s. `slots[0] = b` stores a reference to `b`'s object, so clicking `slots[0]` changes `b`.

<!-- solution -->
```java
class Counter {
    int count;

    void click() {
        count++;
    }
}

public class References {
    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        Counter c = a;

        a.click();
        a.click();
        b.click();
        c.click();

        System.out.println(a.count + " " + b.count + " " + c.count);
        System.out.println(a == c);
        System.out.println(a == b);

        Counter[] slots = new Counter[2];
        System.out.println(slots[0] == null);
        slots[0] = b;
        slots[0].click();
        System.out.println(b.count);

        Counter d = null;
        if (d != null) {
            d.click();
        }
        System.out.println(d == null ? "d points nowhere" : "d is set");
    }
}
```

**Expected output**

```text
3 1 3
true
false
true
2
d points nowhere
```

There are only **two** Counter objects in this whole program: `new` runs twice. `a`, `c` point to the first; `b` and `slots[0]` point to the second. The `d != null` check is what keeps the program from crashing with a NullPointerException.
