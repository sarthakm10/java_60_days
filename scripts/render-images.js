// Usage: node scripts/render-images.js
// Renders scripts/brand-images.html into og-image.png (1200×630 link preview) and
// apple-touch-icon.png (180×180) at the repo root, using headless Chrome or Edge.
// Set CHROME=<path to the browser> if it isn't found. Needs internet for the Google fonts.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.join(__dirname, "..");
const page = pathToFileURL(path.join(__dirname, "brand-images.html")).href;

const candidates = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];
const browser = candidates.find(p => p && fs.existsSync(p));
if (!browser) {
  console.error("No Chrome/Edge found. Set CHROME to the browser's path.");
  process.exit(1);
}

function render(url, out, width, height) {
  const r = spawnSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--virtual-time-budget=5000",   // gives the web fonts time to load before the shot
    `--window-size=${width},${height}`, `--screenshot=${out}`, url,
  ], { encoding: "utf8" });
  if (r.status !== 0 || !fs.existsSync(out)) {
    console.error(`✗ ${path.basename(out)}\n${r.stderr}`);
    process.exit(1);
  }
  console.log(`✓ ${path.basename(out)} (${width}×${height}, ${Math.round(fs.statSync(out).size / 1024)} KB)`);
}

render(page, path.join(root, "og-image.png"), 1200, 630);
render(`${page}?icon`, path.join(root, "apple-touch-icon.png"), 180, 180);
