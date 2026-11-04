// Usage: node scripts/check-practice.js [interview|beginner] [day | from-to]
// Code exercises (practice/day-NN.md, practice/beginner/day-NN.md, and with no arguments practice/frontend/module-NN.md).
// Needs a JDK (javac + java) on the PATH.
// - Every exercise has an id for its day, a level, a title, hints and a solution.
// - Java exercises: the starter compiles (or must NOT compile, with <!-- verify: starter-broken -->), every solution
//   block compiles, and the first one runs (stdin from **Sample input**) and prints exactly the **Expected output**.
//   (A **Sample output** instead means the output varies, so it's only run.)
// - JavaScript exercises: the starter parses, and the first solution block runs with Node and prints exactly the
//   **Expected output**. DOM exercises (an html block with a script) need a browser, so their scripts only have to parse;
//   React exercises (a page loading React from a CDN, JSX compiled by Babel in the browser) are checked for that shape.
// - SQL and Spring exercises are only checked for structure here; check-sql.py and check-spring.js run them.
// - Every exercise a Beginner day lists exists, and every Beginner exercise is listed by some day.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { root, TRACKS, practiceFile, frontendPracticeFile, fileOfExercise, loadData, exercises, exerciseKind, parseArgs } = require("./lib");

const { tracks, daysOf } = parseArgs();
let failures = 0, count = 0, skipped = 0;
const fail = (msg) => { failures++; console.log(`✗ ${msg}`); };

const javaBlocks = (md) => [...md.matchAll(/```java\r?\n([\s\S]*?)```/g)].map(m => m[1]);
const className = (src) => (src.match(/public\s+(?:final\s+)?class\s+(\w+)/) || src.match(/^(?:final\s+)?class\s+(\w+)/m) || [])[1];
const textBlock = (body, label) => (body.match(new RegExp(`\\*\\*${label}\\*\\*[^\\n]*(?:\\r?\\n)+\`\`\`text\\r?\\n([\\s\\S]*?)\`\`\``)) || [])[1];
const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map(l => l.trimEnd()).join("\n").trim();

function compile(src, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${className(src)}.java`);
  fs.writeFileSync(f, src);
  return spawnSync("javac", ["-d", dir, "-Xlint:none", f], { encoding: "utf8" });
}

function checkJava(ex, tmp) {
  const problems = [];
  const broken = /<!--\s*verify:\s*starter-broken\s*-->/.test(ex.task);
  const starter = javaBlocks(ex.task)[0];
  if (!starter) problems.push("no starter java block");
  else {
    const r = compile(starter, path.join(tmp, "starter"));
    if (broken && r.status === 0) problems.push("starter should NOT compile");
    if (!broken && r.status !== 0) problems.push(`starter does not compile:\n${r.stderr}`);
  }
  const sols = javaBlocks(ex.solution);
  if (!sols.length) return [...problems, "no solution java block"];
  sols.slice(1).forEach((src, k) => {
    const r = compile(src, path.join(tmp, `extra${k}`));
    if (r.status !== 0) problems.push(`solution block ${k + 2} does not compile:\n${r.stderr}`);
  });
  const dir = path.join(tmp, "solution");
  const c = compile(sols[0], dir);
  if (c.status !== 0) return [...problems, `solution does not compile:\n${c.stderr}`];
  const r = spawnSync("java", ["-cp", dir, className(sols[0])], { encoding: "utf8", timeout: 60000, input: textBlock(ex.body, "Sample input") || "" });
  if (r.status !== 0) problems.push(`solution failed (exit ${r.status}):\n${r.stderr}`);
  const expected = textBlock(ex.body, "Expected output");
  if (expected !== undefined) {
    if (norm(r.stdout || "") !== norm(expected)) problems.push(`output differs\n--- expected\n${norm(expected)}\n--- actual\n${norm(r.stdout || "")}`);
  } else if (!/\*\*Sample output\*\*/.test(ex.body)) problems.push("no **Expected output**");
  return problems;
}

// JavaScript exercises: the starter parses, the first solution block runs with Node and prints exactly the
// **Expected output**. Solutions run as ES modules, so top-level await works.
const jsBlocks = (md) => [...md.matchAll(/```(?:js|javascript)\r?\n([\s\S]*?)```/g)].map(m => m[1]);
const scriptsIn = (md) => [...md.matchAll(/```html\r?\n([\s\S]*?)```/g)]
  .flatMap(m => [...m[1].matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(s => s[1]));

function nodeCheck(src, file) {
  fs.writeFileSync(file, src);
  return spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
}

function checkJs(ex, tmp) {
  const problems = [];
  const broken = /<!--\s*verify:\s*starter-broken\s*-->/.test(ex.task);
  const starter = jsBlocks(ex.task)[0];
  if (!starter) problems.push("no starter js block");
  else {
    const r = nodeCheck(starter, path.join(tmp, "starter.mjs"));
    if (broken && r.status === 0) problems.push("starter should NOT parse");
    if (!broken && r.status !== 0) problems.push(`starter doesn't parse:\n${r.stderr}`);
  }
  const sols = jsBlocks(ex.solution);
  if (!sols.length) return [...problems, "no solution js block"];
  const file = path.join(tmp, "solution.mjs");
  fs.writeFileSync(file, sols[0]);
  const r = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: 20000 });
  if (r.status !== 0) problems.push(`solution failed (exit ${r.status}):\n${r.stderr}`);
  const expected = textBlock(ex.body, "Expected output");
  if (expected !== undefined) {
    if (norm(r.stdout || "") !== norm(expected)) problems.push(`output differs\n--- expected\n${norm(expected)}\n--- actual\n${norm(r.stdout || "")}`);
  } else if (!/\*\*Sample output\*\*/.test(ex.body)) problems.push("no **Expected output**");
  return problems;
}

