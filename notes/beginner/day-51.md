# Day 51 — Database Design, JDBC and NoSQL

> The bridge between Java and databases. Read each 🌱 **In simple words** box first; the 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** design tables without repeated data, connect Java to a database with plain JDBC (and see why frameworks exist), and know when a non-relational database fits better.

<!-- topic: b51_t1 -->
## 🗄️ Databases — Design & JDBC

<!-- intro: d39_t1_s5 -->
**Normalisation** means storing each fact **once**. If every order row repeats the customer's address, changing the address means updating hundreds of rows, and missing one leaves the data contradicting itself. The "normal forms" (1NF, 2NF, 3NF) are a checklist for spotting that repetition, and the fix is always the same: move the repeated facts into their own table and link it with a foreign key (Day 47). Sometimes you deliberately repeat data for speed (*denormalisation*), but only on purpose.

<!-- intro: d39_t1_s6 -->
Before creating tables, draw an **ER (entity–relationship) diagram**: boxes for things (users, orders, products, payments) and lines for how they relate (one-to-many, many-to-many). Practise on the e-commerce example below; you'll draw one for your project on Day 65.

<!-- subtopic: b51_t1_s3 -->
### JDBC: Java talks to a database

**JDBC** (Java Database Connectivity) is Java's built-in way to run SQL. Every database provides a **driver** (a JAR, added with Maven, Day 46) that speaks its protocol. The basic steps:

```java
import java.sql.*;

String url = "jdbc:postgresql://localhost:5432/practice";

try (Connection conn = DriverManager.getConnection(url, "postgres", "secret");      // 1. connect
     PreparedStatement stmt = conn.prepareStatement(
             "SELECT id, name, age FROM students WHERE city = ?")) {               // 2. prepare SQL with ? placeholders
    stmt.setString(1, "Pune");                                                      // 3. fill in the placeholders
    try (ResultSet rs = stmt.executeQuery()) {                                      // 4. run it
        while (rs.next()) {                                                         // 5. walk through the rows
            int id = rs.getInt("id");
            String name = rs.getString("name");
            System.out.println(id + " " + name);
        }
    }
}   // try-with-resources (Day 21) closes the statement and connection, even on errors
```

| JDBC class | Role |
|---|---|
| `Connection` | an open line to the database |
| `PreparedStatement` | one SQL statement with `?` placeholders |
| `ResultSet` | the rows that came back; `next()` moves to the next row |

Updates use `executeUpdate()`, which returns how many rows changed. Transactions (Day 50) map to `conn.setAutoCommit(false)`, then `conn.commit()` or `conn.rollback()`.

<details>
<summary>What are the three main JDBC objects?</summary>

Connection (the link to the database), PreparedStatement (the SQL to run) and ResultSet (the rows that came back).
</details>

<!-- subtopic: b51_t1_s4 -->
### SQL injection, and why frameworks exist

Never build SQL by joining strings with user input:

```java
String sql = "SELECT * FROM users WHERE name = '" + input + "'";   // ✗ NEVER
```

If a user types `' OR '1'='1`, the query becomes `... WHERE name = '' OR '1'='1'`, which matches **every** user. Worse inputs can delete tables. This is **SQL injection**, one of the most common and damaging security holes on the web.

**`PreparedStatement` prevents it**: the SQL with `?` placeholders is sent to the database first, and the values are sent separately, always treated as data, never as SQL. So `' OR '1'='1` is simply searched for as a strange name. Rule: **values always go through placeholders.**

Look back at the JDBC code: opening and closing connections, mapping each column to a field by hand, checked `SQLException`s everywhere. For a table with 20 columns and 10 queries, that's a lot of repetitive code. That's why frameworks exist:

- **Spring's `JdbcTemplate`** removes the boilerplate but you still write SQL.
- **JPA / Hibernate**, with **Spring Data JPA** on top (Day 58), maps whole objects to rows: `repository.save(student)` and `repository.findByCity("Pune")`, and writes the SQL for you.

Knowing JDBC means you understand what those frameworks do underneath, which is exactly what you need when something goes wrong.

<details>
<summary>How does PreparedStatement prevent SQL injection?</summary>

Values are sent separately from the SQL and always treated as data, so user input can never change the structure of the query.
</details>

<!-- topic: b51_t2 -->
## 🗄️ Databases — NoSQL

<!-- intro: d54_t1_s1 -->
Not all data fits neatly into tables. **NoSQL** databases store data in other shapes: **documents** (JSON-like records, MongoDB), **key-value** pairs (a giant fast HashMap, Redis or DynamoDB), **wide columns** (Cassandra, for huge write-heavy data) and **graphs** (Neo4j, for relationships like social networks).

<!-- intro: d54_t1_s2 -->
**MongoDB** stores **documents**: a whole order, with its items inside it, as one JSON-like record. There's no fixed schema, so two documents in the same collection can have different fields. That's flexible, but checking the data becomes your code's job.

<!-- intro: d54_t1_s3 -->
**DynamoDB** (Amazon's managed key-value/document database) finds items by a **partition key** (and optionally a sort key). It's built for huge scale with predictable speed, but you must design the table around the exact queries you'll run, because querying by anything else is expensive.

<!-- intro: d54_t1_s4 -->
How to choose: relational (SQL) when data is structured, related and correctness matters most (orders, payments, bookings: most backends). NoSQL when you need massive scale, a flexible shape, or super-fast simple lookups (sessions, caches, event logs). Big systems often use **both**, each for what it's best at.

<!-- topic: b51_t3 -->
## 🧮 DSA — DP Final Revision

Revision day for dynamic programming: re-solve Coin Change, House Robber, LIS, LCS, Edit Distance and Knapsack from memory (Days 36–38), then try Interleaving String and Distinct Subsequences, two more 2D-table problems. For each, say the meaning of `dp[i][j]` out loud before writing code.

## 📝 Day 51 Recap

1. What is normalisation? → **storing each fact once, splitting repeated data into linked tables**
2. What does an ER diagram show? → **entities (things) and the relationships between them**
3. What is JDBC? → **Java's built-in API for running SQL against a database through a driver**
4. JDBC object holding returned rows? → **ResultSet**
5. Move to the next row in a ResultSet? → **rs.next()**
6. What is SQL injection? → **user input changing a SQL query because it was joined into the SQL string**
7. How do you prevent SQL injection? → **use PreparedStatement placeholders for every value**
8. Why use JPA instead of plain JDBC? → **it maps objects to rows and removes repetitive code**
9. Four kinds of NoSQL database? → **document, key-value, wide-column, graph**
10. SQL or NoSQL for payments? → **SQL (relational): structured data where correctness matters most**
