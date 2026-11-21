// Usage: node scripts/check-notes.js [interview|beginner] [day | from-to]
// Study notes (notes/day-NN.md, notes/beginner/day-NN.md):
// - Interview: every subtopic of the day has a <!-- subtopic: id --> section, with no unknown or repeated ones.
// - Beginner: sections only for that day's subtopics and one for every new (not borrowed) subtopic,
//   <!-- intro: id --> only for borrowed subtopics, and <!-- topic: bN_tM --> markers in order.
//   A subtopic that shows a Kunal note (`note` in data-beginner.js) needs no section: its file must be in notes/kunal
//   and its part's "## N." sections must exist. A day made only of Kunal notes (and frontend) has no notes file.
//   Checking all Beginner days also checks that every Kunal note, and every numbered section of a split one, is on a day.
// - Frontend: notes/frontend/module-NN.md has one section per module subtopic, in order (see the end of this file).
// - Both: every <!-- visualize: Name --> has its program in visualize/programs, code fences are balanced, no bare <Tag> outside code (Markdown would treat it as HTML and hide it),
//   and no "|" inside inline code in a table row (it splits the cell).
const fs = require("fs");
const path = require("path");
const { root, TRACKS, notesFile, loadData, parseArgs } = require("./lib");

const { tracks, daysOf } = parseArgs();
const data = loadData();
let problemDays = 0;

const markers = (md, kind) => [...md.matchAll(new RegExp(`^<!--\\s*${kind}:\\s*(\\S+)\\s*-->\\s*$`, "gm"))].map(m => m[1]);

function markdownProblems(md) {
  const problems = [];
  let inFence = false;
  md.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    const stripped = line.replace(/`[^`]*`/g, "").replace(/<!--.*?-->/g, "")
      .replace(/<\/?(details|summary|br|div|span|sub|sup|kbd|b|i|em|strong|code|pre|p|ul|ol|li|table|tr|td|th|a)\b[^>]*>/gi, "");
    if (/<[A-Za-z?][^>]*>/.test(stripped)) problems.push(`line ${i + 1}: looks like an HTML tag: ${line.trim().slice(0, 80)}`);
    if (/^\|/.test(line) && (line.match(/`[^`]*`/g) || []).some(s => s.replace(/\\\|/g, "").includes("|"))) problems.push(`line ${i + 1}: unescaped "|" inside inline code in a table row (write \\|)`);
  });
  if (inFence) problems.push("unbalanced ``` code fences");
  return problems;
}

// Kunal notes (notes/kunal/): the file exists, and a part's first and last sections are in it
const KUNAL = path.join(root, "notes", "kunal");
const kunalSeen = [];
const numberedSections = (file) => {
  let inFence = false;
  return fs.readFileSync(path.join(KUNAL, file), "utf8").split(/\r?\n/).flatMap(line => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && /^## (\d+)\./.exec(line);
    return m ? [+m[1]] : [];
  });
};
function kunalNoteProblems(s) {
  if (!fs.existsSync(path.join(KUNAL, s.note))) return [`${s.id}: no Kunal note notes/kunal/${s.note}`];
  if (!s.part) return [];
  const nums = numberedSections(s.note);
  return s.part.filter(n => !nums.includes(n)).map(n => `${s.id}: ${s.note} has no "## ${n}." section`);
}

for (const track of tracks) {
  const days = data[track];
  let checked = 0;
  for (const n of daysOf(track)) {
    const day = days.find(d => d.day === n) || days[n - 1];
    const file = notesFile(track, n);
    const label = `${TRACKS[track].name} Day ${n}`;
    const kunal = track === "beginner" ? day.topics.flatMap(t => t.subtopics).filter(s => s.note) : [];
    const kunalIssues = kunal.flatMap(s => kunalNoteProblems(s));
    if (kunalIssues.length) { problemDays++; console.log(`✗ ${label}:\n  ${kunalIssues.join("\n  ")}`); }
    kunal.forEach(s => kunalSeen.push(s));
    const ownTopics = day.topics.filter(t => t.category !== "Frontend" && !t.subtopics.every(s => s.note));
    if (track === "beginner" && !ownTopics.length && !fs.existsSync(file)) { checked++; continue; }
    if (!fs.existsSync(file)) { problemDays++; console.log(`✗ ${label}: no notes file ${path.relative(root, file)}`); continue; }
    checked++;
    const md = fs.readFileSync(file, "utf8");
    const subs = day.topics.flatMap(t => t.subtopics);
    const own = markers(md, "subtopic");
    const problems = [];
    own.filter((id, i) => own.indexOf(id) !== i).forEach(id => problems.push(`repeated section ${id}`));
    own.filter(id => !subs.some(s => s.id === id)).forEach(id => problems.push(`section for a subtopic not on this day: ${id}`));

    if (track === "interview") {
      subs.filter(s => !own.includes(s.id)).forEach(s => problems.push(`missing section ${s.id}`));
    } else {
      // Frontend subtopics come from notes/frontend; their topics come last on a day and have no marker here
      subs.filter(s => !s.borrowed && !s.frontend && !s.note && !own.includes(s.id)).forEach(s => problems.push(`missing section ${s.id}`));
      own.filter(id => subs.some(s => s.id === id && s.frontend)).forEach(id => problems.push(`frontend section ${id} belongs in notes/frontend, not here`));
      markers(md, "intro").filter(id => !subs.some(s => s.id === id && s.borrowed)).forEach(id => problems.push(`intro for a subtopic that isn't borrowed: ${id}`));
      const topics = markers(md, "topic");
      const expected = day.topics.filter(t => t.category !== "Frontend").map((t, i) => `b${n}_t${i + 1}`);
      if (topics.join() !== expected.join()) problems.push(`topic markers ${topics.join(" ") || "(none)"}, expected ${expected.join(" ")}`);
    }
    markers(md, "visualize").filter(name => !fs.existsSync(path.join(root, "visualize", "programs", `${name}.java`)))
      .forEach(name => problems.push(`<!-- visualize: ${name} --> but there's no visualize/programs/${name}.java`));
    problems.push(...markdownProblems(md));
    if (problems.length) { problemDays++; console.log(`✗ ${label}:\n  ${problems.join("\n  ")}`); }
  }
  console.log(`${TRACKS[track].name} notes: ${checked} days checked`);
}

