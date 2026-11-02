Joins and subqueries. Run each exercise's **Setup** block first (a fresh database or playground for each exercise is easiest).

<!-- exercise: b48_e1 | Easy | Customers and orders with joins -->
**Concepts:** `INNER JOIN` · `LEFT JOIN` · aliases · `COALESCE` · finding rows with no match

**Task.**

1. Every order with its customer's name, by order id.
2. How much each customer has spent and how many orders they placed, **including customers with no orders** (spent 0), biggest spender first.
3. Customers who have **never** ordered.

**Setup** · run this first

```sql
CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    city VARCHAR(50)
);

CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total       INTEGER NOT NULL,
    ordered_on  DATE NOT NULL
);

INSERT INTO customers (id, name, city) VALUES
    (1, 'Asha', 'Pune'),
    (2, 'Ravi', 'Delhi'),
    (3, 'Meera', 'Pune'),
    (4, 'Kabir', 'Mumbai');

INSERT INTO orders (id, customer_id, total, ordered_on) VALUES
    (101, 1, 500, '2026-01-05'),
    (102, 1, 1200, '2026-01-20'),
    (103, 2, 300, '2026-02-02'),
    (104, 3, 800, '2026-02-10'),
    (105, 1, 250, '2026-03-01');
```

**Starter**

```sql
-- 1. Orders with customer names
-- 2. Spending per customer, including customers with no orders
-- 3. Customers who never ordered
```

**Expected output**

```text
id | name | total
101 | Asha | 500
102 | Asha | 1200
103 | Ravi | 300
104 | Meera | 800
105 | Asha | 250

name | spent | orders
Asha | 1950 | 3
Meera | 800 | 1
Ravi | 300 | 1
Kabir | 0 | 0

name
Kabir
```

<!-- hints -->
- Query 1: `FROM orders o JOIN customers c ON o.customer_id = c.id`.
- Query 2 must keep Kabir, so start from `customers` and `LEFT JOIN orders`. `SUM` of no rows is `NULL`; `COALESCE(SUM(o.total), 0)` turns it into 0. Count orders with `COUNT(o.id)` (it skips `NULL`s), not `COUNT(*)`.
- Query 3: the same `LEFT JOIN`, keeping rows where the order side is missing: `WHERE o.id IS NULL`.

<!-- solution -->
```sql
-- 1. Orders with customer names
SELECT o.id, c.name, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.id;

-- 2. Spending per customer, including customers with no orders
SELECT c.name, COALESCE(SUM(o.total), 0) AS spent, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC, c.name;

-- 3. Customers who never ordered
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

With an inner `JOIN` in query 2, Kabir would vanish entirely. `COUNT(o.id)` counts only real orders, while `COUNT(*)` would count Kabir's single all-`NULL` row as 1. The "LEFT JOIN … WHERE right side IS NULL" pattern in query 3 is the standard way to find things with no match.

<!-- exercise: b48_e2 | Medium | Salaries: subqueries, CTEs, self-join and CASE -->
**Concepts:** subquery · CTE with `WITH` · self-join · `CASE`

**Task.**

1. The **second highest** salary in the company.
2. Employees who earn **more than their department's average**, highest first (use a CTE).
3. Every employee with their manager's name (`-` if they have none), by id.
4. How many people are in each salary band: `high` (100000+), `mid` (70000–99999), `entry` (below), biggest band first, ties alphabetically.

**Setup** · run this first

```sql
CREATE TABLE employees (
    id         INTEGER PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    dept       VARCHAR(50) NOT NULL,
    salary     INTEGER NOT NULL,
    manager_id INTEGER REFERENCES employees(id)
);

INSERT INTO employees (id, name, dept, salary, manager_id) VALUES
    (1, 'Nisha', 'Engineering', 150000, NULL),
    (2, 'Asha', 'Engineering', 120000, 1),
    (3, 'Ravi', 'Engineering', 90000, 1),
    (4, 'Meera', 'Sales', 80000, NULL),
    (5, 'Kabir', 'Sales', 60000, 4),
    (6, 'Zoya', 'Sales', 60000, 4),
    (7, 'Dev', 'HR', 70000, NULL);
```

**Starter**

```sql
-- 1. Second highest salary
-- 2. Above their department's average (CTE)
-- 3. Employee and manager (self-join)
-- 4. People per salary band (CASE)
```

**Expected output**

```text
second_highest
120000

name | dept | salary
Nisha | Engineering | 150000
Meera | Sales | 80000

employee | manager
Nisha | -
Asha | Nisha
Ravi | Nisha
Meera | -
Kabir | Meera
Zoya | Meera
Dev | -

band | people
mid | 3
entry | 2
high | 2
```

<!-- hints -->
- Query 1: the highest salary that is **less than** the maximum: `WHERE salary < (SELECT MAX(salary) FROM employees)`.
- Query 2: `WITH dept_avg AS (SELECT dept, AVG(salary) AS avg_salary FROM employees GROUP BY dept)`, then join employees to it on `dept`.
- Query 3: join the table to itself: `employees e LEFT JOIN employees m ON e.manager_id = m.id`. `LEFT` keeps the people without a manager; `COALESCE(m.name, '-')` fills the gap.
- Query 4: `CASE WHEN salary >= 100000 THEN 'high' WHEN salary >= 70000 THEN 'mid' ELSE 'entry' END AS band`, then `GROUP BY band`.

<!-- solution -->
```sql
-- 1. Second highest salary
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- 2. Above their department's average (CTE)
WITH dept_avg AS (
    SELECT dept, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY dept
)
SELECT e.name, e.dept, e.salary
FROM employees e
JOIN dept_avg d ON e.dept = d.dept
WHERE e.salary > d.avg_salary
ORDER BY e.salary DESC;

-- 3. Employee and manager (self-join)
SELECT e.name AS employee, COALESCE(m.name, '-') AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY e.id;

-- 4. People per salary band (CASE)
SELECT CASE
           WHEN salary >= 100000 THEN 'high'
           WHEN salary >= 70000 THEN 'mid'
           ELSE 'entry'
       END AS band,
       COUNT(*) AS people
FROM employees
GROUP BY band
ORDER BY people DESC, band;
```

Asha earns exactly her department's average (120000), so `>` leaves her out. The second-highest query is a classic interview question; tomorrow you'll solve it **per department** with a window function, which this subquery approach can't easily do.
