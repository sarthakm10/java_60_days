// Records a Java file with the tracer (scripts/tracer/Tracer.java) and returns the recording.
// Plain Node, no VS Code API, so it can be tested on its own: node test-runner.js
const cp = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const EXE = process.platform === "win32" ? ".exe" : "";

// java and javac from the setting, then JAVA_HOME, then the PATH
function findJdk(javaHome) {
  const home = javaHome || process.env.JAVA_HOME;
  if (home) return { java: path.join(home, "bin", `java${EXE}`), javac: path.join(home, "bin", `javac${EXE}`), from: home };
  return { java: "java", javac: "javac", from: "the PATH" };
}

function run(cmd, args, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve) => {
    let child;
    try { child = cp.spawn(cmd, args, { windowsHide: true }); } catch (err) { return resolve({ code: -1, stdout: "", stderr: String(err) }); }
    let stdout = "", stderr = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", d => { stdout += d; });
    child.stderr.on("data", d => { stderr += d; });
    child.on("error", err => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: stderr + String(err.message || err) }); });
    child.on("close", code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

// The tracer, compiled once per JDK and tracer version into the extension's storage folder
async function ensureTracer(storageDir, tracerSource, jdk) {
  const src = fs.readFileSync(tracerSource, "utf8");
  const key = crypto.createHash("sha1").update(src).update(jdk.javac).digest("hex").slice(0, 12);
  const dir = path.join(storageDir, `tracer-${key}`);
  if (fs.existsSync(path.join(dir, "Tracer.class"))) return { dir };
  fs.mkdirSync(dir, { recursive: true });
  const r = await run(jdk.javac, ["-nowarn", "-Xlint:none", "-d", dir, tracerSource]);
  if (r.code !== 0) {
    fs.rmSync(dir, { recursive: true, force: true });
    const missing = r.code === -1 || /ENOENT|not recognized|not found/i.test(r.stderr);
    return {
      error: missing
        ? `Couldn't find a JDK (looked in ${jdk.from}). Install JDK 17 or newer, or set "javaStepVisualizer.javaHome" to its folder.`
        : `Couldn't build the recorder with the JDK from ${jdk.from}. It needs JDK 17 or newer.\n\n${r.stderr.trim()}`,
    };
  }
  return { dir };
}

// The folder that holds the package root: src/com/demo/Main.java with "package com.demo;" → src
function sourceRoot(file, code) {
  const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(code);
  let dir = path.dirname(file);
  if (!pkg) return dir;
  const parts = pkg[1].split(".");
  const tail = dir.split(path.sep).slice(-parts.length);
  if (tail.join(".") !== pkg[1]) return null;   // the folders don't match the package: no sibling classes then
  for (let k = 0; k < parts.length; k++) dir = path.dirname(dir);
  return dir;
}

// options: file (the .java on disk), text (the editor's current text, if it differs from the file), stdin,
// javaHome, storageDir, tracerSource, timeoutSeconds, maxSteps → { trace, ms } or { error }
async function record(options) {
  const started = Date.now();
  const jdk = findJdk(options.javaHome);
  const tracer = await ensureTracer(options.storageDir, options.tracerSource, jdk);
  if (tracer.error) return { error: tracer.error };

  const code = options.text ?? fs.readFileSync(options.file, "utf8");
  const root = sourceRoot(options.file, code);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "java-viz-"));
  try {
    let source = options.file;
    if (options.text !== undefined) {   // unsaved changes: record a copy, with the same name so the class name fits
      const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(code);
      const dir = path.join(work, "src", ...(pkg ? pkg[1].split(".") : []));
      fs.mkdirSync(dir, { recursive: true });
      source = path.join(dir, path.basename(options.file));
      fs.writeFileSync(source, code);
    }
    const out = path.join(work, "trace.json");
    const args = ["-cp", tracer.dir, "Tracer", source, out,
      "--timeout", String(options.timeoutSeconds || 15), "--max-steps", String(options.maxSteps || 1000)];
    if (root) args.push("--sourcepath", root);
    if (options.stdin !== undefined && options.stdin !== null) {
      const input = path.join(work, "stdin.txt");
      fs.writeFileSync(input, options.stdin);
      args.push("--stdin", input);
    }
    const r = await run(jdk.java, args, { timeoutMs: 1000 * ((options.timeoutSeconds || 15) + 30) });
    if (r.code !== 0 || !fs.existsSync(out)) {
      const text = r.stderr.trim() || r.stdout.trim() || `The recorder stopped (exit code ${r.code}).`;
      return { error: text.split(source).join(path.basename(options.file)) };
    }
    return { trace: JSON.parse(fs.readFileSync(out, "utf8")), ms: Date.now() - started };
  } finally {
    // On Windows the program's JVM can hold stdin.txt open for a moment after it exits
    try { fs.rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch { /* left for the OS to clean */ }
  }
}

// Does this program read the keyboard? Then it needs input before it can be recorded
const readsInput = (code) => /System\s*\.\s*in\b/.test(code);

module.exports = { record, readsInput, sourceRoot, findJdk };