// DOM exercises are a page with a script, so they need a browser: here every script in the starter and the
// solution must at least parse
function checkDom(ex, tmp) {
  const problems = [];
  const starter = scriptsIn(ex.task), solution = scriptsIn(ex.solution);
  if (!starter.length) problems.push("no starter html block with a script");
  if (!solution.length) problems.push("no solution html block with a script");
  [...starter.map(s => ["starter", s]), ...solution.map(s => ["solution", s])].forEach(([which, src], k) => {
    const r = nodeCheck(src, path.join(tmp, `${which}${k}.js`));
    if (r.status !== 0) problems.push(`${which} script doesn't parse:\n${r.stderr}`);
  });
  return problems;
}

// React exercises are a page that loads React from a CDN through an import map and compiles JSX with Babel in
// the browser. Without a browser, check the page's shape: a valid import map, Babel, and a JSX script.
function checkReact(ex) {
  const problems = [];
  for (const [which, md] of [["starter", ex.task], ["solution", ex.solution]]) {
    const html = (md.match(/```html\r?\n([\s\S]*?)```/) || [])[1];
    if (!html) { problems.push(`no ${which} html block`); continue; }
    const map = (html.match(/<script type="importmap">([\s\S]*?)<\/script>/) || [])[1];
    try { if (!JSON.parse(map).imports?.react) problems.push(`${which}: the import map has no "react"`); }
    catch { problems.push(`${which}: missing or invalid import map`); }
    if (!/@babel\/standalone@[\d.]+\//.test(html)) problems.push(`${which}: no pinned @babel/standalone script`);
    if (!/<script type="text\/babel" data-type="module"/.test(html)) problems.push(`${which}: no <script type="text/babel" data-type="module">`);
    if (!/createRoot\(/.test(html)) problems.push(`${which}: never renders (no createRoot)`);
  }
  return problems;
}

const CHECKERS = { java: checkJava, js: checkJs, dom: checkDom, react: checkReact };

function checkExercise(ex, label, idPattern, ids) {
  count++;
  const problems = [];
  if (!idPattern.test(ex.id)) problems.push(`bad id ${ex.id} (expected ${idPattern.source.replace(/[\\^$]/g, "").replace("d+", "N")})`);
  if (ids.has(ex.id)) problems.push("duplicate id");
  ids.add(ex.id);
  if (!["Easy", "Medium", "Hard"].includes(ex.level)) problems.push(`bad level "${ex.level}"`);
  if (!ex.title) problems.push("no title");
  if (!ex.hasHints || !ex.solution.trim()) problems.push("missing <!-- hints --> or <!-- solution --> marker");
  else if (!ex.hints.split(/\r?\n/).some(l => /^\s*[-*]\s+/.test(l))) problems.push("no hints");

  const kind = exerciseKind(ex.task);
  const checker = CHECKERS[kind];
  if (checker) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "practice-"));
    try { problems.push(...checker(ex, tmp)); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }
  if (kind !== "java" && kind !== "js") skipped++;
  const note = { java: "", js: "(js) ", dom: "(dom: scripts parse) ", react: "(react: page structure) " }[kind] ?? `(${kind}: structure only) `;
  if (problems.length) fail(`${label} ${ex.id}: ${problems.join("\n  ")}`);
  else console.log(`✓ ${label} ${ex.id} ${note}${ex.level} · ${ex.title}`);
}

