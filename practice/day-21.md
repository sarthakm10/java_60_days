Today you map entities, write repository queries, and **measure** the N+1 problem instead of just reading about it. Tests use `@DataJpaTest`, which swaps in an in-memory database automatically.

**Dependencies to add:** Spring Data JPA (`spring-boot-starter-data-jpa`) and the **H2** database (`com.h2database:h2`, runtime scope). On Boot 4 add `spring-boot-starter-data-jpa-test` (test scope). On Boot 3, `@DataJpaTest` and `TestEntityManager` live in `org.springframework.boot.test.autoconfigure.orm.jpa` instead of the Boot 4 packages used below. Turn on `spring.jpa.show-sql=true` while you work so you can see every SQL statement.

<!-- exercise: d21_e1 | Medium | Entities, a bidirectional relationship and derived queries -->
<!-- verify: compile -->
**Concepts:** `@Entity`, `@Id`, `@GeneratedValue(IDENTITY)` · `@OneToMany(mappedBy)` + `@ManyToOne` (owning side) · cascade and `orphanRemoval` · keeping both sides in sync · derived query methods

**Task.** Map an `Author` with many `Book`s:

- `Book` owns the relationship (`@ManyToOne(fetch = LAZY)` with the foreign key). `Author.books` is the inverse side (`mappedBy = "author"`), with `cascade = ALL` and `orphanRemoval = true`.
- `addBook`/`removeBook` keep **both** sides in sync.
- `BookRepository` gets derived queries: by author name, by price below a limit (sorted ascending), count by author id, and title lookup ignoring case.

**Starter code**

```java
// src/main/java/com/example/practice/d21/relations/Author.java
package com.example.practice.d21.relations;

import java.util.ArrayList;
import java.util.List;

// TODO: map as an entity; books = inverse side of Book.author, cascade ALL + orphanRemoval
public class Author {
    private Long id;
    private String name;
    private List<Book> books = new ArrayList<>();

    protected Author() { }                          // JPA needs a no-arg constructor
    public Author(String name) { this.name = name; }

    public void addBook(Book book) { }              // TODO: set both sides
    public void removeBook(Book book) { }           // TODO: unset both sides

    public Long getId() { return id; }
    public String getName() { return name; }
    public List<Book> getBooks() { return books; }
}
```

```java
// src/main/java/com/example/practice/d21/relations/Book.java
package com.example.practice.d21.relations;

import java.math.BigDecimal;

// TODO: map as an entity; author is a LAZY @ManyToOne (the owning side)
public class Book {
    private Long id;
    private String title;
    private BigDecimal price;
    private Author author;

    protected Book() { }
    public Book(String title, BigDecimal price) { this.title = title; this.price = price; }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public BigDecimal getPrice() { return price; }
    public Author getAuthor() { return author; }
    void setAuthor(Author author) { this.author = author; }
}
```

```java
// src/main/java/com/example/practice/d21/relations/AuthorRepository.java
package com.example.practice.d21.relations;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthorRepository extends JpaRepository<Author, Long> { }
```

```java
// src/main/java/com/example/practice/d21/relations/BookRepository.java
package com.example.practice.d21.relations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
    // TODO: rename/declare these as derived queries Spring Data can parse
    List<Book> byAuthorName(String name);
    List<Book> cheaperThan(BigDecimal limit);
    long booksOfAuthor(Long authorId);
    Optional<Book> titleIgnoringCase(String title);
}
```

**Given test** (don't change it — update the four method names in the test once you've renamed them in the repository)

