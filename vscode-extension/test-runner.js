// Checks runner.js without VS Code: node vscode-extension/test-runner.js
// Builds a small project in a temp folder (a package, a class in another file, a program that reads input)
// and records it the ways the extension does.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { record, readsInput, sourceRoot } = require("./runner");

const tracerSource = path.join(__dirname, "..", "scripts", "tracer", "Tracer.java");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "viz-runner-test-"));
const storageDir = path.join(work, "storage");
const write = (rel, text) => { const f = path.join(work, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return f; };

const helper = write("src/com/demo/Helper.java", `package com.demo;

public class Helper {
    static int square(int x) {
        return x * x;
    }
}
`);
const main = write("src/com/demo/Main.java", `package com.demo;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int a = in.nextInt();
        int sum = Helper.square(a) + 1;
        System.out.println("sum = " + sum);
    }
}
`);
const broken = write("Broken.java", `public class Broken {
    public static void main(String[] args) {
        int x = "text";
    }
}
`);

const last = (t) => t.steps[t.steps.length - 1];
const tests = [
  ["source root from the package", async () => {
    assert.strictEqual(sourceRoot(main, fs.readFileSync(main, "utf8")), path.join(work, "src"));
    assert.ok(readsInput(fs.readFileSync(main, "utf8")) && !readsInput(fs.readFileSync(helper, "utf8")));
  }],
  ["saved file, with input, using a class from another file", async () => {
    const r = await record({ file: main, stdin: "5\n", storageDir, tracerSource });
    assert.ok(!r.error, r.error);
    assert.strictEqual(last(r.trace).out, "sum = 26\n");
    assert.ok(r.trace.steps.every(s => s.frames.every(f => f.class === "com.demo.Main")), "Helper's lines must not be stepped through");
  }],
  ["unsaved editor text wins over the file on disk", async () => {
    const text = fs.readFileSync(main, "utf8").replace("+ 1;", "+ 100;");
    const r = await record({ file: main, text, stdin: "5\n", storageDir, tracerSource });
    assert.ok(!r.error, r.error);
    assert.strictEqual(last(r.trace).out, "sum = 125\n");
    assert.strictEqual(r.trace.code, text);
  }],
  ["no input given: System.in is empty, not a hang", async () => {
    const r = await record({ file: main, storageDir, tracerSource, timeoutSeconds: 10 });
    assert.ok(!r.error, r.error);
    assert.match(last(r.trace).exception, /NoSuchElementException/);
  }],
  ["compile error comes back readable, with the file's name", async () => {
    const r = await record({ file: broken, storageDir, tracerSource });
    assert.match(r.error, /Compile error/);
    assert.match(r.error, /Broken\.java:3: error: incompatible types/);
  }],
  ["a missing JDK gives a clear message", async () => {
    const r = await record({ file: broken, storageDir: path.join(work, "storage2"), tracerSource, javaHome: path.join(work, "no-jdk-here") });
    assert.match(r.error, /Couldn't find a JDK/);
  }],
  ["the tracer is compiled once and reused", async () => {
    const before = fs.readdirSync(storageDir).length;
    const r = await record({ file: main, stdin: "2\n", storageDir, tracerSource });
    assert.ok(!r.error, r.error);
    assert.strictEqual(fs.readdirSync(storageDir).length, before);
    console.log(`    (a recording with the tracer already built took ${r.ms} ms)`);
  }],
];

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log(`✓ ${name}`); }
    catch (err) { failed++; console.log(`✗ ${name}\n    ${err.message}`); }
  }
  fs.rmSync(work, { recursive: true, force: true });
  console.log(failed ? `\n${failed} failed` : "\nAll runner tests passed");
  process.exit(failed ? 1 : 0);
})();
