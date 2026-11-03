// Usage: node scripts/check-notes.js [interview|beginner] [day | from-to]
// Study notes (notes/day-NN.md, notes/beginner/day-NN.md):
// - Interview: every subtopic of the day has a <!-- subtopic: id --> section, with no unknown or repeated ones.
// - Beginner: sections only for that day's subtopics and one for every new (not borrowed) subtopic,
//   <!-- intro: id --> only for borrowed subtopics, and <!-- topic: bN_tM --> markers in order.
// - Both: code fences are balanced, no bare <Tag> outside code (Markdown would treat it as HTML and hide it),
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

for (const track of tracks) {
  const days = data[track];
  let checked = 0;
  for (const n of daysOf(track)) {
    const day = days.find(d => d.day === n) || days[n - 1];
    const file = notesFile(track, n);
    const label = `${TRACKS[track].name} Day ${n}`;
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
      subs.filter(s => !s.borrowed && !own.includes(s.id)).forEach(s => problems.push(`missing section ${s.id}`));
      markers(md, "intro").filter(id => !subs.some(s => s.id === id && s.borrowed)).forEach(id => problems.push(`intro for a subtopic that isn't borrowed: ${id}`));
      const topics = markers(md, "topic");
      const expected = day.topics.map((t, i) => `b${n}_t${i + 1}`);
      if (topics.join() !== expected.join()) problems.push(`topic markers ${topics.join(" ") || "(none)"}, expected ${expected.join(" ")}`);
    }
    problems.push(...markdownProblems(md));
    if (problems.length) { problemDays++; console.log(`✗ ${label}:\n  ${problems.join("\n  ")}`); }
  }
  console.log(`${TRACKS[track].name} notes: ${checked} days checked`);
}
console.log(problemDays ? `\n${problemDays} day(s) with problems` : "\nAll notes OK");
process.exit(problemDays ? 1 : 0);
