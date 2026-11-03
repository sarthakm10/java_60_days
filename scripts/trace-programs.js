// Usage: node scripts/trace-programs.js [Name ...]
// Records visualize/programs/<Name>.java into visualize/traces/<Name>.json with scripts/tracer/Tracer.java.
// No names: every program. Needs a JDK 21+ (javac, java and its jdk.jdi module).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { root } = require("./lib");

const programs = path.join(root, "visualize", "programs");
const traces = path.join(root, "visualize", "traces");
const names = process.argv.slice(2).length
  ? process.argv.slice(2).map(n => n.replace(/\.java$/, ""))
  : fs.readdirSync(programs).filter(f => f.endsWith(".java")).map(f => f.slice(0, -5)).sort();

const bin = fs.mkdtempSync(path.join(os.tmpdir(), "tracer-"));
const c = spawnSync("javac", ["-nowarn", "-Xlint:none", "-d", bin, path.join(__dirname, "tracer", "Tracer.java")], { encoding: "utf8" });
if (c.status !== 0) { console.error(c.stdout + c.stderr); process.exit(1); }

fs.mkdirSync(traces, { recursive: true });
let failures = 0;
for (const name of names) {
  const src = path.join(programs, `${name}.java`);
  if (!fs.existsSync(src)) { console.log(`✗ ${name}: no ${path.relative(root, src)}`); failures++; continue; }
  const r = spawnSync("java", ["-cp", bin, "Tracer", src, path.join(traces, `${name}.json`)], { encoding: "utf8", timeout: 180000 });
  if (r.status === 0) console.log(`✓ ${r.stdout.trim()}`);
  else { failures++; console.log(`✗ ${name}:\n${(r.stdout + r.stderr).trim()}`); }
}
fs.rmSync(bin, { recursive: true, force: true });
console.log(failures ? `\n${failures} failed` : `\n${names.length} trace(s) written to visualize/traces/`);
process.exit(failures ? 1 : 0);
