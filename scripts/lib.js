// Shared helpers for the check scripts: where things live, loading the curriculum data,
// splitting practice files into exercises, and the [track] [days] command-line arguments.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const pad = (n) => String(n).padStart(2, "0");

const TRACKS = {
  interview: { name: "Interview", days: 60, notes: "notes", practice: "practice", prefix: "d" },
  beginner: { name: "Beginner", days: 100, notes: path.join("notes", "beginner"), practice: path.join("practice", "beginner"), prefix: "b" },
};

const notesFile = (track, day) => path.join(root, TRACKS[track].notes, `day-${pad(day)}.md`);
const practiceFile = (track, day) => path.join(root, TRACKS[track].practice, `day-${pad(day)}.md`);

// Exercise id → its practice file: dN_eM lives in practice/day-NN.md, bN_eM in practice/beginner/day-NN.md
function fileOfExercise(id) {
  const m = id.match(/^([db])(\d+)_e\d+$/);
  return m && practiceFile(m[1] === "b" ? "beginner" : "interview", +m[2]);
}

// Runs data.js and data-beginner.js the way the browser does and returns both tracks' days
function loadData() {
  const ctx = {};
  vm.createContext(ctx);
  const src = ["data.js", "data-beginner.js"].map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
  vm.runInContext(`${src}\n;this.interview = CURRICULUM_DATA; this.beginner = BEGINNER_DATA;`, ctx);
  return { interview: ctx.interview, beginner: ctx.beginner };
}

// <!-- exercise: id | level | title --> task <!-- hints --> hints <!-- solution --> solution
function exercises(md) {
  const parts = md.split(/^<!--\s*exercise:\s*(.+?)\s*-->\s*$/m);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const [id, level, ...title] = parts[i].split("|").map(s => s.trim());
    const body = parts[i + 1];
    const [task, rest = ""] = body.split(/^<!--\s*hints\s*-->\s*$/m);
    const [hints, solution = ""] = rest.split(/^<!--\s*solution\s*-->\s*$/m);
    out.push({ id, level, title: title.join(" | "), body, task, hints, solution, hasHints: rest !== "" });
  }
  return out;
}

// What kind of exercise this is, the same way the app decides which runner to show
function exerciseKind(task) {
  if (/```sql/.test(task)) return "sql";
  if (/```\w*\r?\n(?:\/\/|#)\s*src\//.test(task)) return "spring";
  return "java";
}

// [interview|beginner] [N | N-M]: no track means both, no days means all of them
function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set(argv.filter(a => a.startsWith("--")));
  const rest = argv.filter(a => !a.startsWith("--"));
  let tracks = Object.keys(TRACKS);
  if (TRACKS[rest[0]]) tracks = [rest.shift()];
  let range = null;
  if (rest[0]) {
    const m = rest[0].match(/^(\d+)(?:-(\d+))?$/);
    if (!m) {
      console.error(`Unknown argument "${rest[0]}". Usage: [interview|beginner] [day | from-to]`);
      process.exit(2);
    }
    range = [+m[1], +(m[2] || m[1])];
  }
  const daysOf = (track) => {
    const [from, to] = range || [1, TRACKS[track].days];
    return Array.from({ length: Math.min(to, TRACKS[track].days) - from + 1 }, (_, i) => from + i);
  };
  return { tracks, daysOf, flags };
}

function questionSets() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fs.readFileSync(path.join(root, "question-sets.js"), "utf8")}\n;this.sets = QUESTION_SETS;`, ctx);
  return ctx.sets;
}

// Every LeetCode slug in the question sets
const questionSlugs = () => new Set(questionSets().flatMap(s => s.problems.map(p => p[2])));

// Which days' notes show a "Step through this code" button for each program: Interview days with a
// <!-- visualize: X --> marker, Beginner days with one in their own notes, and Beginner days that borrow
// the Interview section the marker sits in (unless their own notes replace that section)
function visualizerDays() {
  const days = {};
  const at = (prog) => (days[prog] = days[prog] || { interview: new Set(), beginner: new Set() });
  const scan = (track, n) => {
    const file = notesFile(track, n);
    if (!fs.existsSync(file)) return [];
    const found = [];
    let sub = null;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const s = /^<!--\s*subtopic:\s*(\S+)\s*-->/.exec(line);
      if (s) sub = s[1];
      const v = /^<!--\s*visualize:\s*(\w+)\s*-->/.exec(line);
      if (v) found.push([v[1], sub]);
    }
    return found;
  };
  const sectionsOf = {};   // program → Interview subtopic ids whose section has its marker
  for (let n = 1; n <= TRACKS.interview.days; n++)
    for (const [prog, sub] of scan("interview", n)) { at(prog).interview.add(n); (sectionsOf[prog] = sectionsOf[prog] || new Set()).add(sub); }
  const beginner = loadData().beginner;
  for (let n = 1; n <= TRACKS.beginner.days; n++) {
    for (const [prog] of scan("beginner", n)) at(prog).beginner.add(n);
    const file = notesFile("beginner", n);
    const own = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    const ids = beginner[n - 1].topics.flatMap(t => t.subtopics.map(s => s.id));
    for (const [prog, subs] of Object.entries(sectionsOf))
      if (ids.some(id => subs.has(id) && !own.includes(`<!-- subtopic: ${id} -->`))) at(prog).beginner.add(n);
  }
  return days;
}

// visualize/index.js: the visualizer's catalog and which LeetCode problems have a recording
function visualizerIndex() {
  const dir = path.join(root, "visualize", "traces");
  const traces = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort().map(f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    : [];
  const sets = questionSets();
  const days = visualizerDays();
  const bySlug = {};
  const catalog = traces.map(t => {
    const slugs = (t.meta.leetcode || "").split(/\s+/).filter(Boolean);
    slugs.forEach(slug => { bySlug[slug] = t.program; });
    const set = t.meta.set || sets.find(s => s.problems.some(p => slugs.includes(p[2])))?.id || null;
    const d = days[t.program] || { interview: [], beginner: [] };
    return {
      program: t.program,
      title: t.meta.title,
      set,
      leetcode: slugs,
      steps: t.steps.length,
      days: { interview: [...d.interview].sort((a, b) => a - b), beginner: [...d.beginner].sort((a, b) => a - b) },
    };
  });
  const sorted = Object.fromEntries(Object.entries(bySlug).sort(([a], [b]) => a.localeCompare(b)));
  return `// Generated by scripts/trace-programs.js from the recordings and the notes' visualize markers: don't edit by hand.\n` +
    `// LeetCode problem slug → visualize/traces/<Program>.json\n` +
    `const VISUALIZATIONS = ${JSON.stringify(sorted, null, 2)};\n\n` +
    `// Every recording, for the Visualizer page: its question set, LeetCode problems and the days whose notes use it\n` +
    `const VISUALIZER_CATALOG = [\n${catalog.map(c => `  ${JSON.stringify(c)}`).join(",\n")}\n];\n`;
}

module.exports = { root, pad, TRACKS, notesFile, practiceFile, fileOfExercise, loadData, exercises, exerciseKind, parseArgs, visualizerIndex, questionSets, questionSlugs };
