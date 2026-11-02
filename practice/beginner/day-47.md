Your first SQL. Run the **Setup** block once in any SQL database (an online playground is fine), then write each query and compare your result with the expected one.

<!-- exercise: b47_e1 | Easy | Query a students table -->
**Concepts:** `SELECT` · `WHERE` · `ORDER BY` · `LIKE` · `IS NULL` · `COUNT` · `GROUP BY` · `HAVING`

**Task.** Write five queries:

1. Names and ages of students from **Pune**, youngest first.
2. Number of students in each city, the biggest city first (ties alphabetically).
3. Average age per city, rounded to 1 decimal, **only for cities with more than one student**, alphabetically.
4. Names of students with **no email**, alphabetically.
5. Names starting with **A**, alphabetically.

**Setup** · run this first

```sql
CREATE TABLE students (
    id    INTEGER PRIMARY KEY,
    name  VARCHAR(50) NOT NULL,
    city  VARCHAR(50),
    age   INTEGER,
    email VARCHAR(100)
);

INSERT INTO students (id, name, city, age, email) VALUES
    (1, 'Asha', 'Pune', 21, 'asha@mail.com'),
    (2, 'Ravi', 'Delhi', 23, NULL),
    (3, 'Meera', 'Pune', 22, 'meera@mail.com'),
    (4, 'Kabir', 'Mumbai', 24, 'kabir@mail.com'),
    (5, 'Zoya', 'Delhi', 20, 'zoya@mail.com'),
    (6, 'Arjun', 'Pune', 25, NULL),
    (7, 'Isha', 'Chennai', 22, 'isha@mail.com'),
    (8, 'Dev', 'Mumbai', 21, NULL);
```

**Starter**

```sql
-- 1. Pune students, youngest first
-- 2. Students per city
-- 3. Average age per city with more than one student
-- 4. Students without an email
-- 5. Names starting with A
```

**Expected output** (each result has its column names first)

```text
name | age
Asha | 21
Meera | 22
Arjun | 25

city | students
Pune | 3
Delhi | 2
Mumbai | 2
Chennai | 1

city | avg_age
Delhi | 21.5
Mumbai | 22.5
Pune | 22.7

name
Arjun
Dev
Ravi

name
Arjun
Asha
```

<!-- hints -->
- Query 1 needs `WHERE city = 'Pune'` and `ORDER BY age` (ascending is the default).
- Query 2: `GROUP BY city`, then sort by the count descending and then by city: `ORDER BY students DESC, city`.
- Query 3: filter **groups** with `HAVING COUNT(*) > 1`, and round with `ROUND(AVG(age), 1)`.
- Query 4: `IS NULL`, never `= NULL`. Query 5: `LIKE 'A%'`.

<!-- solution -->
```sql
-- 1. Pune students, youngest first
SELECT name, age
FROM students
WHERE city = 'Pune'
ORDER BY age;

-- 2. Students per city
SELECT city, COUNT(*) AS students
FROM students
GROUP BY city
ORDER BY students DESC, city;

-- 3. Average age per city with more than one student
SELECT city, ROUND(AVG(age), 1) AS avg_age
FROM students
GROUP BY city
HAVING COUNT(*) > 1
ORDER BY city;

-- 4. Students without an email
SELECT name
FROM students
WHERE email IS NULL
ORDER BY name;

-- 5. Names starting with A
SELECT name
FROM students
WHERE name LIKE 'A%'
ORDER BY name;
```

Chennai is missing from query 3 because `HAVING` removed its group (one student) **after** the averages were calculated, which `WHERE` can't do. Different databases may print numbers slightly differently (PostgreSQL shows `22.7`, others may show more digits without `ROUND`); the values are what matter.