```java
// src/test/java/com/example/practice/d21/relations/RelationshipTest.java
package com.example.practice.d21.relations;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class RelationshipTest {

    @Autowired TestEntityManager em;
    @Autowired AuthorRepository authors;
    @Autowired BookRepository books;

    Author seed() {
        Author kleppmann = new Author("Martin Kleppmann");
        kleppmann.addBook(new Book("Designing Data-Intensive Applications", new BigDecimal("3200.00")));
        Author bloch = new Author("Joshua Bloch");
        bloch.addBook(new Book("Effective Java", new BigDecimal("899.00")));
        bloch.addBook(new Book("Java Puzzlers", new BigDecimal("450.00")));
        authors.save(kleppmann);
        authors.save(bloch);                       // cascade persists the books
        em.flush();
        em.clear();                                // force real SELECTs below
        return bloch;
    }

    @Test
    void cascadeSavesBooksAndTheForeignKeyIsSet() {
        seed();
        assertThat(books.count()).isEqualTo(3);
        Book ddia = books.titleIgnoringCase("designing data-intensive applications").orElseThrow();
        assertThat(ddia.getAuthor().getName()).isEqualTo("Martin Kleppmann");
    }

    @Test
    void derivedQueriesWork() {
        Author bloch = seed();
        assertThat(books.byAuthorName("Joshua Bloch")).hasSize(2);
        assertThat(books.cheaperThan(new BigDecimal("1000"))).extracting(Book::getTitle)
                .containsExactly("Java Puzzlers", "Effective Java");
        assertThat(books.booksOfAuthor(bloch.getId())).isEqualTo(2);
    }

    @Test
    void orphanRemovalDeletesABookRemovedFromTheCollection() {
        Author bloch = seed();
        Author managed = authors.findById(bloch.getId()).orElseThrow();
        managed.removeBook(managed.getBooks().get(0));
        em.flush();
        assertThat(books.count()).isEqualTo(2);
    }
}
```

**Expected result**

```text
RelationshipTest: 3 tests passed
```

<!-- hints -->
- Owning side = the side with the foreign key column (`Book.author` → `author_id`). Only changes to the owning side are written to the database; `mappedBy` marks the other side as a mirror.
- `addBook`: `books.add(book); book.setAuthor(this);` — `removeBook`: `books.remove(book); book.setAuthor(null);`.
- Derived query names: `findByAuthorName`, `findByPriceLessThanOrderByPriceAsc`, `countByAuthorId`, `findByTitleIgnoreCase`. Spring Data parses the name at startup — a typo fails the context.
- Always use `fetch = FetchType.LAZY` on `@ManyToOne` (its default is EAGER) — eager associations are a common source of hidden extra queries.
- `em.flush(); em.clear();` empties the persistence context so the test really hits the database instead of the first-level cache.

<!-- solution -->
```java
// src/main/java/com/example/practice/d21/relations/Author.java
package com.example.practice.d21.relations;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)   // inverse side
    private List<Book> books = new ArrayList<>();

    protected Author() { }
    public Author(String name) { this.name = name; }

    public void addBook(Book book) {
        books.add(book);
        book.setAuthor(this);          // the owning side is what gets persisted
    }

    public void removeBook(Book book) {
        books.remove(book);
        book.setAuthor(null);          // orphanRemoval deletes it on flush
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public List<Book> getBooks() { return books; }
}
```

```java
// src/main/java/com/example/practice/d21/relations/Book.java
package com.example.practice.d21.relations;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;

@Entity
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)              // owning side: holds author_id
    @JoinColumn(name = "author_id")
    private Author author;

    protected Book() { }
    public Book(String title, BigDecimal price) { this.title = title; this.price = price; }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public BigDecimal getPrice() { return price; }
    public Author getAuthor() { return author; }
    void setAuthor(Author author) { this.author = author; }
}
```

```java
// src/main/java/com/example/practice/d21/relations/BookRepository.java
package com.example.practice.d21.relations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByAuthorName(String name);                              // join through author.name
    List<Book> findByPriceLessThanOrderByPriceAsc(BigDecimal limit);
    long countByAuthorId(Long authorId);
    Optional<Book> findByTitleIgnoreCase(String title);
}
```

