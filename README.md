# Java Fullstack

A free, self-paced study tracker for becoming a Java backend developer. It runs entirely in the browser: notes, flashcards, code exercises, DSA question sets and progress tracking, with no sign-up and no server.

It has two separate courses, and you can switch between them at any time:

| Track | Length | For |
|---|---|---|
| 🌱 **Beginner** | 100 days | Someone who has never written code. Starts with "what is programming" and installing Java, and ends with a mock interview. |
| 🎯 **Interview** | 60 days | Developers who already know Java and want structured revision for backend interviews (roughly 2–3 years of experience). |

Each track keeps its own progress. Your streak, focus timer, daily goal and theme are shared.

## What's covered

**Beginner track (100 days, 10 phases)**

1. Programming basics: setup, variables, operators, conditions, loops, methods, arrays, strings, debugging, Big-O, Git
2. Object-oriented Java: classes, encapsulation, inheritance, polymorphism, abstraction, exceptions, a library project
3. Generics and collections: ArrayList, LinkedList, HashMap (usage and internals), sets, queues, TreeMap, LRU cache
4. Modern Java: lambdas, streams, Optional, the Date/Time API, Java 10–21 features
5. Concurrency and the JVM: threads, synchronization, executors, concurrent collections, virtual threads, memory and GC
6. Backend foundations: HTTP/REST/JSON, Maven and unit testing, SQL (joins, window functions, indexes, transactions), JDBC, NoSQL
7. Spring Boot: dependency injection, REST APIs, validation, testing, Spring Data JPA, transactions, security with JWT, Actuator, and a three-day Task Manager API project
8. Design: SOLID, design patterns, low-level design (machine coding)
9. Deploy and scale: Docker, microservices, Kafka, Kubernetes and CI/CD, AWS, Terraform
10. System design and interview prep: system design fundamentals and practice, revision, behavioral interviews, resume, a final mock interview

DSA practice runs alongside, introduced after the Java concept each pattern needs.

**Interview track (60 days, 8 phases):** Core Java, collections, Spring Boot, microservices/DevOps/LLD, Kafka, AWS, SQL and system design, and a final sprint, with daily DSA.

## Features

- **Daily checklist** for every day, with a "What I covered" / "What I missed" note box
- **Study notes** for every day, with diagrams (Mermaid) and syntax-highlighted code. In the Beginner track, sections shared with the Interview track open with an "🌱 In simple words" box, and advanced parts are folded into "🚀 Go deeper" panels
- **Code practice:** 138 exercises in the Beginner track and 78 in the Interview track (Java, SQL and Spring Boot), each with starter code, step-by-step hints, a reference solution and the expected output or test result
- **Spaced revision:** ticked topics come back after 1, 3, 7, 21 and 45 days, plus flashcard decks built automatically from the notes
- **DSA question sets:** curated LeetCode problems by topic, with a per-problem log (approach, complexity, attempts, "solve again")
- Dashboard with streaks, XP, levels and badges, a focus timer, global search (press `/`), light and dark themes, and a mobile layout
- **Export / import** of all progress as a JSON file

Progress is stored in your browser's `localStorage`. Clearing site data erases it, so use **Export** (sidebar) to keep a backup or move to another device.

## Run it locally

It's a static site, but the notes and exercises are loaded with `fetch`, so it must be served over HTTP (opening `app.html` directly won't load them). From the project folder:

```bash
npx serve .
```

or

```bash
python -m http.server 8000
```

then open the address it prints (for example `http://localhost:8000`). That's the landing page; the tracker itself is `app.html`, and `app.html?track=beginner` or `app.html?track=interview` opens it on that track. The VS Code "Live Server" extension works too. There's no build step and nothing to install beyond that.

The live site is deployed as a static site on Vercel from the `main` branch.

## Project structure

```text
index.html               landing page (home)
landing.css, landing.js  landing page styles and animations
app.html                 the tracker app's page layout
app.js                   all application logic (tracks, rendering, progress, revision, practice, search)
styles.css               styles, including light/dark themes and the mobile layout
data.js                  Interview track: days, topics and subtopics (CURRICULUM_DATA)
data-beginner.js         Beginner track: days built from new and borrowed subtopics (BEGINNER_DATA)
question-sets.js         DSA question sets (LeetCode problems by topic)
notes/day-NN.md          Interview study notes, one file per day
notes/beginner/day-NN.md Beginner study notes, one file per day
practice/day-NN.md       Interview exercises (Days 1–26)
practice/beginner/day-NN.md  Beginner exercises
```

## Content format

Everything the learner reads is Markdown, so content can be edited without touching the code.

### Ids are permanent

Subtopic ids (`d12_t1_s3`, `b45_t1_s2`) and exercise ids (`d20_e1`, `b47_e1`) are the keys for saved progress. Never rename or reuse them. If a subtopic moves to another day, it keeps its id, so the `dN` in an id is where it was first added, not necessarily the day it's on now.

### The Beginner track reuses Interview content

A Beginner day in `data-beginner.js` lists its subtopics as either a new one (`["b3_t1_s2", "label"]`), a borrowed Interview subtopic (`"d1_t1_s1"`), or a borrowed one with a simpler label (`["d1_t1_s1", "label"]`). `dsa(N)` borrows Interview day N's whole DSA topic, together with its question sets.

A Beginner day's notes are put together per subtopic: from `notes/beginner/day-NN.md` when that file has the subtopic, otherwise from the Interview notes that cover it.

### Notes markers

```markdown
<!-- topic: b13_t1 -->          start of a topic (beginner files number topics b<day>_t<n>)
## ☕ Java — Classes & Objects  (replaced by the track's topic name)

<!-- subtopic: b13_t1_s1 -->     a section for one checklist item; its ### heading gets a "Done" toggle
### Why object-oriented programming

<!-- intro: d1_t1_s1 -->         beginner files only: an "In simple words" box placed on top of a borrowed section
```

Flashcards are generated from the notes:

- every `<details><summary>Question</summary>` answer block becomes a card;
- every numbered line written as `1. Question → **answer**` becomes a card (each day ends with a recap of these).

In the Beginner track, every `#### 🚀 …` subsection of a borrowed section is folded into a closed "Go deeper" panel.

### Exercise format

```markdown
<!-- exercise: b5_e2 | Medium | Star patterns -->
**Task.** … starter code (a java/sql block, or Spring files whose first line is `// src/...`) …
**Expected output** (or **Sample input** + **Expected output**, or **Expected result** for Spring tests)
<!-- hints -->
- one hint per line
<!-- solution -->
… the reference solution and why it works …
```

An exercise id starts with its file key: `d20_e1` lives in `practice/day-20.md`, `b47_e1` in `practice/beginner/day-47.md`. The practice tab shows a Java, SQL or Spring Boot run tip depending on what a day's exercises contain.

### Adding content

- **A new Interview practice file:** `PRACTICE_FILES` in `app.js` lists Interview days 1–26; extend it to include the new day.
- **A new Beginner exercise:** add its id to the day's `practice` list in `data-beginner.js`.
- **Beginner notes:** `BEGINNER_NOTE_FILES` in `app.js` lists which days have their own notes file (currently all 100).

## Tech

Plain HTML, CSS and JavaScript with no framework and no build step. Libraries load from CDNs: [marked](https://marked.js.org) for Markdown, [Prism](https://prismjs.com) for code highlighting, and [Mermaid](https://mermaid.js.org) for diagrams (loaded only when a page has one).
