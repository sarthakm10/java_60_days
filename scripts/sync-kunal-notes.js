// Usage: node scripts/sync-kunal-notes.js <path to the Java_Notes_Kunal_DSA_PlayList folder>
// Copies the Markdown notes of that repository into notes/kunal/, byte for byte and with the same folder names, so
// the links between them keep working. The Beginner track shows them as its study notes (data-beginner.js names
// each subtopic's file). Run it again after the notes there change; files removed there are removed here too.
// Not copied: code examples, build output, the study site and anything that isn't Markdown.
const fs = require("fs");
const path = require("path");

const source = process.argv[2];
if (!source || !fs.existsSync(path.join(source, "java_dsa_study_roadmap.md"))) {
  console.error("Usage: node scripts/sync-kunal-notes.js <path to Java_Notes_Kunal_DSA_PlayList>");
  process.exit(1);
}

const target = path.join(__dirname, "..", "notes", "kunal");
const FOLDERS = ["kunal-java-notes-claude", "Java Topics Not Covered Notes", "DSA Topics Not Covered Notes", "Spring Boot Notes"];
const ROOT_FILES = ["java_dsa_study_roadmap.md", "topics_not_covered.md", "dsa_practice_sheet.md"];

const wanted = [
  ...ROOT_FILES,
  ...FOLDERS.flatMap(dir => fs.readdirSync(path.join(source, dir)).filter(f => f.endsWith(".md")).map(f => `${dir}/${f}`)),
];

let copied = 0, same = 0;
for (const rel of wanted) {
  const from = path.join(source, rel), to = path.join(target, rel);
  const bytes = fs.readFileSync(from);
  if (fs.existsSync(to) && fs.readFileSync(to).equals(bytes)) { same++; continue; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, bytes);
  copied++;
}

// Files that are no longer in the source
const keep = new Set(wanted.map(rel => path.join(target, rel)));
let removed = 0;
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (!keep.has(file)) { fs.unlinkSync(file); removed++; }
  }
})(target);

console.log(`notes/kunal: ${copied} copied, ${same} unchanged, ${removed} removed (${wanted.length} files)`);