```java
// src/test/java/com/example/practice/d21/relations/RelationshipTest.java
package com.example.practice.d21.relations;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class RelationshipTest {

    @Autowired TestEntityManager em;
    @Autowired AuthorRepository authors;
    @Autowired BookRepository books;

    Author seed() {
        Author kleppmann = new Author("Martin Kleppmann");
        kleppmann.addBook(new Book("Designing Data-Intensive Applications", new BigDecimal("3200.00")));
        Author bloch = new Author("Joshua Bloch");
        bloch.addBook(new Book("Effective Java", new BigDecimal("899.00")));
        bloch.addBook(new Book("Java Puzzlers", new BigDecimal("450.00")));
        authors.save(kleppmann);
        authors.save(bloch);
        em.flush();
        em.clear();
        return bloch;
    }

    @Test
    void cascadeSavesBooksAndTheForeignKeyIsSet() {
        seed();
        assertThat(books.count()).isEqualTo(3);
        Book ddia = books.findByTitleIgnoreCase("designing data-intensive applications").orElseThrow();
        assertThat(ddia.getAuthor().getName()).isEqualTo("Martin Kleppmann");
    }

    @Test
    void derivedQueriesWork() {
        Author bloch = seed();
        assertThat(books.findByAuthorName("Joshua Bloch")).hasSize(2);
        assertThat(books.findByPriceLessThanOrderByPriceAsc(new BigDecimal("1000"))).extracting(Book::getTitle)
                .containsExactly("Java Puzzlers", "Effective Java");
        assertThat(books.countByAuthorId(bloch.getId())).isEqualTo(2);
    }

    @Test
    void orphanRemovalDeletesABookRemovedFromTheCollection() {
        Author bloch = seed();
        Author managed = authors.findById(bloch.getId()).orElseThrow();
        managed.removeBook(managed.getBooks().get(0));
        em.flush();
        assertThat(books.count()).isEqualTo(2);
    }
}
```

**Common mapping mistakes.** Forgetting `mappedBy` (JPA creates an extra join table), updating only the inverse side (nothing is saved), `EAGER` everywhere (every query drags the whole graph), `CascadeType.ALL` on `@ManyToOne` (deleting a book would delete its author), and using `List` with `equals`/`hashCode` based on a generated id that is `null` before persisting.

<!-- exercise: d21_e2 | Medium | Measure the N+1 problem, then fix it twice -->
<!-- verify: compile -->
**Concepts:** lazy loading in a loop → 1 + N queries · Hibernate `Statistics` (`getPrepareStatementCount`) · `JOIN FETCH` in `@Query` · `@EntityGraph(attributePaths = …)`

**Task.** Three departments with two employees each are saved, then the persistence context is cleared. Add two repository methods so the test proves:

1. `findAll()` + touching `getEmployees()` in a loop runs **4** statements (1 + N).
2. `findAllWithEmployees()` (JPQL `JOIN FETCH`) runs **1**.
3. `findAllWithEntityGraph()` (`@EntityGraph`) runs **1**.

**Starter code**

```java
// src/main/java/com/example/practice/d21/nplusone/Department.java
package com.example.practice.d21.nplusone;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Department {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    @OneToMany(mappedBy = "department") private List<Employee> employees = new ArrayList<>();   // LAZY by default

    protected Department() { }
    public Department(String name) { this.name = name; }
    public String getName() { return name; }
    public List<Employee> getEmployees() { return employees; }
}
```

```java
// src/main/java/com/example/practice/d21/nplusone/Employee.java
package com.example.practice.d21.nplusone;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY) private Department department;

    protected Employee() { }
    public Employee(String name, Department department) { this.name = name; this.department = department; }
    public String getName() { return name; }
}
```

```java
// src/main/java/com/example/practice/d21/nplusone/DepartmentRepository.java
package com.example.practice.d21.nplusone;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findAllWithEmployees();      // TODO: @Query with JOIN FETCH
    List<Department> findAllWithEntityGraph();    // TODO: @EntityGraph + @Query
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d21/nplusone/NPlusOneTest.java
package com.example.practice.d21.nplusone;

import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class NPlusOneTest {

    @Autowired TestEntityManager em;
    @Autowired DepartmentRepository departments;
    @Autowired EntityManagerFactory emf;
    Statistics stats;

    @BeforeEach
    void seed() {
        for (String name : List.of("Engineering", "Sales", "HR")) {
            Department d = em.persist(new Department(name));
            em.persist(new Employee(name + "-1", d));
            em.persist(new Employee(name + "-2", d));
        }
        em.flush();
        em.clear();
        stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
    }

    int employeesTouched(List<Department> list) {
        return list.stream().mapToInt(d -> d.getEmployees().size()).sum();   // triggers lazy loading
    }

    @Test
    void lazyLoadingInALoopIsOnePlusN() {
        assertThat(employeesTouched(departments.findAll())).isEqualTo(6);
        assertThat(stats.getPrepareStatementCount()).isEqualTo(4);          // 1 for departments + 3 for employees
    }

    @Test
    void joinFetchLoadsEverythingInOneQuery() {
        assertThat(employeesTouched(departments.findAllWithEmployees())).isEqualTo(6);
        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }

    @Test
    void entityGraphLoadsEverythingInOneQuery() {
        assertThat(employeesTouched(departments.findAllWithEntityGraph())).isEqualTo(6);
        assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
    }
}
```

