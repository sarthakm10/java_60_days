// Usage: node scripts/check-all.js [--spring] [--offline]
// Runs every content check: notes, Java exercises, SQL exercises, visualizer recordings, the offline file list,
// and with --spring the Spring ones
// (slow: builds Maven projects; --offline is passed on to it).
const path = require("path");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const node = (script, ...rest) => [process.execPath, [path.join(__dirname, script), ...rest]];
const python = ["python", "python3", "py"].find(p => spawnSync(p, ["--version"], { encoding: "utf8" }).status === 0);

const steps = [
  ["Notes", ...node("check-notes.js")],
  ["Java exercises", ...node("check-practice.js")],
  python ? ["SQL exercises", python, [path.join(__dirname, "check-sql.py")]] : ["SQL exercises", null, []],
  ["Visualizer recordings", ...node("check-traces.js")],
  ["Offline file list", ...node("build-offline-list.js", "--check")],
];
if (args.includes("--spring")) steps.push(["Spring exercises", ...node("check-spring.js", ...args.filter(a => a === "--offline"))]);

const results = steps.map(([name, cmd, cmdArgs]) => {
  console.log(`\n━━ ${name} ━━`);
  if (!cmd) { console.log("Python not found, skipped"); return [name, "skipped"]; }
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit" });
  return [name, r.status === 0 ? "ok" : "FAILED"];
});

console.log("\n━━ Summary ━━");
results.forEach(([name, status]) => console.log(`${status === "ok" ? "✓" : status === "skipped" ? "-" : "✗"} ${name}: ${status}`));
if (!args.includes("--spring")) console.log("- Spring exercises: not run (add --spring)");
process.exit(results.some(([, s]) => s === "FAILED") ? 1 : 0);
