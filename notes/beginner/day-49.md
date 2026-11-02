# Day 49 — SQL Window Functions

> The most tested SQL topic in interviews. They look strange at first; once they click, many "impossible" queries become one line.

**Today's goal:** rank rows within groups, compute running totals, and compare a row with the one before it, all without losing the individual rows.

<!-- topic: b49_t1 -->
## 🗄️ SQL — Window Functions

<!-- intro: d52_t1_s1 -->
`GROUP BY` (Day 47) squashes each group into **one** row: you get the department's average, but lose the employees. A **window function** calculates over a group of rows **while keeping every row**: each employee *and* their department's average side by side.

```sql
SELECT name, dept, salary,
       AVG(salary) OVER (PARTITION BY dept) AS dept_avg
FROM employees;
```

`OVER (...)` is what makes it a window function. Inside it, **`PARTITION BY`** says which rows belong together (like GROUP BY, without squashing), and **`ORDER BY`** says the order within each partition (needed for rankings and running totals).

<!-- intro: d52_t1_s2 -->
Three ways to number rows, which differ only on **ties**. For salaries 900, 800, 800, 700: `ROW_NUMBER()` gives 1, 2, 3, 4 (ties broken arbitrarily), `RANK()` gives 1, 2, 2, **4** (skips after a tie, like a race with two silver medals and no bronze) and `DENSE_RANK()` gives 1, 2, 2, **3** (no gaps). Pick by what "second highest" should mean when two people tie.

<!-- intro: d52_t1_s3 -->
`LAG(col)` reads the value from the **previous** row (in the window's order) and `LEAD(col)` from the **next** one. "How much did sales change since yesterday?" becomes `sales - LAG(sales) OVER (ORDER BY day)`. `FIRST_VALUE` and `LAST_VALUE` read the first and last values in the window.

<!-- intro: d52_t1_s4 -->
Normal aggregates become window functions with `OVER`, and a **frame** says which rows to include: `SUM(amount) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` is a 7-day moving total. Without a frame but with `ORDER BY`, the default is "from the start up to this row", which is a running total.

<!-- intro: d52_t1_s5 -->
The second highest salary **per department**: rank inside each department with `DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC)` in a CTE or subquery, then keep the rows where the rank is 2. You can't filter on a window function in the same query's `WHERE` (it's calculated after `WHERE`), which is why the extra step is needed.

<!-- intro: d52_t1_s6 -->
A running total: `SUM(amount) OVER (ORDER BY order_date)`. Each row shows the total of everything up to and including that date.

<!-- intro: d52_t1_s7 -->
Day-over-day change with `LAG`: put today's value next to yesterday's and subtract. The first row has no previous row, so `LAG` gives `NULL` there (or a default you pass as the third argument).

👉 **Code Practice** today has a ranking, a running total and a `LAG` query to run against a sample table.

<!-- topic: b49_t2 -->
## 🧮 DSA — Mixed Hard Practice

Three hard problems combining earlier patterns: Word Search II is Day 41's trie plus Day 44's grid backtracking; Binary Tree Maximum Path Sum is the "combine answers from both subtrees" idea from Day 25 with a global best; Wildcard Matching is 2D DP like Day 38. Stretch goals: attempt one, study the others.

## 📝 Day 49 Recap

1. Window function vs GROUP BY? → **a window function keeps every row; GROUP BY collapses each group to one row**
2. What makes a function a window function? → **the OVER (...) clause**
3. What does PARTITION BY do? → **splits rows into groups for the window, without collapsing them**
4. Ranks for 900, 800, 800, 700 with RANK()? → **1, 2, 2, 4**
5. ...and with DENSE_RANK()? → **1, 2, 2, 3**
6. Value from the previous row? → **LAG(column) OVER (ORDER BY ...)**
7. Running total? → **SUM(amount) OVER (ORDER BY date)**
8. Why can't you filter on a window function in WHERE? → **it's calculated after WHERE; use a CTE or subquery**
9. Second highest salary per department? → **DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) = 2 in an outer query**
10. What does LAG give on the first row? → **NULL (or the default you pass)**