for (const track of tracks) {
  const { prefix, name } = TRACKS[track];
  let files = 0;
  for (const day of daysOf(track)) {
    const file = practiceFile(track, day);
    if (!fs.existsSync(file)) continue;   // not every day has its own exercises
    files++;
    const list = exercises(fs.readFileSync(file, "utf8"));
    if (!list.length) fail(`${name} Day ${day}: no exercises in ${path.relative(root, file)}`);
    const ids = new Set();
    for (const ex of list) checkExercise(ex, `${name} Day ${day}`, new RegExp(`^${prefix}${day}_e\\d+$`), ids);
  }
  console.log(`${name}: ${files} practice files\n`);
}

// Frontend modules (practice/frontend/module-NN.md), checked when no track is named. A module's `practice`
// list in data-frontend.js must name exactly the exercises in its file (the Beginner track shows them on the
// module's last day, and the module page shows them in both tracks).
const frontend = loadData().frontend;
if (!process.argv[2]) {
  let files = 0;
  for (const m of frontend) {
    const file = frontendPracticeFile(m.module);
    const listed = m.practice || [];
    if (!fs.existsSync(file)) {
      if (listed.length) fail(`Frontend ${m.module}: lists ${listed.join(", ")}, but ${path.relative(root, file)} doesn't exist`);
      continue;
    }
    files++;
    const list = exercises(fs.readFileSync(file, "utf8"));
    if (!list.length) fail(`Frontend ${m.module}: no exercises in ${path.relative(root, file)}`);
    const ids = new Set();
    for (const ex of list) checkExercise(ex, `Frontend ${m.module}`, new RegExp(`^f${m.module}_e\\d+$`), ids);
    const inFile = list.map(ex => ex.id);
    if (inFile.join() !== listed.join()) fail(`Frontend ${m.module}: data-frontend.js lists [${listed.join(", ")}] but the file has [${inFile.join(", ")}]`);
  }
  console.log(`Frontend: ${files} practice files\n`);
}

// The Beginner days' practice lists against the files (all of them, whatever days were asked for)
if (tracks.includes("beginner")) {
  const listed = new Map();
  loadData().beginner.forEach((d, i) => (d.practice || []).forEach(id => {
    if (listed.has(id)) fail(`Beginner Day ${i + 1} lists ${id}, already listed by Day ${listed.get(id)}`);
    listed.set(id, i + 1);
    const file = fileOfExercise(id);
    if (!file || !fs.existsSync(file) || !exercises(fs.readFileSync(file, "utf8")).some(ex => ex.id === id)) fail(`Beginner Day ${i + 1} lists ${id}, which doesn't exist`);
  }));
  for (let day = 1; day <= TRACKS.beginner.days; day++) {
    const file = practiceFile("beginner", day);
    if (!fs.existsSync(file)) continue;
    exercises(fs.readFileSync(file, "utf8")).filter(ex => !listed.has(ex.id)).forEach(ex => fail(`${ex.id} isn't listed by any Beginner day, so nobody sees it`));
  }
}

console.log(`${count} exercises (${skipped} SQL/Spring/DOM/React checked for structure only), ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
