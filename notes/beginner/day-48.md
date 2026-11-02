# Day 48 — SQL Joins, Subqueries and CTEs

> Read each 🌱 **In simple words** box first. The 🚀 **Go deeper** panels are for a second pass.

**Today's goal:** combine data from several tables with joins, put queries inside queries, and write readable multi-step queries with `WITH`.

<!-- topic: b48_t1 -->
## 🗄️ SQL — Joins & Subqueries

<!-- intro: d51_t1_s1 -->
Yesterday you split data into tables linked by foreign keys. A **JOIN** puts them back together for a query: "every order *with its customer's name*". You say which tables, and how their rows match:

```sql
SELECT o.id, c.name, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id;    -- match each order to its customer
```

`o` and `c` are short **aliases** for the table names. The two joins you'll use 95% of the time:

- **INNER JOIN** (plain `JOIN`): only rows that have a match on **both** sides. Customers with no orders don't appear.
- **LEFT JOIN**: **every** row from the left table, with the right side filled in where there's a match and `NULL` where there isn't. "All customers, and their orders if any." Add `WHERE o.id IS NULL` to find customers who never ordered.

RIGHT, FULL OUTER and CROSS joins are in the section below; the diagrams make them clear.

<!-- intro: d51_t1_s2 -->
A **self-join** joins a table to **itself**, with two different aliases. The classic case: an `employees` table where each row has a `manager_id` pointing at another employee. `FROM employees e JOIN employees m ON e.manager_id = m.id` gives each employee next to their manager's name.

<!-- intro: d51_t1_s3 -->
A **subquery** is a query inside another query, in brackets: "students older than the average age" is `WHERE age > (SELECT AVG(age) FROM students)`. The inner query runs first and its result is used by the outer one. `IN (SELECT ...)` checks membership in a list; `EXISTS (SELECT ...)` checks whether any matching row exists.

<!-- intro: d51_t1_s4 -->
A **CTE** (common table expression) gives a subquery a **name** at the top, with `WITH`, so a complicated query reads as steps, like breaking a long method into smaller ones:

```sql
WITH city_counts AS (
    SELECT city, COUNT(*) AS n FROM students GROUP BY city
)
SELECT city FROM city_counts WHERE n > 1;
```

**Recursive** CTEs can walk hierarchies like an org chart; that part can wait for a second pass.

<!-- intro: d51_t1_s6 -->
`CASE` is SQL's if/else (like Day 4's switch, inside a query): `CASE WHEN marks >= 75 THEN 'B' WHEN marks >= 40 THEN 'C' ELSE 'F' END AS grade`. You can use it in `SELECT`, `ORDER BY` and even inside aggregates to count only some rows.

<!-- intro: d51_t1_s7 -->
Three classic interview queries are worked through below: the Nth highest salary, records on consecutive days, and the top N per group. Try each one yourself before reading the answer, then check against **Code Practice**, which has the second-highest-salary question to run.

<!-- topic: b48_t2 -->
## 🧮 DSA — Mixed Practice

Mixed problems that don't say which pattern to use: recognising it is the skill. Alien Dictionary is a topological sort (Day 35) hidden in a word puzzle; Accounts Merge is Union-Find (Day 42); Surrounded Regions is a DFS that starts from the border. Before coding, write one line: "this is a ___ problem because ___".

## 📝 Day 48 Recap

1. What does a JOIN do? → **combines rows from two tables that match on a condition**
2. INNER vs LEFT JOIN? → **INNER keeps only matched rows; LEFT keeps every left row, with NULLs where nothing matches**
3. Customers who never ordered? → **LEFT JOIN orders and keep rows WHERE o.id IS NULL**
4. What is a table alias? → **a short name for a table in a query, e.g. orders o**
5. What is a self-join? → **joining a table to itself, e.g. employees to their managers**
6. Students older than average? → **WHERE age > (SELECT AVG(age) FROM students)**
7. What is a CTE? → **a named subquery defined with WITH at the start of a query**
8. SQL's if/else? → **CASE WHEN ... THEN ... ELSE ... END**
9. Where can CASE be used? → **in SELECT, ORDER BY and inside aggregates**
10. Key skill for mixed DSA problems? → **recognising which pattern fits before coding**