**Expected result**

```text
NPlusOneTest: 3 tests passed
```

<!-- hints -->
- `@Query("select distinct d from Department d left join fetch d.employees")` — `left` keeps departments with no employees; `distinct` avoids duplicate parents (Hibernate 6+ de-duplicates automatically, but it documents intent).
- `@EntityGraph(attributePaths = "employees")` on a method with `@Query("select d from Department d")` tells Hibernate to fetch the association in the same query.
- Turn on `spring.jpa.show-sql=true` and watch the console: you'll literally see the 3 extra `select … from employee where department_id=?` statements.
- Don't JOIN FETCH two collections (bags) in one query — Hibernate throws `MultipleBagFetchException`, and even with sets it creates a cartesian product. Use `@BatchSize` or separate queries for the second collection.

<!-- solution -->
```java
// src/main/java/com/example/practice/d21/nplusone/DepartmentRepository.java
package com.example.practice.d21.nplusone;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    @Query("select distinct d from Department d left join fetch d.employees")
    List<Department> findAllWithEmployees();                       // one SQL with a JOIN

    @EntityGraph(attributePaths = "employees")
    @Query("select d from Department d")
    List<Department> findAllWithEntityGraph();                     // same result, declared as a fetch plan
}
```

**Picking a fix.** `JOIN FETCH` — explicit and per-query, best when one use case needs the children. `@EntityGraph` — the same, without writing JPQL joins. `@BatchSize(size = 50)` / `hibernate.default_batch_fetch_size` — keeps lazy loading but loads children for up to 50 parents per query (1 + N/50): a good global safety net. DTO projections — fetch only the columns a screen needs, avoiding entities altogether. Never "fix" N+1 with `FetchType.EAGER`.

<!-- exercise: d21_e3 | Medium | Pagination, projections and custom queries -->
<!-- verify: compile -->
**Concepts:** `Page<T>` + `PageRequest` + `Sort` · interface-based projection · DTO (record) projection with a JPQL constructor expression · `@Query(nativeQuery = true)` with a named parameter

**Task.** Products are seeded in two categories. Add repository methods for:

1. A page of a category, sorted by price descending.
2. An **interface projection** `ProductSummary` (name + price only) for products in a category with stock above a threshold.
3. A **record projection** `CategoryStats(category, count, avgPrice)` grouped by category via `select new …`.
4. A **native** SQL count of products with stock below a threshold.

**Starter code**

```java
// src/main/java/com/example/practice/d21/paging/Product.java
package com.example.practice.d21.paging;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    private String category;
    private BigDecimal price;
    private int stock;

    protected Product() { }
    public Product(String name, String category, BigDecimal price, int stock) {
        this.name = name; this.category = category; this.price = price; this.stock = stock;
    }
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
}
```

```java
// src/main/java/com/example/practice/d21/paging/ProductSummary.java
package com.example.practice.d21.paging;

import java.math.BigDecimal;

public interface ProductSummary {
    String getName();
    // TODO: add the price getter — only these two columns should be selected
}
```

```java
// src/main/java/com/example/practice/d21/paging/CategoryStats.java
package com.example.practice.d21.paging;

public record CategoryStats(String category, Long count, Double avgPrice) { }
```

