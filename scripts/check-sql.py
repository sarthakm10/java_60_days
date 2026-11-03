"""Usage: python scripts/check-sql.py [day | from-to]

Beginner SQL exercises (a task containing a ```sql block) in practice/beginner/day-NN.md. Needs only Python 3.
Runs the task's first ```sql block (the setup) in a fresh in-memory SQLite database, then every statement of
the solution's ```sql block. Each SELECT/WITH result is printed as a header line plus rows joined by " | ",
results separated by blank lines, and must match the exercise's **Expected output** exactly.
"""
import re
import sqlite3
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")   # the ✓/✗ marks, also on a Windows console
ROOT = Path(__file__).resolve().parent.parent
SQL_BLOCK = re.compile(r"```sql\r?\n(.*?)```", re.S)
EXPECTED = re.compile(r"\*\*Expected output\*\*[^\n]*\n+```text\r?\n(.*?)```", re.S)


def day_range(args):
    if not args:
        return range(1, 101)
    m = re.fullmatch(r"(\d+)(?:-(\d+))?", args[0])
    if not m:
        sys.exit(f'Unknown argument "{args[0]}". Usage: [day | from-to]')
    return range(int(m[1]), int(m[2] or m[1]) + 1)


def statements(sql):
    no_comments = "\n".join(line for line in sql.splitlines() if not line.strip().startswith("--"))
    return [s.strip() for s in no_comments.split(";") if s.strip()]


def fmt(value):
    return "NULL" if value is None else str(value)


def norm(text):
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").split("\n")).strip()


def run(setup, solution):
    db = sqlite3.connect(":memory:", isolation_level=None)   # autocommit, so explicit BEGIN/COMMIT/ROLLBACK work
    for s in statements(setup):
        db.execute(s)
    results = []
    for s in statements(solution):
        cur = db.execute(s)
        if re.match(r"(SELECT|WITH)\b", s, re.I):
            lines = [" | ".join(d[0] for d in cur.description)]
            lines += [" | ".join(fmt(v) for v in row) for row in cur.fetchall()]
            results.append("\n".join(lines))
    return "\n\n".join(results)


failures = count = 0
for day in day_range(sys.argv[1:]):
    path = ROOT / "practice" / "beginner" / f"day-{day:02d}.md"
    if not path.exists():
        continue
    parts = re.split(r"^<!--\s*exercise:\s*(.+?)\s*-->\s*$", path.read_text(encoding="utf-8"), flags=re.M)
    for i in range(1, len(parts), 2):
        ex_id, body = parts[i].split("|")[0].strip(), parts[i + 1]
        task = re.split(r"^<!--\s*hints\s*-->\s*$", body, maxsplit=1, flags=re.M)[0]
        if not SQL_BLOCK.search(task):
            continue
        count += 1
        problems = []
        solution = re.split(r"^<!--\s*solution\s*-->\s*$", body, maxsplit=1, flags=re.M)
        expected = EXPECTED.search(body)
        if len(solution) < 2 or not SQL_BLOCK.search(solution[1]):
            problems.append("no solution ```sql block")
        elif not expected:
            problems.append("no **Expected output**")
        else:
            try:
                actual = run(SQL_BLOCK.search(task).group(1), SQL_BLOCK.search(solution[1]).group(1))
                if norm(actual) != norm(expected.group(1)):
                    problems.append(f"output differs\n--- expected\n{norm(expected.group(1))}\n--- actual\n{norm(actual)}")
            except sqlite3.Error as e:
                problems.append(f"SQL error: {e}")
        if problems:
            failures += 1
            print(f"✗ Beginner Day {day} {ex_id}: " + "\n  ".join(problems))
        else:
            print(f"✓ Beginner Day {day} {ex_id} (sql)")

print(f"\n{count} SQL exercises, {failures} with problems")
sys.exit(1 if failures else 0)
