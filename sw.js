// Offline support. Every file the site fetches is kept in one cache, so it opens and works without a network.
// - This site's files: network first, so you always get the newest notes when online; the saved copy when offline,
//   or when the network takes longer than a few seconds.
// - CDN libraries (fixed versions) and fonts: cache first.
// - "Download for offline" in the app sends { type: "download-all" }: everything in offline-files.json is saved
//   at once, with progress messages back to the page.
const CACHE = "java-fullstack-v1";
const NETWORK_TIMEOUT = 4000;
const CDN_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

// Saved on install, so both pages open offline even before a full download
const SHELL = ["./", "index.html", "app.html", "styles.css", "landing.css", "visualizer.css", "app.js", "landing.js",
  "data.js", "data-frontend.js", "data-beginner.js", "question-sets.js", "visualize/index.js", "visualizer.js",
  "favicon.svg", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// A new version of this file replaces the old one straight away, and older caches are removed
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(request));
  else if (CDN_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request));
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const saved = () => cache.match(request, { ignoreSearch: true });
  const network = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => {});   // if the cache answers first, a later network failure isn't an error
  try {
    // On a slow network, answer from the cache after a few seconds (the download still refreshes the copy)
    const first = await Promise.race([network, delay(NETWORK_TIMEOUT).then(saved)]);
    return first || await network;
  } catch {
    // Offline: the saved copy, or for a page that was never saved, the app itself
    return (await saved())
      || (request.mode === "navigate" ? await cache.match("app.html") : undefined)
      || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") cache.put(request, response.clone());
  return response;
}

self.addEventListener("message", event => {
  if (event.data?.type === "download-all") event.waitUntil(downloadAll(event.source));
});

// Saves every file in offline-files.json, six at a time, telling the page how far it got
async function downloadAll(client) {
  const tell = (message) => client?.postMessage(message);
  try {
    const cache = await caches.open(CACHE);
    const list = await (await fetch("offline-files.json", { cache: "no-store" })).json();
    const queue = [...list.files, ...list.cdn];
    const total = queue.length;
    let done = 0, failed = 0;

    async function save(url) {
      const external = url.startsWith("http");
      const response = await fetch(url, external ? { mode: "cors" } : { cache: "no-cache" });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      await cache.put(url, response.clone());
      // The fonts stylesheet points at the font files themselves: save those too
      if (url.startsWith("https://fonts.googleapis.com/")) {
        const fontFiles = (await response.text()).match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g) || [];
        await Promise.all(fontFiles.map(font => fetch(font, { mode: "cors" }).then(r => r.ok && cache.put(font, r))));
      }
    }

    async function worker() {
      while (queue.length) {
        const url = queue.shift();
        try { await save(url); } catch { failed++; }
        done++;
        if (done % 10 === 0 || done === total) tell({ type: "download-progress", done, total });
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    tell({ type: "download-done", total, failed });
  } catch (error) {
    tell({ type: "download-error", message: String(error.message || error) });
  }
}
