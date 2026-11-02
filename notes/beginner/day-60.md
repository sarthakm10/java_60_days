# Day 60 — Transactions and Database Migrations

> Day 50's transactions, now in Spring. A heavy topic, so no DSA today. Read each 🌱 **In simple words** box first.

**Today's goal:** make service methods all-or-nothing with `@Transactional`, know its traps, handle two users editing the same row, and manage your database schema with migration scripts.

<!-- topic: b60_t1 -->
## 🌿 Spring — Transactions & Hibernate

<!-- intro: d22_t1_s1 -->
Put **`@Transactional`** on a service method, and everything it does to the database happens in **one transaction**: if the method finishes, all changes are committed; if it throws a runtime exception, all are rolled back. A money transfer becomes safe with one annotation. It works through a **proxy** (Day 44): Spring wraps your bean, starts the transaction, calls your method, then commits or rolls back. That's why calling a `@Transactional` method from **another method in the same class** silently skips the transaction: the call never goes through the proxy. And by default, checked exceptions do **not** cause a rollback.

<!-- intro: d22_t1_s2 -->
If a transactional method calls another transactional method, should they share one transaction? **Propagation** decides. `REQUIRED` (the default) joins the existing one; `REQUIRES_NEW` pauses it and starts a separate one (use it for an audit log that must be saved even if the main work fails). Most of the time the default is right.

<!-- intro: d22_t1_s3 -->
Day 50's isolation levels, set per method: `@Transactional(isolation = Isolation.SERIALIZABLE)`. The default (the database's own, usually READ COMMITTED) is fine for most work. Read the table of anomalies once, so the names are familiar in interviews.

<!-- intro: d22_t1_s4 -->
Two people open the same product, both change the stock, both save: the second save silently overwrites the first (a *lost update*). **Optimistic locking** adds a `@Version` field: every save checks the version hasn't changed since you loaded the row, and fails with an exception if it has, so you can retry or tell the user. **Pessimistic locking** locks the row while you work on it (safer for heavy contention, slower).

<!-- intro: d22_t1_s5 -->
Inside a transaction, entities loaded by JPA are **managed**: change a field, and Hibernate saves it automatically when the transaction commits, without you calling `save`. That surprises everyone the first time. The section shows the states an entity goes through (new, managed, detached, removed).

<!-- intro: d22_t1_s6 -->
Hibernate remembers entities it has already loaded **within a transaction** (the first-level cache), so asking for the same id twice runs only one query. A second-level cache shared across transactions exists too, but needs extra setup; and caching in general is Day 92's topic.

<!-- intro: d22_t1_s7 -->
`ddl-auto=update` (Day 58) is fine for learning, but in a real project you need to know **exactly** what changes, in order, on every database. **Flyway** runs numbered SQL scripts (`V1__create_products.sql`, `V2__add_stock_column.sql`) once each, in order, and records which ones have run. Your schema is versioned in Git alongside your code. You'll use it in the project on Day 65.

👉 **Code Practice** covers rollback rules and the self-invocation trap, propagation, and optimistic locking.

## 📝 Day 60 Recap

1. What does @Transactional do? → **runs the method in one transaction: commit on success, rollback on a runtime exception**
2. How does @Transactional work underneath? → **through a proxy that wraps the bean**
3. Why does calling a @Transactional method from the same class skip the transaction? → **the call doesn't go through the proxy**
4. Do checked exceptions roll back by default? → **no, only runtime exceptions and errors**
5. Default propagation? → **REQUIRED: join the existing transaction or start one**
6. When use REQUIRES_NEW? → **for work that must commit separately, e.g. an audit log**
7. What does @Version enable? → **optimistic locking: a save fails if someone else changed the row**
8. What is a managed entity? → **one loaded inside a transaction, whose changes are saved automatically on commit**
9. What does Flyway do? → **runs numbered SQL migration scripts once each, in order, and tracks them**
10. Flyway file name for the first migration? → **V1__description.sql**
