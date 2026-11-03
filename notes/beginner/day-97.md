# Day 97 — Revision: SQL and System Design

> The last technical revision day. SQL queries on paper, and the system design concepts you'll be asked to explain.

**Today's goal:** write the classic SQL queries without notes and explain the core system design ideas clearly.

<!-- topic: b97_t1 -->
## 🏗️ SQL & System Design — Review

Work through the checklist as a mock interview:

1. **SQL on paper** (Days 47–49): the second highest salary, a running total, a day-over-day comparison with `LAG`. Write them without notes, then check against your Day 48–49 exercises.
2. **Indexes** (Day 50): how a B-tree index speeds up queries, why the order of columns in a composite index matters, and how to read an `EXPLAIN` plan.
3. **CAP with examples** (Day 92): which systems choose consistency, which availability, and why.
4. **Caching strategies** (Day 92): cache-aside vs write-through, with Redis, and how you'd invalidate.
5. **Consistent hashing** (Day 93): the ring, and why virtual nodes help.
6. **Transactions** (Days 50 and 60): isolation levels, MVCC, optimistic vs pessimistic locking.

If any answer takes you more than a minute to start, mark it for one more pass on Day 99.

## 📝 Day 97 Recap

1. Second highest salary? → **MAX(salary) WHERE salary < (SELECT MAX(salary) ...), or DENSE_RANK() = 2**
2. Running total in SQL? → **SUM(amount) OVER (ORDER BY date)**
3. Compare with the previous row? → **LAG(column) OVER (ORDER BY ...)**
4. Why does column order matter in a composite index? → **the index can only be used from its leftmost columns**
5. What does EXPLAIN reveal? → **whether the database uses an index or scans the whole table**
6. CAP choice for a bank? → **consistency**
7. Cache-aside? → **check the cache; on a miss read the database and fill the cache**
8. Consistent hashing benefit? → **adding or removing a server moves only nearby keys**
9. Optimistic vs pessimistic locking? → **detect conflicts at save time (@Version) vs lock the row while working**
10. Default isolation level in most databases? → **READ COMMITTED**
