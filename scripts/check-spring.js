// Usage: node scripts/check-spring.js [interview|beginner] [day | from-to] [--offline]
// Spring exercises: their code blocks start with "// src/..." (or "# src/...") naming the file.
// For each day, builds two Maven projects (Spring Boot 4, Java 21) in a temp folder:
//   1. starter files + given tests: must compile, and every runnable test must FAIL (or it doesn't check anything);
//   2. solution (starter files overridden by the solution's): every test passes, with the counts in
//      **Expected result** lines "<TestClass>: N tests passed".
// Exercises with <!-- verify: compile --> are only compiled (their tests need H2).
// Needs Maven: "mvn" on the PATH, or MVN=<path to mvn>. --offline uses only the local Maven repository.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { TRACKS, practiceFile, exercises, exerciseKind, parseArgs } = require("./lib");

const { tracks, daysOf, flags } = parseArgs();
const MVN = process.env.MVN || "mvn";
const WORK = path.join(os.tmpdir(), "java-fullstack-springcheck");

const DEPS = {
  base: ["spring-boot-starter", "spring-boot-starter-test:test"],
  web: ["spring-boot-starter-webmvc", "spring-boot-starter-validation", "spring-boot-starter-webmvc-test:test"],
  jpa: ["spring-boot-starter-data-jpa", "spring-boot-starter-data-jpa-test:test"],
  security: ["spring-boot-starter-security", "spring-boot-starter-security-oauth2-resource-server", "spring-boot-starter-security-test:test"],
  actuator: ["spring-boot-starter-actuator"],
  aop: ["org.aspectj:aspectjweaver"],
};
// Which starters each day's project needs; a new Spring day must be added here
const DAY_DEPS = {
  interview: {
    19: ["base", "aop"], 20: ["base", "web"], 21: ["base", "jpa"], 22: ["base", "jpa"],
    23: ["base", "web", "security"], 24: ["base", "web"], 25: ["base", "web", "actuator"], 26: ["base", "web", "aop"],
  },
  beginner: { 54: ["base", "web"] },
};

function pom(deps) {
  // entries: "artifact", "artifact:scope" (Spring Boot group) or "group:artifact" (other groups)
  const xml = deps.flatMap(k => DEPS[k]).map(d => {
    const bits = d.split(":");
    const isGroup = bits[0].includes(".");
    const g = isGroup ? bits[0] : "org.springframework.boot";
    const a = isGroup ? bits[1] : bits[0];
    const scope = isGroup ? null : bits[1];
    return `<dependency><groupId>${g}</groupId><artifactId>${a}</artifactId>${scope ? `<scope>${scope}</scope>` : ""}</dependency>`;
  }).join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>4.0.5</version><relativePath/></parent>
  <groupId>com.example</groupId><artifactId>practice</artifactId><version>0.0.1-SNAPSHOT</version>
  <properties><java.version>21</java.version></properties>
  <dependencies>
    ${xml}
  </dependencies>
</project>`;
}

const APP = `package com.example.practice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PracticeApplication {
    public static void main(String[] args) { SpringApplication.run(PracticeApplication.class, args); }
}
`;

// "// src/main/java/..." first line → { path: whole block }
function files(md) {
  const out = {};
  for (const m of md.matchAll(/```[a-z]*\r?\n((?:\/\/|#)\s*(src\/\S+)[^\n]*\r?\n[\s\S]*?)```/g)) out[m[2]] = m[1];
  return out;
}

function writeProject(dir, deps, fileMap) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "pom.xml"), pom(deps));
  const all = { "src/main/java/com/example/practice/PracticeApplication.java": APP, ...fileMap };
  for (const [p, content] of Object.entries(all)) {
    const f = path.join(dir, p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, content);
  }
}

function mvn(dir, args) {
  return spawnSync(MVN, [...(flags.has("--offline") ? ["-o"] : []), "-q", "-B", ...args], { cwd: dir, encoding: "utf8", shell: true, timeout: 600000 });
}

const toClass = (p) => p.replace(/^src\/test\/java\//, "").replace(/\.java$/, "").replace(/\//g, ".");

function reports(dir) {
  const rep = path.join(dir, "target", "surefire-reports");
  const results = {};
  if (!fs.existsSync(rep)) return results;
  for (const f of fs.readdirSync(rep).filter(f => f.endsWith(".txt"))) {
    const m = fs.readFileSync(path.join(rep, f), "utf8").match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+)/);
    if (m) results[f.replace(/\.txt$/, "").split(".").pop()] = { run: +m[1], bad: +m[2] + +m[3] };
  }
  return results;
}

