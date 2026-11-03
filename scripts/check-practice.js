// Usage: node scripts/check-practice.js [interview|beginner] [day | from-to]
// Code exercises (practice/day-NN.md, practice/beginner/day-NN.md). Needs a JDK (javac + java) on the PATH.
// - Every exercise has an id for its day, a level, a title, hints and a solution.
// - Java exercises: the starter compiles (or must NOT compile, with <!-- verify: starter-broken -->), every solution
//   block compiles, and the first one runs (stdin from **Sample input**) and prints exactly the **Expected output**.
//   (A **Sample output** instead means the output varies, so it's only run.)
// - SQL and Spring exercises are only checked for structure here; check-sql.py and check-spring.js run them.
// - Every exercise a Beginner day lists exists, and every Beginner exercise is listed by some day.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { root, TRACKS, practiceFile, fileOfExercise, loadData, exercises, exerciseKind, parseArgs } = require("./lib");

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
    for (const ex of list) {
      count++;
      const problems = [];
      if (!new RegExp(`^${prefix}${day}_e\\d+$`).test(ex.id)) problems.push(`bad id ${ex.id} (expected ${prefix}${day}_eN)`);
      if (ids.has(ex.id)) problems.push("duplicate id");
      ids.add(ex.id);
      if (!["Easy", "Medium", "Hard"].includes(ex.level)) problems.push(`bad level "${ex.level}"`);
      if (!ex.title) problems.push("no title");
      if (!ex.hasHints || !ex.solution.trim()) problems.push("missing <!-- hints --> or <!-- solution --> marker");
      else if (!ex.hints.split(/\r?\n/).some(l => /^\s*[-*]\s+/.test(l))) problems.push("no hints");

      const kind = exerciseKind(ex.task);
      if (kind === "java") {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "practice-"));
        try { problems.push(...checkJava(ex, tmp)); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
      } else skipped++;
      if (problems.length) fail(`${name} Day ${day} ${ex.id}: ${problems.join("\n  ")}`);
      else console.log(`✓ ${name} Day ${day} ${ex.id} ${kind === "java" ? "" : `(${kind}: structure only) `}${ex.level} · ${ex.title}`);
    }
  }
  console.log(`${name}: ${files} practice files\n`);
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

console.log(`${count} exercises (${skipped} SQL/Spring checked for structure only), ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
