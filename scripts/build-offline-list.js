// Usage: node scripts/build-offline-list.js [--check]
// Writes offline-files.json: every file the site can fetch (pages, scripts, styles, icons, notes, exercises,
// visualizer recordings) and the CDN libraries it loads. "Download for offline" in the app saves all of them
// (sw.js). Run it after adding or removing files; --check only reports whether the list is out of date.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Files the site itself serves; folders are listed recursively
const ROOT_FILES = ["index.html", "app.html", "styles.css", "landing.css", "visualizer.css", "app.js", "landing.js",
  "data.js", "data-frontend.js", "data-beginner.js", "question-sets.js", "visualizer.js", "favicon.svg",
  "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const FOLDERS = [["notes", ".md"], ["practice", ".md"], ["visualize/traces", ".json"]];

function walk(dir, ext) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return walk(rel, ext);
    return rel.endsWith(ext) ? [rel] : [];
  });
}

const files = [...ROOT_FILES, "visualize/index.js", ...FOLDERS.flatMap(([dir, ext]) => walk(dir, ext).sort())];
const missing = files.filter(f => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error(`Missing files: ${missing.join(", ")}`);
  process.exit(1);
}

// CDN libraries: every external script and stylesheet the pages and app.js load (fixed versions, so cached for good)
const cdnPattern = /https:\/\/(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com)\/[^"'\s)]+/g;
const cdn = [...new Set(["app.html", "index.html", "app.js", "styles.css"].flatMap(f => read(f).match(cdnPattern) || []))]
  .map(url => url.replace(/&amp;/g, "&")).sort();

const json = JSON.stringify({ files, cdn }, null, 2) + "\n";
const out = path.join(root, "offline-files.json");
const current = fs.existsSync(out) ? fs.readFileSync(out, "utf8").split("\r\n").join("\n") : "";

if (process.argv.includes("--check")) {
  if (current === json) {
    console.log(`Offline list OK: ${files.length} files, ${cdn.length} CDN libraries`);
  } else {
    console.log("✗ offline-files.json is out of date: run node scripts/build-offline-list.js");
    process.exit(1);
  }
} else {
  fs.writeFileSync(out, json);
  console.log(`Wrote offline-files.json: ${files.length} files, ${cdn.length} CDN libraries`);
}
