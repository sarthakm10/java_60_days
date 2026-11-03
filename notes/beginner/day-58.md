# Day 58 — Spring Data JPA: Entities and Repositories

> Your API gets a real database today. Days 47–51's SQL meets Phase 2's objects. Read each 🌱 **In simple words** box first.

**Today's goal:** map Java classes to tables, save and load them with almost no code, and write queries just by naming methods.

<!-- topic: b58_t1 -->
## 🌿 Spring Data JPA — Basics

<!-- subtopic: b58_t1_s1 -->
### ORM, JPA, Hibernate and Spring Data

On Day 51 you wrote JDBC: SQL strings, `ResultSet`s and copying columns into fields by hand. An **ORM** (object-relational mapper) does that translation for you: a Java **class** ↔ a **table**, an **object** ↔ a **row**, a **field** ↔ a **column**.

Three names that come together, from bottom to top:

| Name | What it is |
|---|---|
| **JPA** (Jakarta Persistence API) | the **standard**: a set of annotations and interfaces (`@Entity`, `@Id`, `EntityManager`) |
| **Hibernate** | the most used **implementation** of JPA: the library that actually generates and runs the SQL |
| **Spring Data JPA** | a layer on top that writes your **repository classes** for you |

Add the **Spring Data JPA** starter and a database driver (PostgreSQL, or H2 for an in-memory database while learning), and tell Spring where the database is:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/practice
spring.datasource.username=postgres
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update     # create/update tables from your entities (for learning only)
spring.jpa.show-sql=true                 # print the SQL Hibernate runs: very educational
```

`ddl-auto=update` is handy while learning. Real projects create tables with migration scripts instead (Flyway, Day 60).

<details>
<summary>JPA vs Hibernate vs Spring Data JPA?</summary>

JPA is the standard (annotations and interfaces), Hibernate is the library that implements it and runs the SQL, and Spring Data JPA generates repositories on top of it.
</details>

<!-- intro: d21_t1_s1 -->
An **entity** is a class that maps to a table: mark it `@Entity`, mark the primary key `@Id`, and let the database choose ids with `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Each field becomes a column. `@Table(name = "...")` and `@Column(...)` let you change names and rules. Entities need a no-argument constructor (JPA creates objects through it).

<!-- intro: d21_t1_s7 -->
Declare an **interface** that extends `JpaRepository<Product, Long>` (the entity type and its id type), and Spring Data **writes the implementation for you** at startup: `save`, `findById`, `findAll`, `deleteById`, `count`, and paging. You never write the class. That interface is the repository layer from Day 55.

<!-- subtopic: b58_t1_s4 -->
### Queries from method names

Spring Data can also write queries **from the name of a method** you declare in the repository interface:

```java
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByCity(String city);                        // WHERE city = ?
    Optional<Student> findByEmail(String email);                  // one or none
    List<Student> findByAgeGreaterThan(int age);                  // WHERE age > ?
    List<Student> findByCityAndAgeLessThan(String city, int age); // WHERE city = ? AND age < ?
    List<Student> findByNameStartingWithIgnoreCase(String prefix);
    List<Student> findByCityOrderByNameAsc(String city);
    long countByCity(String city);
    boolean existsByEmail(String email);
}
```

The name is parsed into SQL: `findBy` + field names + keywords like `And`, `Or`, `GreaterThan`, `Between`, `Like`, `IgnoreCase`, `OrderBy`. A typo in a field name makes the app fail at **startup** with a clear message, which is good: you find out immediately.

When the name gets long and awkward, write the query yourself with `@Query` (next section).

<details>
<summary>What SQL does findByCityAndAgeGreaterThan(String city, int age) produce?</summary>

`... WHERE city = ? AND age > ?`, generated automatically from the method name.
</details>

<!-- intro: d21_t1_s5 -->
For queries a method name can't express, `@Query` lets you write them yourself. **JPQL** looks like SQL but uses **class and field names**, not table and column names (`SELECT s FROM Student s WHERE s.age > :age`), so it works on any database. Add `nativeQuery = true` to write real SQL for that specific database.

<!-- topic: b58_t2 -->
## 🧮 DSA — Weak Area Focus

Review your "What I Missed" notes and the problems you flagged **Solve again** on the Revise page, re-solve your five weakest, and practise explaining solutions aloud. One timed set (one easy, two medium in 60 minutes) to finish.

## 📝 Day 58 Recap

1. What does an ORM do? → **maps classes to tables and objects to rows so you work with objects instead of SQL**
2. Most common JPA implementation? → **Hibernate**
3. Mark a class as a table? → **@Entity**
4. Mark the primary key and let the database generate it? → **@Id with @GeneratedValue(strategy = GenerationType.IDENTITY)**
5. How do you get a repository with save/findById/findAll? → **an interface extending `JpaRepository<Entity, IdType>`**
6. Who writes the repository implementation? → **Spring Data, at startup**
7. Students in a city by method name? → **`List<Student> findByCity(String city)`**
8. When is a misspelled query method name detected? → **at application startup**
9. JPQL uses table names or class names? → **class and field names**
10. See the SQL Hibernate runs? → **spring.jpa.show-sql=true**