const check = spawnSync(MVN, ["-v"], { encoding: "utf8", shell: true });
if (check.status !== 0) {
  console.error(`Maven not found ("${MVN} -v" failed). Put mvn on the PATH or set MVN=<path to mvn>.`);
  process.exit(2);
}

let failures = 0;
const fail = (msg) => { failures++; console.log(`✗ ${msg}`); };

for (const track of tracks) {
  for (const day of daysOf(track)) {
    const file = practiceFile(track, day);
    if (!fs.existsSync(file)) continue;
    const spring = exercises(fs.readFileSync(file, "utf8")).filter(ex => exerciseKind(ex.task) === "spring");
    if (!spring.length) continue;
    const label = `${TRACKS[track].name} Day ${day}`;
    const deps = DAY_DEPS[track][day];
    if (!deps) { fail(`${label}: has Spring exercises but no DAY_DEPS entry in check-spring.js`); continue; }

    const starter = {}, solution = {}, expected = [], compileOnlyTests = new Set();
    for (const ex of spring) {
      const st = files(ex.task), so = files(ex.solution);
      if (!Object.keys(so).length) fail(`${ex.id}: no solution files`);
      Object.assign(starter, st);
      Object.assign(solution, st, so);
      const testClasses = Object.keys(st).filter(p => p.startsWith("src/test/java/")).map(toClass);
      if (!testClasses.length) fail(`${ex.id}: no test class in the starter`);
      const compileOnly = /<!--\s*verify:\s*compile\s*-->/.test(ex.body);
      if (compileOnly) testClasses.forEach(t => compileOnlyTests.add(t));
      const exp = ex.body.match(/\*\*Expected result\*\*[^\n]*(?:\r?\n)+```text\r?\n([\s\S]*?)```/);
      if (!exp) { fail(`${ex.id}: no **Expected result**`); continue; }
      for (const line of exp[1].trim().split(/\r?\n/)) {
        const m = line.match(/^(\w+): (\d+) tests? passed/);
        if (m) expected.push({ id: ex.id, cls: m[1], n: +m[2], compileOnly });
      }
    }

    console.log(`${label}: building ${spring.length} Spring exercise(s)…`);
    const sDir = path.join(WORK, `${track}-${day}-starter`), oDir = path.join(WORK, `${track}-${day}-solution`);
    writeProject(sDir, deps, starter);
    let r = mvn(sDir, ["test-compile"]);
    if (r.status !== 0) fail(`${label}: starter does not compile:\n${(r.stdout + r.stderr).split("\n").filter(l => /ERROR/.test(l)).slice(0, 15).join("\n")}`);
    else {
      console.log(`  ✓ starter + tests compile`);
      const runnable = expected.filter(e => !e.compileOnly).map(e => e.cls);
      if (runnable.length) {
        mvn(sDir, ["test", `-Dtest=${runnable.join(",")}`, "-Dsurefire.failIfNoSpecifiedTests=false"]);
        const got = reports(sDir);
        runnable.filter(cls => !(got[cls] && got[cls].bad)).forEach(cls => fail(`${label} ${cls}: passes on the unfinished starter, so it doesn't check the exercise`));
      }
    }

    writeProject(oDir, deps, solution);
    const runnable = Object.keys(solution).filter(p => p.startsWith("src/test/java/") && p.endsWith("Test.java")).map(toClass).filter(t => !compileOnlyTests.has(t));
    r = mvn(oDir, runnable.length ? ["test", `-Dtest=${runnable.map(t => t.split(".").pop()).join(",")}`, "-Dsurefire.failIfNoSpecifiedTests=false"] : ["test-compile"]);
    if (r.status !== 0) fail(`${label}: solution build/tests failed:\n${(r.stdout + r.stderr).split("\n").filter(l => /ERROR|FAIL|expected|but was/i.test(l)).slice(0, 25).join("\n")}`);
    const got = reports(oDir);
    for (const e of expected) {
      if (e.compileOnly) { console.log(`  ✓ ${e.id} ${e.cls}: compiled (not run: needs H2)`); continue; }
      const g = got[e.cls];
      if (!g) fail(`${label} ${e.id} ${e.cls}: no test report`);
      else if (g.bad || g.run !== e.n) fail(`${label} ${e.id} ${e.cls}: ran ${g.run}, failed ${g.bad}, expected ${e.n} passing`);
      else console.log(`  ✓ ${e.id} ${e.cls}: ${g.run} passed`);
    }
  }
}
console.log(failures ? `\n${failures} problem(s)` : "\nAll Spring exercises OK");
process.exit(failures ? 1 : 0);
