Transactions. Run the **Setup** block first. Some online playgrounds run every statement in its own transaction; a local PostgreSQL (`psql`) or SQLite shows this best.

<!-- exercise: b50_e1 | Easy | A money transfer, committed and rolled back -->
**Concepts:** `BEGIN` · `COMMIT` · `ROLLBACK` · atomicity

**Task.** Asha sends Ravi 300 inside a transaction and commits it. Then start a second transaction that takes 5000 from Asha (more than she has), notice the problem, and **roll it back**. Show the balances after each transaction, and the total money in the bank at the end (it must never change).

**Setup** · run this first

```sql
CREATE TABLE accounts (
    id      INTEGER PRIMARY KEY,
    owner   VARCHAR(50) NOT NULL,
    balance INTEGER NOT NULL
);

INSERT INTO accounts (id, owner, balance) VALUES
    (1, 'Asha', 1000),
    (2, 'Ravi', 500);
```

**Starter**

```sql
-- Transaction 1: Asha sends Ravi 300, then COMMIT
-- Show the balances
-- Transaction 2: take 5000 from Asha, then ROLLBACK instead of committing
-- Show the balances again, and the total of all balances
```

**Expected output**

```text
owner | balance
Asha | 700
Ravi | 800

owner | balance
Asha | 700
Ravi | 800

total
1500
```

<!-- hints -->
- A transaction is `BEGIN;` … your statements … `COMMIT;` (keep the changes) or `ROLLBACK;` (undo all of them).
- The transfer is two `UPDATE`s: subtract from Asha (`WHERE id = 1`), add to Ravi (`WHERE id = 2`). Both must succeed or neither.
- After `ROLLBACK`, the balances are exactly as they were at the last `COMMIT`.

<!-- solution -->
```sql
-- Transaction 1: Asha sends Ravi 300
BEGIN;
UPDATE accounts SET balance = balance - 300 WHERE id = 1;
UPDATE accounts SET balance = balance + 300 WHERE id = 2;
COMMIT;

SELECT owner, balance FROM accounts ORDER BY id;

-- Transaction 2: Asha can't afford 5000, so undo it
BEGIN;
UPDATE accounts SET balance = balance - 5000 WHERE id = 1;
ROLLBACK;

SELECT owner, balance FROM accounts ORDER BY id;
SELECT SUM(balance) AS total FROM accounts;
```

Inside transaction 2, Asha's balance really was −4300 for a moment, but only that transaction could see it, and `ROLLBACK` threw it away. In a real app the check ("is the balance enough?") lives in your service, and Spring's `@Transactional` (Day 60) does the `BEGIN` / `COMMIT` / `ROLLBACK` for you: an exception means rollback. A `CHECK (balance >= 0)` constraint on the column is a good extra safety net in the database itself.