// With every Beginner day checked: each Kunal note is shown somewhere, and a split note's numbered sections all are
if (tracks.includes("beginner") && daysOf("beginner").length === TRACKS.beginner.days) {
  const shownWhole = new Set(kunalSeen.filter(s => !s.part).map(s => s.note));
  const shownParts = {};
  kunalSeen.filter(s => s.part).forEach(s => {
    for (let n = s.part[0]; n <= s.part[1]; n++) (shownParts[s.note] = shownParts[s.note] || new Set()).add(n);
  });
  const all = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(KUNAL, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) walk(rel); else if (rel.endsWith(".md")) all.push(rel);
    }
  })("");
  // Reached through links rather than a day: the practice sheet (the Question Sets page) and folder READMEs
  const linkedOnly = (f) => f === "dsa_practice_sheet.md" || (f.endsWith("README.md") && f !== "Spring Boot Notes/README.md");
  const problems = [];
  all.filter(f => !linkedOnly(f) && !shownWhole.has(f)).forEach(f => {
    if (!shownParts[f]) return problems.push(`${f} isn't on any day`);
    const left = numberedSections(f).filter(n => !shownParts[f].has(n));
    if (left.length) problems.push(`${f}: sections ${left.join(", ")} aren't on any day`);
  });
  if (problems.length) { problemDays++; console.log(`✗ Kunal notes:\n  ${problems.join("\n  ")}`); }
  else console.log(`Kunal notes: all ${all.length} files shown (${all.filter(linkedOnly).length} through links)`);
}

// Frontend modules (notes/frontend/module-NN.md), checked when no track is named: a module that has a file has
// exactly one section per subtopic, and no "## " heading before its last section (a Beginner day takes the
// sections, and a "## " heading would end one early). Modules without a file yet are listed, not failed.
if (!process.argv[2]) {
  let checked = 0;
  const unwritten = [];
  for (const m of data.frontend) {
    const file = path.join(root, "notes", "frontend", `module-${String(m.module).padStart(2, "0")}.md`);
    if (!fs.existsSync(file)) { unwritten.push(m.module); continue; }
    checked++;
    const md = fs.readFileSync(file, "utf8");
    const ids = m.subtopics.map(([id]) => id);
    const own = markers(md, "subtopic");
    const problems = [];
    own.filter((id, i) => own.indexOf(id) !== i).forEach(id => problems.push(`repeated section ${id}`));
    own.filter(id => !ids.includes(id)).forEach(id => problems.push(`section for a subtopic not in this module: ${id}`));
    ids.filter(id => !own.includes(id)).forEach(id => problems.push(`missing section ${id}`));
    if (own.join() !== ids.filter(id => own.includes(id)).join()) problems.push("sections are not in the module's order");
    ["topic", "intro"].forEach(kind => { if (markers(md, kind).length) problems.push(`<!-- ${kind}: --> markers aren't used in frontend modules`); });
    const lines = md.split(/\r?\n/);
    const lastSection = lines.map(l => /^<!--\s*subtopic:/.test(l)).lastIndexOf(true);
    let inFence = false;
    lines.forEach((line, i) => {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (!inFence && i < lastSection && i > 0 && /^## /.test(line)) problems.push(`line ${i + 1}: "## " heading between sections (use ### or ####)`);
    });
    problems.push(...markdownProblems(md));
    if (problems.length) { problemDays++; console.log(`✗ Frontend module ${m.module}:\n  ${problems.join("\n  ")}`); }
  }
  console.log(`Frontend notes: ${checked} modules checked${unwritten.length ? `, not written yet: ${unwritten.join(", ")}` : ""}`);
}
console.log(problemDays ? `\n${problemDays} day(s) with problems` : "\nAll notes OK");
process.exit(problemDays ? 1 : 0);
