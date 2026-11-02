The Phase 2 project. This exercise is the **core** of the library system from today's notes, small enough to check automatically. Once it passes, add a menu with `Scanner` and more features on top.

<!-- exercise: b23_e1 | Medium | Library core: books, members and lending rules -->
**Concepts:** designing several cooperating classes · private fields · custom exceptions · catching them in `main`

**Task.** Complete the three classes so that:

- a `Book` remembers which `Member` has it (`null` when available);
- a `Member` may hold at most 3 books (`canBorrow()`), and counts how many they have;
- `Library.lend(bookId, member)` throws `BookNotFoundException`, `BookNotAvailableException` or `BorrowLimitException` when a rule is broken, otherwise records the loan;
- `Library.giveBack(bookId)` makes the book available and reduces the member's count;
- `Library.available()` returns the titles of the books on the shelf, comma-separated, in the order they were added.

`main` is written for you: it tries a series of actions and prints either `OK` or the exception's message.

**Starter code** · `LibraryApp.java`

```java
class BookNotFoundException extends RuntimeException {
    BookNotFoundException(String id) { super("No book with id " + id); }
}

class BookNotAvailableException extends RuntimeException {
    BookNotAvailableException(String title) { super("'" + title + "' is already borrowed"); }
}

class BorrowLimitException extends RuntimeException {
    BorrowLimitException(String name) { super(name + " already has 3 books"); }
}

class Member {
    static final int LIMIT = 3;
    private final String name;
    private int borrowedCount;

    Member(String name) { this.name = name; }

    String getName() { return name; }
    boolean canBorrow() { return false; }   // TODO
    void addLoan() { }                      // TODO
    void endLoan() { }                      // TODO
}

class Book {
    private final String id;
    private final String title;
    private Member borrowedBy;              // null = on the shelf

    Book(String id, String title) {
        this.id = id;
        this.title = title;
    }

    String getId() { return id; }
    String getTitle() { return title; }
    boolean isAvailable() { return false; } // TODO
    Member getBorrowedBy() { return borrowedBy; }
    void setBorrowedBy(Member m) { borrowedBy = m; }
}

class Library {
    private final Book[] books = new Book[20];
    private int count;

    void addBook(Book b) {
        books[count++] = b;
    }

    private Book find(String id) {
        // TODO: return the book with this id, or throw BookNotFoundException
        return null;
    }

    void lend(String bookId, Member member) {
        // TODO: find the book, check availability, check the member's limit, record the loan
    }

    void giveBack(String bookId) {
        // TODO: find the book, end the member's loan, put the book back on the shelf
    }

    String available() {
        return ""; // TODO: titles of available books, joined with ", "
    }
}

public class LibraryApp {
    static void attempt(String label, Runnable action) {
        try {
            action.run();
            System.out.println(label + ": OK");
        } catch (RuntimeException e) {
            System.out.println(label + ": " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        Library lib = new Library();
        lib.addBook(new Book("B1", "Dune"));
        lib.addBook(new Book("B2", "Emma"));
        lib.addBook(new Book("B3", "Ulysses"));
        lib.addBook(new Book("B4", "Beloved"));
        Member asha = new Member("Asha");
        Member ravi = new Member("Ravi");

        attempt("Asha takes B1", () -> lib.lend("B1", asha));
        attempt("Ravi takes B1", () -> lib.lend("B1", ravi));
        attempt("Asha takes B2", () -> lib.lend("B2", asha));
        attempt("Asha takes B3", () -> lib.lend("B3", asha));
        attempt("Asha takes B4", () -> lib.lend("B4", asha));
        attempt("Ravi takes B9", () -> lib.lend("B9", ravi));
        System.out.println("On the shelf: " + lib.available());
        attempt("Asha returns B2", () -> lib.giveBack("B2"));
        attempt("Asha takes B4", () -> lib.lend("B4", asha));
        System.out.println("On the shelf: " + lib.available());
    }
}
```

**Expected output**

```text
Asha takes B1: OK
Ravi takes B1: 'Dune' is already borrowed
Asha takes B2: OK
Asha takes B3: OK
Asha takes B4: Asha already has 3 books
Ravi takes B9: No book with id B9
On the shelf: Beloved
Asha returns B2: OK
Asha takes B4: OK
On the shelf: Emma
```

