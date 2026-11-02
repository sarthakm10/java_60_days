Window functions. Run the **Setup** block first.

<!-- exercise: b49_e1 | Medium | Rankings, second highest per department, running totals -->
**Concepts:** `DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)` · filtering on a window result with a CTE · `SUM() OVER` · `LAG`

**Task.**

1. Rank employees **within their department** by salary (highest = 1, ties share a rank, no gaps), ordered by department, rank and name.
2. The **second highest** paid employee(s) in each department.
3. For daily sales: each day's amount, the running total, and the change from the previous day.

**Setup** · run this first

```sql
CREATE TABLE employees (
    id     INTEGER PRIMARY KEY,
    name   VARCHAR(50) NOT NULL,
    dept   VARCHAR(50) NOT NULL,
    salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, dept, salary) VALUES
    (1, 'Nisha', 'Engineering', 150000),
    (2, 'Asha', 'Engineering', 120000),
    (3, 'Ravi', 'Engineering', 90000),
    (4, 'Meera', 'Sales', 80000),
    (5, 'Kabir', 'Sales', 60000),
    (6, 'Zoya', 'Sales', 60000),
    (7, 'Dev', 'HR', 70000);

CREATE TABLE sales (
    day    DATE PRIMARY KEY,
    amount INTEGER NOT NULL
);

INSERT INTO sales (day, amount) VALUES
    ('2026-03-01', 100),
    ('2026-03-02', 150),
    ('2026-03-03', 120),
    ('2026-03-04', 200);
```

**Starter**

```sql
-- 1. Rank within department
-- 2. Second highest per department
-- 3. Running total and day-over-day change
```

**Expected output**

```text
name | dept | salary | rnk
Nisha | Engineering | 150000 | 1
Asha | Engineering | 120000 | 2
Ravi | Engineering | 90000 | 3
Dev | HR | 70000 | 1
Meera | Sales | 80000 | 1
Kabir | Sales | 60000 | 2
Zoya | Sales | 60000 | 2

dept | name | salary
Engineering | Asha | 120000
Sales | Kabir | 60000
Sales | Zoya | 60000

day | amount | running_total | diff
2026-03-01 | 100 | 100 | NULL
2026-03-02 | 150 | 250 | 50
2026-03-03 | 120 | 370 | -30
2026-03-04 | 200 | 570 | 80
```

<!-- hints -->
- Query 1: `DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk`. `PARTITION BY` restarts the ranking for each department.
- Query 2: you can't use a window function in `WHERE`, so compute the rank in a CTE first, then `WHERE rnk = 2` in the outer query. HR has only one person, so it has no second.
- Query 3: `SUM(amount) OVER (ORDER BY day)` is a running total; `amount - LAG(amount) OVER (ORDER BY day)` is the change. The first day has no previous day, so its change is `NULL`.

<!-- solution -->
```sql
-- 1. Rank within department
SELECT name, dept, salary,
       DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
FROM employees
ORDER BY dept, rnk, name;

-- 2. Second highest per department
WITH ranked AS (
    SELECT name, dept, salary,
           DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
    FROM employees
)
SELECT dept, name, salary
FROM ranked
WHERE rnk = 2
ORDER BY dept, name;

-- 3. Running total and day-over-day change
SELECT day, amount,
       SUM(amount) OVER (ORDER BY day) AS running_total,
       amount - LAG(amount) OVER (ORDER BY day) AS diff
FROM sales
ORDER BY day;
```

With `RANK()` instead of `DENSE_RANK()` the Sales ranks would still be 1, 2, 2 (the gap would only show for a fourth person), but with `ROW_NUMBER()` Kabir and Zoya would get 2 and 3, and query 2 would wrongly return only one of them. Choosing the right ranking function for ties is exactly what interviewers check.
