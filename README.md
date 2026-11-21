# Java Fullstack

A free, self-paced study tracker for becoming a Java backend developer. It runs entirely in the browser: notes, flashcards, code exercises, DSA question sets and progress tracking, with no sign-up and no server.

It has two separate courses, and you can switch between them at any time:

| Track | Length | For |
|---|---|---|
| 🌱 **Beginner** | 100 days | Someone who has never written code. Starts with "what is programming" and installing Java, and ends with a mock interview. |
| 🎯 **Interview** | 60 days | Developers who already know Java and want structured revision for backend interviews (roughly 2–3 years of experience). |

Each track keeps its own progress. Your streak, focus timer, daily goal and theme are shared.

## What's covered

**Beginner track (100 days)**

Days 1–83 follow the [Java + DSA study roadmap](notes/kunal/java_dsa_study_roadmap.md) of the Kunal Kushwaha playlist notes, and each day's study notes are those notes, shown unchanged (see [Kunal notes](#kunal-notes)):

One change from the roadmap: OOP and Java 8+ come straight after the array patterns, and recursion and backtracking follow them (the roadmap has recursion first). Topic numbers inside the notes, like 5.3, are still the roadmap's.

| Days | Roadmap part |
|---|---|
| 1–4 | Phase 1: Java foundations (Git, how programs run, JDK/JVM, first program, conditionals and loops, methods) |
| 5–11 | Phase 2: arrays, strings, linear and binary search, bits, maths (after Big-O basics) |
| 12–14 | Phase 3: sorting and complexity |
| 15–19 | Phase 4: array and string patterns (HashMap usage, two pointers, prefix sum, Kadane, sliding window, matrix) |
| 20–26 | Phase 5: OOP and core Java, ending with a Tic-Tac-Toe project |
| 27–32 | Phase 6: Java 8+ (generics, comparators, functional interfaces, streams, modern Java) and merge intervals |
| 33–40 | Phase 7: recursion and backtracking |
| 41–46 | Phase 8: linked lists, stacks, queues, hashing; alongside it SOLID, design patterns and multithreading |
| 47–54 | Phase 9: trees, heaps and tries; alongside it JVM internals and LLD practice |
| 55–56 | Phase 10: greedy and maths extras; JUnit, Maven and JDBC |
| 57–62 | Phase 11: graphs and union-find; Spring Boot parts 1–3 alongside |
| 63–68 | Phase 12: dynamic programming; Spring Boot parts 4–6 alongside |
| 69–80 | Spring Boot parts 7–18: SQL, data access, testing, security, production, deployment, a capstone, messaging, microservices, MongoDB |
| 81–83 | Phase 13: string algorithms, range queries, serialization/reflection/regex/`java.time` |
| 84–100 | Beyond the roadmap: AWS and Terraform, system design, revision, behavioral interviews, resume, a DSA mock and a final mock interview |

Its DSA question sets come from the roadmap's practice sheet: 431 problems in 49 pattern sets, each on the day that teaches its pattern. Frontend runs alongside from Day 13.

**Interview track (60 days, 8 phases):** Core Java, collections, Spring Boot, microservices/DevOps/LLD, Kafka, AWS, SQL and system design, and a final sprint, with daily DSA.

## Features

- **Daily checklist** for every day, with a "What I covered" / "What I missed" note box
- **Study notes** for every day, with diagrams (Mermaid) and syntax-highlighted code. In the Beginner track, Days 1–83 show the Kunal notes as they are (GitHub-style note boxes, working links between notes, which open in a reader); on the later days, sections shared with the Interview track open with an "🌱 In simple words" box, and advanced parts are folded into "🚀 Go deeper" panels
- **Code practice:** 170 exercises in the Beginner track and 110 in the Interview track (Java, SQL, Spring Boot, JavaScript and React; 32 of them are frontend exercises shared by both), each with starter code, step-by-step hints, a reference solution and the expected output or test result. An exercise solved in one track shows as solved in the other too, since the tracks share many exercises
- **Spaced revision:** ticked topics come back after 1, 3, 7, 21 and 45 days, plus flashcard decks built automatically from the notes
- **Frontend:** HTML and CSS essentials, JavaScript, TypeScript and React, up to frontend system design, machine coding and interview questions (29 modules plus a guided React project). In the Beginner track it runs alongside Java from Day 13; in the Interview track it's a separate section, by topic. Both tracks also have a **Frontend** page with every module, its checklist and its notes
- **DSA question sets:** each track has its own. Interview: curated LeetCode problems by topic. Beginner: the practice sheet's 431 problems by pattern, grouped by roadmap phase (260 on LeetCode, the rest linked to takeuforward). Every problem has a log (approach, complexity, attempts, "solve again")
- Dashboard with streaks, XP, levels and badges, a focus timer, global search (press `/`), light and dark themes, and a mobile layout
- **Export / import** of all progress as a JSON file
- **Works offline, and installs as an app** on a phone or computer (see below)

