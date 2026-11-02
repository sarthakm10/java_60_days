# Day 50 — Indexes and Transactions

> Day 50: halfway through the track. 🎉 Read each 🌱 **In simple words** box first; the 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** make queries fast with indexes, read a query plan, and keep data correct with transactions.

<!-- topic: b50_t1 -->
## 🗄️ SQL — Performance & Transactions

<!-- intro: d53_t1_s1 -->
Without help, `WHERE email = 'asha@x.com'` makes the database read **every** row to find the match: fine for 100 rows, painful for 10 million. An **index** is like the index at the back of a book: a sorted list of values with page numbers, so the database jumps straight to the rows. `CREATE INDEX idx_students_email ON students(email);` The common kind is a **B-tree**, which keeps values sorted and so also speeds up ranges and `ORDER BY`. The catch: every index must be updated on every insert and update, so don't index everything.

<!-- intro: d53_t1_s2 -->
A **clustered** index decides the order the rows themselves are stored in (like a phone book sorted by name: the data *is* the index), so a table can have only one. A **non-clustered** index is a separate list pointing to the rows, like a book's index. Most of the time you just need to know that the primary key usually gets an index automatically.

<!-- intro: d53_t1_s3 -->
`EXPLAIN` (and `EXPLAIN ANALYZE`, which also runs the query) shows the **query plan**: how the database intends to find your rows. The key thing to spot: a **sequential scan** ("Seq Scan", reading the whole table) on a big table where you expected an **index scan**. That's usually a missing index.

<!-- intro: d53_t1_s4 -->
A **transaction** groups several changes into one all-or-nothing unit. Transferring ₹500 is two updates (take from Asha, add to Ravi); if the server crashes between them, money would vanish. Inside a transaction, either **both** happen (`COMMIT`) or **neither** does (`ROLLBACK`). The guarantees are called **ACID**: **A**tomic (all or nothing), **C**onsistent (rules always hold), **I**solated (concurrent transactions don't see each other's half-done work), **D**urable (once committed, it survives a crash).

<!-- intro: d53_t1_s5 -->
"Isolated" has levels, trading safety for speed. Weaker levels allow strange effects when two transactions run at once: reading another transaction's uncommitted change (*dirty read*), reading a row twice and getting different values, or new rows appearing in a repeated query. Most databases default to **READ COMMITTED**, which is fine for most work. You'll set this per method in Spring on Day 60, so this is the theory behind it.

<!-- intro: d53_t1_s6 -->
How can a database let thousands of people read and write at once without everyone waiting? PostgreSQL keeps several **versions** of a row (MVCC): readers see the last committed version while a writer works on a new one, so reads never block writes. It's a background detail; the name is the main thing to know.

<!-- intro: d53_t1_s7 -->
PostgreSQL extras worth knowing exist: `JSONB` columns store and query JSON inside the database, array columns, `pg_stat_activity` to see what's running right now, and partitioning very large tables. Skim this; you'll look things up when you need them.

👉 **Code Practice** today runs a money transfer inside a transaction, including one that's rolled back.

<!-- topic: b50_t2 -->
## 🧮 DSA — Graph & Tree Final Revision

Revision day for graphs and trees: implement Dijkstra (Day 42) and both topological sorts (Day 35) from memory, then two harder problems. Critical Connections finds the edges whose removal splits a network; Maximal Rectangle reuses Day 43's histogram trick on each row of a grid. Revision is where patterns become automatic.

## 📝 Day 50 Recap

1. What does an index do? → **lets the database jump to matching rows instead of scanning the whole table**
2. Cost of an index? → **extra work on every insert/update, plus storage**
3. Most common index type? → **B-tree**
4. How many clustered indexes can a table have? → **one**
5. What does EXPLAIN show? → **the query plan: how the database will find the rows**
6. Warning sign in a plan for a big table? → **a sequential scan where an index scan was expected**
7. What is a transaction? → **a group of changes that all succeed (COMMIT) or all fail (ROLLBACK)**
8. ACID stands for? → **Atomicity, Consistency, Isolation, Durability**
9. Common default isolation level? → **READ COMMITTED**
10. What is MVCC? → **keeping several row versions so readers don't block writers**