<!-- hints -->
- `find`: loop `for (int i = 0; i < count; i++)` and compare ids with `equals`. After the loop, `throw new BookNotFoundException(id);`
- `lend` checks in order: not available → `BookNotAvailableException(book.getTitle())`; member can't borrow → `BorrowLimitException(member.getName())`; otherwise `book.setBorrowedBy(member)` and `member.addLoan()`.
- `giveBack`: `book.getBorrowedBy().endLoan()` then `book.setBorrowedBy(null)`. (What should happen if the book wasn't borrowed? Decide, and handle it.)
- `available`: a `StringBuilder`, adding `", "` before every title except the first.
- `() -> lib.lend(...)` in `main` is a *lambda*: a small piece of code passed to `attempt` to run inside its `try`. You'll learn them properly on Day 34.

<!-- solution -->
```java
class BookNotFoundException extends RuntimeException {
    BookNotFoundException(String id) { super("No book with id " + id); }
}

class BookNotAvailableException extends RuntimeException {
    BookNotAvailableException(String title) { super("'" + title + "' is already borrowed"); }
}

class BorrowLimitException extends RuntimeException {
    BorrowLimitException(String name) { super(name + " already has 3 books"); }
}

class Member {
    static final int LIMIT = 3;
    private final String name;
    private int borrowedCount;

    Member(String name) { this.name = name; }

    String getName() { return name; }
    boolean canBorrow() { return borrowedCount < LIMIT; }
    void addLoan() { borrowedCount++; }
    void endLoan() { borrowedCount--; }
}

class Book {
    private final String id;
    private final String title;
    private Member borrowedBy;

    Book(String id, String title) {
        this.id = id;
        this.title = title;
    }

    String getId() { return id; }
    String getTitle() { return title; }
    boolean isAvailable() { return borrowedBy == null; }
    Member getBorrowedBy() { return borrowedBy; }
    void setBorrowedBy(Member m) { borrowedBy = m; }
}

class Library {
    private final Book[] books = new Book[20];
    private int count;

    void addBook(Book b) {
        books[count++] = b;
    }

    private Book find(String id) {
        for (int i = 0; i < count; i++) {
            if (books[i].getId().equals(id)) {
                return books[i];
            }
        }
        throw new BookNotFoundException(id);
    }

    void lend(String bookId, Member member) {
        Book book = find(bookId);
        if (!book.isAvailable()) {
            throw new BookNotAvailableException(book.getTitle());
        }
        if (!member.canBorrow()) {
            throw new BorrowLimitException(member.getName());
        }
        book.setBorrowedBy(member);
        member.addLoan();
    }

    void giveBack(String bookId) {
        Book book = find(bookId);
        if (book.isAvailable()) {
            throw new IllegalStateException("'" + book.getTitle() + "' was not borrowed");
        }
        book.getBorrowedBy().endLoan();
        book.setBorrowedBy(null);
    }

    String available() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            if (books[i].isAvailable()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(books[i].getTitle());
            }
        }
        return sb.toString();
    }
}

public class LibraryApp {
    static void attempt(String label, Runnable action) {
        try {
            action.run();
            System.out.println(label + ": OK");
        } catch (RuntimeException e) {
            System.out.println(label + ": " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        Library lib = new Library();
        lib.addBook(new Book("B1", "Dune"));
        lib.addBook(new Book("B2", "Emma"));
        lib.addBook(new Book("B3", "Ulysses"));
        lib.addBook(new Book("B4", "Beloved"));
        Member asha = new Member("Asha");
        Member ravi = new Member("Ravi");

        attempt("Asha takes B1", () -> lib.lend("B1", asha));
        attempt("Ravi takes B1", () -> lib.lend("B1", ravi));
        attempt("Asha takes B2", () -> lib.lend("B2", asha));
        attempt("Asha takes B3", () -> lib.lend("B3", asha));
        attempt("Asha takes B4", () -> lib.lend("B4", asha));
        attempt("Ravi takes B9", () -> lib.lend("B9", ravi));
        System.out.println("On the shelf: " + lib.available());
        attempt("Asha returns B2", () -> lib.giveBack("B2"));
        attempt("Asha takes B4", () -> lib.lend("B4", asha));
        System.out.println("On the shelf: " + lib.available());
    }
}
```

Each rule lives where its data is: the limit in `Member`, availability in `Book`, and `Library` only coordinates. Because every field is private and changes go through these methods, there's no way to end up with a book borrowed by two people or a member with four books. **Next steps:** swap the array for an `ArrayList` after Day 25, add a `Scanner` menu (list / lend / return / quit), and give `Book` a `toString()`.
