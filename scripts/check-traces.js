// Usage: node scripts/check-traces.js
// Code visualizer recordings (visualize/traces/<Name>.json, made by scripts/trace-programs.js):
// - every program in visualize/programs has a recording, and every recording has its program;
// - the recording was made from the program as it is now (re-run trace-programs.js after editing one);
// - it has a @title, it finished (no step limit hit, no exception), and it has steps;
// - @pointers / @window / @cell name an array and variables that really appear in the recording;
// - @expect matches what the program printed, and @leetcode names problems in the question sets (it needs an @expect);
// - visualize/index.js is up to date with the recordings.
const fs = require("fs");
const path = require("path");
const { root, visualizerIndex, questionSlugs } = require("./lib");

const programs = path.join(root, "visualize", "programs");
const traces = path.join(root, "visualize", "traces");
const KNOWN = new Set(["title", "start", "maxSteps", "hide", "pointers", "window", "cell", "leetcode", "expect"]);
const slugs = questionSlugs();
let failures = 0;
const fail = (name, msg) => { failures++; console.log(`✗ ${name}: ${msg}`); };

const sources = fs.existsSync(programs) ? fs.readdirSync(programs).filter(f => f.endsWith(".java")).map(f => f.slice(0, -5)) : [];
const recorded = fs.existsSync(traces) ? fs.readdirSync(traces).filter(f => f.endsWith(".json")).map(f => f.slice(0, -5)) : [];
recorded.filter(n => !sources.includes(n)).forEach(n => fail(n, "recording without a program (delete it)"));

for (const name of sources.sort()) {
  const file = path.join(traces, `${name}.json`);
  if (!fs.existsSync(file)) { fail(name, "no recording: run node scripts/trace-programs.js " + name); continue; }
  const t = JSON.parse(fs.readFileSync(file, "utf8"));
  const code = fs.readFileSync(path.join(programs, `${name}.java`), "utf8").replace(/\r\n/g, "\n");
  const problems = [];
  if (t.code !== code) problems.push("out of date: the program changed since it was recorded (run node scripts/trace-programs.js " + name + ")");
  if (!t.meta.title) problems.push("no // @title");
  Object.keys(t.meta).filter(k => !KNOWN.has(k)).forEach(k => problems.push(`unknown setting @${k}`));
  if (!t.steps.length) problems.push("no steps recorded (does @start name a method that runs?)");
  if (t.truncated) problems.push("hit the step limit: use a smaller input or raise @maxSteps");
  const ex = t.steps.find(s => s.exception);
  if (ex) problems.push(`the program threw ${ex.exception}`);
  const printed = (t.steps.length ? t.steps[t.steps.length - 1].out : "").trim();
  if (t.meta.expect !== undefined && printed !== t.meta.expect) problems.push(`printed ${JSON.stringify(printed)}, but @expect is ${JSON.stringify(t.meta.expect)}`);
  for (const slug of (t.meta.leetcode || "").split(/\s+/).filter(Boolean)) {
    if (!slugs.has(slug)) problems.push(`@leetcode ${slug} isn't a problem in question-sets.js`);
  }
  if (t.meta.leetcode && t.meta.expect === undefined) problems.push("@leetcode needs an @expect with the problem's example answer");

  // Every name any frame ever shows, to check @pointers / @window against
  const names = new Set(t.steps.flatMap(s => s.frames.flatMap(f => f.locals.map(([n]) => n))));
  for (const key of ["pointers", "window", "cell"]) {
    if (!t.meta[key]) continue;
    const m = t.meta[key].match(/^(\w+):\s*(.+)$/);
    if (!m) { problems.push(`@${key} should look like "array: a b"`); continue; }
    if (!names.has(m[1])) problems.push(`@${key}: no variable "${m[1]}" in the recording`);
    const vars = key === "pointers" ? m[2].split(/\s+/) : m[2].match(/[A-Za-z_]\w*/g) || [];
    vars.filter(v => !names.has(v)).forEach(v => problems.push(`@${key}: no variable "${v}" in the recording`));
    if (key !== "pointers" && m[2].trim().split(/\s+/).length !== 2) problems.push(`@${key} needs two parts, like "nums: left right" or "grid: r c"`);
  }
  if (problems.length) fail(name, problems.join("\n  "));
  else console.log(`✓ ${name}: ${t.steps.length} steps · ${t.meta.title}`);
}
const indexFile = path.join(root, "visualize", "index.js");
if (!fs.existsSync(indexFile) || fs.readFileSync(indexFile, "utf8").replace(/\r\n/g, "\n") !== visualizerIndex())
  fail("visualize/index.js", "out of date: run node scripts/trace-programs.js (it rewrites the index)");
console.log(failures ? `\n${failures} problem(s)` : `\nAll ${sources.length} recordings OK`);
process.exit(failures ? 1 : 0);