```java
// src/main/java/com/example/practice/d21/paging/ProductRepository.java
package com.example.practice.d21.paging;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategory(String category, Pageable pageable);
    List<ProductSummary> findByCategoryAndStockGreaterThan(String category, int stock);
    List<CategoryStats> categoryStats();      // TODO: @Query with "select new ...CategoryStats(...)"
    long countLowStock(int threshold);        // TODO: native @Query with :threshold
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d21/paging/ProductQueriesTest.java
package com.example.practice.d21.paging;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ProductQueriesTest {

    @Autowired ProductRepository repo;

    @BeforeEach
    void seed() {
        for (int i = 1; i <= 10; i++) repo.save(new Product("book-" + i, "books", BigDecimal.valueOf(i * 100L), i));
        for (int i = 1; i <= 15; i++) repo.save(new Product("pen-" + i, "pens", BigDecimal.valueOf(i * 10L), i % 5));
        repo.flush();
    }

    @Test
    void pagesThroughACategorySortedByPrice() {
        Page<Product> page = repo.findByCategory("pens", PageRequest.of(1, 6, Sort.by("price").descending()));
        assertThat(page.getTotalElements()).isEqualTo(15);
        assertThat(page.getTotalPages()).isEqualTo(3);
        assertThat(page.getContent()).hasSize(6);
        assertThat(page.getContent().get(0).getName()).isEqualTo("pen-9");
    }

    @Test
    void interfaceProjectionReturnsOnlyNameAndPrice() {
        List<ProductSummary> rich = repo.findByCategoryAndStockGreaterThan("books", 7);
        assertThat(rich).extracting(ProductSummary::getName).containsExactlyInAnyOrder("book-8", "book-9", "book-10");
    }

    @Test
    void recordProjectionAggregatesPerCategory() {
        assertThat(repo.categoryStats()).containsExactly(
                new CategoryStats("books", 10L, 550.0),
                new CategoryStats("pens", 15L, 80.0));
    }

    @Test
    void nativeQueryCountsLowStock() {
        assertThat(repo.countLowStock(2)).isEqualTo(7);    // books: stock 1; pens: stock 0 or 1
    }
}
```

**Expected result**

```text
ProductQueriesTest: 4 tests passed
```

<!-- hints -->
- Page index is **zero-based**: page 1 with size 6 skips the 6 most expensive pens (150…100) and starts at `pen-9` (90).
- An interface projection is just getters named like entity properties: `String getName(); BigDecimal getPrice();` — Spring Data selects only those columns.
- Constructor expressions need the **fully-qualified** class name: `select new com.example.practice.d21.paging.CategoryStats(p.category, count(p), avg(p.price)) from Product p group by p.category order by p.category`. `count` returns `Long` and `avg` returns `Double`, which is why the record uses wrapper types.
- Native query: `@Query(value = "select count(*) from products where stock < :threshold", nativeQuery = true)` with `@Param("threshold")` on the parameter.
- For "infinite scroll" without a count query, return `Slice<T>`; for very deep pages prefer keyset pagination (`where id > :lastSeen order by id limit …`).

<!-- solution -->
```java
// src/main/java/com/example/practice/d21/paging/ProductSummary.java
package com.example.practice.d21.paging;

import java.math.BigDecimal;

public interface ProductSummary {           // closed projection: only these columns are selected
    String getName();
    BigDecimal getPrice();
}
```

```java
// src/main/java/com/example/practice/d21/paging/ProductRepository.java
package com.example.practice.d21.paging;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByCategory(String category, Pageable pageable);                 // + a count query

    List<ProductSummary> findByCategoryAndStockGreaterThan(String category, int stock);

    @Query("""
            select new com.example.practice.d21.paging.CategoryStats(p.category, count(p), avg(p.price))
            from Product p
            group by p.category
            order by p.category""")
    List<CategoryStats> categoryStats();

    @Query(value = "select count(*) from products where stock < :threshold", nativeQuery = true)
    long countLowStock(@Param("threshold") int threshold);
}
```

**JPQL vs native SQL.** JPQL works on entities and is portable across databases; native SQL unlocks database features (window functions, `JSONB`, `ON CONFLICT`) but ties you to one vendor and bypasses some entity mapping. Use projections for read-heavy screens — loading full entities just to show three columns wastes memory and dirty-checking time.