Progress is stored in your browser's `localStorage`. Clearing site data erases it, so use **Export** (sidebar) to keep a backup or move to another device.

## Offline, and as an app on your phone

The site is a Progressive Web App: a service worker (`sw.js`) keeps a copy of every file it loads, and `manifest.webmanifest` lets the browser install it like an app.

- **Offline:** the ☁ **Save for offline** button (sidebar, next to Export) saves everything at once: every day's notes and exercises in both tracks, the visualizer recordings and the code-highlighting libraries (about 360 files, around 11 MB). After that the whole site works with no connection. Online, it always loads the newest version and refreshes the saved copy as you go; click the button again now and then to refresh everything.
- **Android:** open the site in Chrome, tap ⋮ → **Add to Home screen** (or **Install app**). It opens full screen from its own icon, like any app, and saves everything for offline use the first time it starts. Your progress lives in that installed app's storage, so **Export** from the browser and **Import** in the app to move it across.
- **iPhone:** in Safari, Share → **Add to Home Screen**.
- **Desktop:** Chrome or Edge show an install icon in the address bar.

Offline saving needs `https` (or `localhost`), so it works on the deployed site and locally, but not on a plain `http://` address on your network.

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
data-beginner.js         Beginner track: days built from Kunal notes, new and borrowed subtopics (BEGINNER_DATA)
data-frontend.js         Frontend modules shared by both tracks (FRONTEND_DATA), and the Beginner days each one is on
question-sets.js         Interview DSA question sets (LeetCode problems by topic)
question-sets-beginner.js  Beginner DSA question sets, from the Kunal practice sheet (generated)
notes/day-NN.md          Interview study notes, one file per day
notes/kunal/             the Kunal Java, DSA and Spring Boot notes, copied unchanged (Beginner Days 1–83)
notes/beginner/day-NN.md Beginner study notes for Days 84–100
notes/frontend/module-NN.md  Frontend notes, one file per module
practice/day-NN.md       Interview exercises (Days 1–26)
practice/beginner/day-NN.md  Beginner exercises
practice/frontend/module-NN.md  JavaScript exercises for frontend modules
visualize/programs/*.java   programs for the code visualizer
visualize/traces/*.json     their step-by-step recordings (generated)
visualize/index.js          LeetCode slug → recording, for the Question Sets' buttons (generated)
favicon.svg, apple-touch-icon.png, og-image.png  icons and the link-preview image
icon-192.png, icon-512.png, icon-maskable-512.png  the installed app's icons
manifest.webmanifest     makes the site installable as an app
sw.js                    service worker: offline copies of every file
offline-files.json       everything "Save for offline" downloads (generated)
scripts/                 content checks, the visualizer's recorder, and the source of the preview image
vscode-extension/        Java Step Visualizer: the same visualizer for your own code, inside VS Code
```

## Content format

Everything the learner reads is Markdown, so content can be edited without touching the code.

### Ids are permanent

Subtopic ids (`d12_t1_s3`, `b45_t1_s2`) and exercise ids (`d20_e1`, `b47_e1`) are the keys for saved progress. Never rename or reuse them. If a subtopic moves to another day, it keeps its id, so the `dN` in an id is where it was first added, not necessarily the day it's on now.

### Kunal notes

`notes/kunal/` is a byte-for-byte copy of the Markdown notes in the Java_Notes_Kunal_DSA_PlayList folder (the playlist video notes, the Java and DSA "not covered" notes, the Spring Boot notes, the roadmap, the gap list and the practice sheet), with the same folder names so their links keep working. `.gitattributes` keeps git from changing their line endings. Don't edit them here: change them there, then copy them again and rebuild the question sets:

```bash
node scripts/sync-kunal-notes.js ../Java_Notes_Kunal_DSA_PlayList
node scripts/build-beginner-sets.js ../Java_Notes_Kunal_DSA_PlayList
```

A Beginner subtopic shows one of them with `k(key, label, part)` in `data-beginner.js`: `KUNAL_FILES` maps the roadmap's keys (`v24`, `g05`, `d02`, `t01`, `s07`…) to files, and the optional `part` (`[13, 26]`) shows only a note's `## 13.` to `## 26.` sections, for the notes the roadmap splits across phases. Its id is `k_<key>` (`k_<key>_<from>` for a part). The page renders the file as it is; the only additions are GitHub-style anchors on its headings, the `> [!NOTE]` / `[!TIP]` / … boxes, and links: one to a heading in the same note scrolls there, one to another note (or to a section a day doesn't show) opens it in a reader with Back. `check-notes.js` checks that every Kunal file, and every numbered section of a split one, is on some day.

`build-beginner-sets.js` reads the practice sheet's data (`web/practice-data.json` in that folder) and writes `question-sets-beginner.js`: one set per sheet section, each problem on the Beginner day whose subtopic label starts with its roadmap topic number (`2.5`, `11.9`…).

### The Beginner track's other days reuse Interview content

Days 84–100 list their subtopics as either a new one (`["b3_t1_s2", "label"]`), a borrowed Interview subtopic (`"d1_t1_s1"`), or a borrowed one with a simpler label (`["d1_t1_s1", "label"]`); `fromDay(N, i)` borrows a whole topic of Interview day N.

Their notes are put together per subtopic: from `notes/beginner/day-NN.md` when that file has the subtopic, otherwise from the Interview notes that cover it.

### Frontend modules

`data-frontend.js` lists 30 modules in six levels (HTML & CSS, JavaScript, TypeScript, React, Frontend engineering, Interview prep). Module 29 is a guided project, the Task Manager front end, with one step per React day; it's on the Frontend page but not on Beginner days, since the Spring project it builds on is no longer part of that track. Each module has subtopic ids `fN_sM` and the Beginner days it's spread over (`days`):

- **Beginner track:** `data-beginner.js` adds a "Frontend — module title" topic to each of those days, splitting the module's subtopics between them. The day's notes take those sections from the module's file, so frontend sections are never written in `notes/beginner/`.
- **Interview track:** the modules stay out of the 60 days. They live on the **Frontend** page, where ticked subtopics still count toward the Frontend subject, come back in Revise, and get their own flashcard decks.

A module's notes, `notes/frontend/module-NN.md`, have one `<!-- subtopic: fN_sM -->` section per subtopic, in order, then a `## 📝 Module N Recap`. Inside the sections use `###` and `####` headings only (a `##` would end a section early on a Beginner day); `#### 🚀` subsections are folded into "Go deeper" panels on Beginner days. A module without a file yet shows "being written" and its checklist.

### Notes markers

```markdown
<!-- topic: b13_t1 -->          start of a topic (beginner files number topics b<day>_t<n>)
## ☕ Java — Classes & Objects  (replaced by the track's topic name)

<!-- subtopic: b13_t1_s1 -->     a section for one checklist item; its ### heading gets a "Done" toggle
### Why object-oriented programming

<!-- intro: d1_t1_s1 -->         beginner files only: an "In simple words" box placed on top of a borrowed section

<!-- visualize: TwoSumSorted -->  after a code block: a "Step through this code" button for visualize/programs/TwoSumSorted.java
```

Flashcards are generated from the notes:

- every `<details><summary>Question</summary>` answer block becomes a card;
- every numbered line written as `1. Question → **answer**` becomes a card (each day ends with a recap of these).

Outside code blocks, put anything with angle brackets in backticks: a bare `List<Integer>` is read as an HTML tag and the `<Integer>` part disappears from the page.

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

An exercise id starts with its file key: `d20_e1` lives in `practice/day-20.md`, `b47_e1` in `practice/beginner/day-47.md`, `f10_e2` in `practice/frontend/module-10.md`. The practice tab shows a run tip for each kind of exercise a day has: Java, Spring Boot, SQL, JavaScript (a `js` starter block, run with Node) DOM (an `html` page with a script, opened in a browser), or React (an `html` page that loads React from a CDN through an import map and compiles JSX with Babel in the browser, so learners install nothing).

A frontend module lists its exercises in `practice` in `data-frontend.js`. They show on the module page in both tracks, on the module's last Beginner day, and on the Interview track's Code Practice page.

### Adding content

- **A new Interview practice file:** `PRACTICE_FILES` in `app.js` lists Interview days 1–26; extend it to include the new day.
- **A new Beginner exercise:** add its id to the day's `practice` list in `data-beginner.js`.
- **Beginner notes:** `BEGINNER_NOTE_FILES` in `app.js` lists which days have their own notes file (Days 84–100; the others show Kunal notes).

### Checking content

After editing notes or exercises, run the checks from the project folder:

```bash
node scripts/check-all.js
```

| Script | Checks | Needs |
| --- | --- | --- |
| `check-notes.js` | every subtopic has its section (frontend modules too, once their file exists), markers are valid, code fences are balanced, no text is lost to stray `<Tags>`; every Kunal note exists and is on a day | Node |
| `check-practice.js` | exercise format; Java and JavaScript solutions print exactly the expected output (DOM scripts must parse; React pages must have their import map, Babel and a render); Beginner and frontend `practice` lists match the files | Node, a JDK |
| `check-sql.py` | SQL solutions give exactly the expected result in SQLite | Python 3 |
| `check-spring.js` | Spring starters compile, their tests fail until solved, and the solutions pass them | Node, Maven (downloads Spring Boot the first time) |
| `check-traces.js` | every visualizer program has an up-to-date recording that finished cleanly, and its settings name real variables | Node |
| `build-offline-list.js --check` | `offline-files.json` lists every notes, exercise and recording file (run it without `--check` to update the list after adding or removing files) | Node |

`check-all.js` runs all but the Spring one; add `--spring` for the Spring builds, which take a few minutes. Each script also runs on its own and takes a track and days, for example `node scripts/check-practice.js beginner 20-30` or `python scripts/check-sql.py 47`.

### Code visualizer recordings

The visualizer replays a real run of a Java program, one step per line, like Python Tutor but recorded ahead of time so the site needs no server. Learners reach a recording three ways: the **Code Visualizer** page in the sidebar (every recording, grouped by question set, with search), a **Visualize** button on its LeetCode problem in the Question Sets, and a **Step through this code** button under the code in the notes.

Stepping one line forward or back animates the change (`visualizer.js`, "Motion"):
- pointers slide between cells, and swapped values fly across;
- the `@window` band stretches and slides;
- list and tree nodes glide to their new places;
- the code highlight moves to the next line.

The cells the next line reads or writes are outlined. Each array has a **History** of every change it went through, and clicking a change jumps to that step. Without a `@pointers` setting, the plain variables the code indexes an array with (`nums[i]`) are drawn as its pointers.

Each program in `visualize/programs/` is a complete class with a `main` that uses a small example input, usually the method from the notes plus their dry-run input. Settings go in comments at the top:

```java
// @title Two Sum II — sorted array (two pointers)
// @set two-pointers              the question set it's listed under on the Visualizer page (default: its @leetcode problem's set)
// @leetcode two-sum-ii-input-array-is-sorted   adds a Visualize button to that problem in the Question Sets
// @expect [1, 2]                 what the program must print (the problem's example answer); checked
// @start twoSum                  record from the first call of twoSum (skips building the input in main)
// @hide levelOrder               helper methods to run without recording (lambdas: all lambdas)
// @pointers numbers: left right  int variables that index into the array (or String) numbers
// @window nums: right-k+1 right  a range of the array (or String) to shade, both ends included
// @cell grid: r c                the cell of a 2D array to ring
// @maxSteps 1000                 step limit (the default)
```

A variable whose name contains "stack" (or a `java.util.Stack`) is drawn standing up, top first. Collections held in an object's fields, like `MinStack`'s two stacks, are drawn as `owner.field`. A class with `left` and `right` is drawn as a tree, one with `next` as a linked list, and one holding an array or map of children of its own class (a trie node, `Node[] next = new Node[26]`) as a trie, with each node's letter and a ring where a word ends.

After adding or editing a program, record it, then commit the `.json` files and `visualize/index.js` with it:

```bash
node scripts/trace-programs.js TwoSumSorted
```

With no name it records every program; after only adding or moving a `<!-- visualize: … -->` marker in the notes, `node scripts/trace-programs.js --index` rewrites the index (the page's "Day N notes" links) without re-recording. It needs a JDK 21 or newer, and nothing else: `scripts/tracer/Tracer.java` uses the JDK's own debugger interface (JDI) to run the program and save each step's line, variables, objects and output. One line is one step, so a loop written on a single line runs in one step. Keep the inputs small: a recording should stay well under the step limit.

### Link preview image

`og-image.png` (shown when the site's link is shared), `apple-touch-icon.png` and the app icons (`icon-*.png`) are rendered from `scripts/brand-images.html`. After changing that file, run `node scripts/render-images.js` (needs Chrome or Edge installed).

## VS Code extension

`vscode-extension/` is **Java Step Visualizer**: the site's visualizer for any Java file you write. It records your program with the same tracer, shows the run in a panel beside the editor, highlights the current line in the editor itself, and records again every time you save. It needs a JDK 17+ and nothing else. To build and install it:

```bash
node vscode-extension/package-vsix.js
```

```bash
code --install-extension vscode-extension/dist/java-step-visualizer-0.2.0.vsix
```

Then open a `.java` file and click ▶ in the editor's title bar. [vscode-extension/README.md](vscode-extension/README.md) covers the settings and how to work on it.

## Tech

Plain HTML, CSS and JavaScript with no framework and no build step. Libraries load from CDNs: [marked](https://marked.js.org) for Markdown, [Prism](https://prismjs.com) for code highlighting, and [Mermaid](https://mermaid.js.org) for diagrams (loaded only when a page has one).
