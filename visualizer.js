// ============================================================
// Code visualizer: replays a recorded run of a Java program, one line at a time.
// Recordings are made ahead of time by scripts/trace-programs.js (visualize/traces/<Name>.json),
// so nothing runs in the browser: each step is a saved snapshot of the line, the call stack,
// the objects the variables reach, and the output so far.
// Usage: CodeVisualizer.open("TwoSumSorted")
// ============================================================
(function () {
  "use strict";

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const last = (arr) => arr[arr.length - 1];
  const isRef = (v) => v !== null && typeof v === "object" && "ref" in v;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const POINTER_COLORS = ["blue", "pink", "green", "orange", "purple", "yellow"];
  const SPEEDS = [0.5, 1, 2];

  const ICONS = {
    first: `<svg viewBox="0 0 24 24"><path d="M6 5v14"/><path d="m18 6-8 6 8 6V6z"/></svg>`,
    prev: `<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`,
    play: `<svg viewBox="0 0 24 24"><path d="M7 5v14l12-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24"><path d="M8 5v14"/><path d="M16 5v14"/></svg>`,
    next: `<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`,
    lastStep: `<svg viewBox="0 0 24 24"><path d="M18 5v14"/><path d="m6 6 8 6-8 6V6z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  };

  const traces = {};
  function loadTrace(name) {
    if (!traces[name]) {
      traces[name] = fetch(`visualize/traces/${encodeURIComponent(name)}.json`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(err => { delete traces[name]; throw err; });
    }
    return traces[name];
  }

  // ── Values ──
  function primText(v) {
    if (v === null) return "null";
    if (typeof v === "object") return "c" in v ? `'${v.c}'` : JSON.stringify(v.s);
    return String(v);
  }

  function primClass(v) {
    if (v === null) return "v-null";
    if (typeof v === "object") return "c" in v ? "v-char" : "v-str";
    return typeof v === "boolean" ? "v-bool" : "v-num";
  }

  const fieldOf = (o, name) => o.fields?.find(f => f[0] === name)?.[1];
  const hasField = (o, name) => !!o.fields?.some(f => f[0] === name);

  // Linked structures are drawn as a whole: a class with left + right is a tree, one with next is a list, and one
  // holding an array or map of children of its own class (next = new Node[26], children = new HashMap<>()) is a trie
  function nodeKind(o, heap) {
    if (!o || o.kind !== "object") return null;
    if (heap && trieTypes(heap).has(o.type)) return "trie";
    if (hasField(o, "left") && hasField(o, "right")) return "tree";
    if (hasField(o, "next")) return "list";
    return null;
  }

  // The field holding a node's children, when it's an array or a (non-empty) map of nodes of the node's own class
  function childrenField(o, heap) {
    for (const [f, v] of o.fields || []) {
      const c = isRef(v) ? heap[v.ref] : null;
      if (c?.kind === "array" && c.type === `${o.type.split(".").pop()}[]`) return f;
      if (c?.kind === "map" && c.entries.length && c.entries.every(([, x]) => isRef(x) && heap[x.ref]?.type === o.type)) return f;
    }
    return null;
  }

  // Classes that are trie nodes in a step: any instance has children of its own class (a leaf's map may be empty)
  const trieTypeCache = new WeakMap();
  function trieTypes(heap) {
    let types = trieTypeCache.get(heap);
    if (!types) {
      types = new Set(Object.values(heap).filter(o => o.kind === "object" && childrenField(o, heap)).map(o => o.type));
      trieTypeCache.set(heap, types);
    }
    return types;
  }

  // What a node shows inside its box: its val/key/data field, else its first plain field
  function nodeLabel(o) {
    const named = ["val", "value", "key", "data"].map(n => fieldOf(o, n)).find(v => v !== undefined && !isRef(v));
    if (named !== undefined) return primText(named);
    const plain = o.fields.find(f => !isRef(f[1]) && f[1] !== null);
    return plain ? primText(plain[1]) : "";
  }

  // A short, one-line text for any value (nested collections inline, up to a point)
  function short(v, heap, depth = 0) {
    if (!isRef(v)) return primText(v);
    const o = heap[v.ref];
    if (!o) return "…";
    const inner = (x) => short(x, heap, depth + 1);
    switch (o.kind) {
      case "array": case "list": case "deque": case "set": case "pq": {
        const items = o.items || [];
        if (depth > 1 || items.length > 10) return `${o.type}(${o.length ?? items.length})`;
        const [l, r] = o.kind === "set" ? ["{", "}"] : ["[", "]"];
        return `${l}${items.map(inner).join(", ")}${(o.length ?? items.length) > items.length ? ", …" : ""}${r}`;
      }
      case "map":
        if (depth > 1 || o.entries.length > 6) return `${o.type}(${o.entries.length})`;
        return `{${o.entries.map(([k, x]) => `${inner(k)}=${inner(x)}`).join(", ")}}`;
      case "sb": return JSON.stringify(o.value);
      case "object": {
        const kind = nodeKind(o, heap);
        return kind && kind !== "trie" ? `${o.type.split(".").pop()}(${nodeLabel(o)})` : o.type.split(".").pop();
      }
      default: return o.type;
    }
  }

  // Inside a cell a char needs no quotes: 'a' → a
  const cellText = (v, heap) => (v !== null && typeof v === "object" && "c" in v ? v.c : short(v, heap, 1));

  // lambda$merge$0 → "lambda in merge", <init> → "new ListNode"
  function methodName(f) {
    const lambda = /^lambda\$(\w+?)\$\d+$/.exec(f.method);
    if (lambda) return `lambda in ${lambda[1]}`;
    if (f.method === "<init>") return `new ${f.class.split(/[.$]/).pop()}`;
    return f.method;
  }

  // "array: a b" settings from the program's @pointers / @window / @cell comments
  function parseSpec(text) {
    const m = /^(\w+):\s*(.+)$/.exec(text || "");
    return m ? { array: m[1], parts: m[2].trim().split(/\s+/) } : null;
  }

  // Java code, one highlighted HTML string per line
  function highlightLines(code) {
    return code.replace(/\n$/, "").split("\n").map(line =>
      window.Prism?.languages?.java ? Prism.highlight(line, Prism.languages.java, "java") : miniHighlight(line));
  }

  // Without Prism (e.g. inside VS Code): comments, strings, chars, numbers, keywords and Capitalised types, as Prism's classes
  const KEYWORDS = new Set(("abstract assert boolean break byte case catch char class continue default do double else enum " +
    "extends final finally float for if implements import instanceof int interface long new package private protected " +
    "public return short static super switch this throw throws try var void while true false null record").split(" "));
  function miniHighlight(line) {
    const token = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b\d[\d_]*(?:\.\d+)?[lLfFdD]?\b)|(\b[A-Za-z_]\w*\b)/g;
    let out = "", last = 0, m;
    while ((m = token.exec(line))) {
      out += esc(line.slice(last, m.index));
      const [text, comment, str, chr, num, word] = m;
      const cls = comment ? "comment" : str ? "string" : chr ? "char" : num ? "number"
        : KEYWORDS.has(word) ? "keyword" : /^[A-Z]/.test(word) ? "class-name" : /^\s*\(/.test(line.slice(m.index + text.length)) ? "function" : null;
      out += cls ? `<span class="token ${cls}">${esc(text)}</span>` : esc(text);
      last = m.index + text.length;
    }
    return out + esc(line.slice(last));
  }

  // "right - k + 1" → ["right", "-k", "+1"]: split on + and − outside brackets, parentheses and char literals
  function splitSum(expr) {
    const parts = [];
    let depth = 0, cur = "", quote = false;
    for (const ch of expr.replace(/\s+/g, "")) {
      if (ch === "'") quote = !quote;
      if (!quote && "([".includes(ch)) depth++;
      if (!quote && ")]".includes(ch)) depth--;
      if (!quote && !depth && (ch === "+" || ch === "-") && cur && !/[+-]$/.test(cur)) { parts.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) parts.push(cur);
    return depth === 0 ? parts : [];
  }

  // Bounds and indexes like "right-k+1", "i - 1" or "c - 'a'": terms added and subtracted, each one read by
  // value(term) (a number, a variable, nums[i], s.charAt(i), arr.length); no eval
  function evalSum(expr, value) {
    const parts = splitSum(expr);
    let total = 0;
    for (const part of parts) {
      const sign = part[0] === "-" ? -1 : 1;
      const term = part.replace(/^[+-]/, "");
      const v = /^\d+$/.test(term) ? +term : value(term);
      if (!Number.isInteger(v)) return undefined;
      total += sign * v;
    }
    return parts.length ? total : undefined;
  }

  // How a list of items became another: which old index each item came from (when it moved), and which were
  // added, removed or changed. Spots one insert or removal (a queue's poll, a list's add) and values that
  // swapped places, so the drawing can move them instead of just flashing them
  function diffItems(a, b) {
    const from = b.map(() => null);
    if (b.length === a.length + 1 || b.length === a.length - 1) {
      const grew = b.length > a.length;
      let k = 0;
      while (k < Math.min(a.length, b.length) && same(a[k], b[k])) k++;
      if (grew ? same(a.slice(k), b.slice(k + 1)) : same(a.slice(k + 1), b.slice(k))) {
        for (let j = grew ? k + 1 : k; j < b.length; j++) from[j] = grew ? j - 1 : j + 1;
        return grew ? { from, added: [k], removed: [], changed: [k] } : { from, added: [], removed: [k], changed: [] };
      }
    }
    const changed = b.map((_, k) => k).filter(k => !same(a[k], b[k]));
    const used = new Set();
    for (const k of changed) {
      const j = changed.find(j => j !== k && j < a.length && !used.has(j) && same(a[j], b[k]));
      if (j !== undefined) { from[k] = j; used.add(j); }
    }
    const added = changed.filter(k => k >= a.length);
    const removed = Array.from({ length: Math.max(0, a.length - b.length) }, (_, r) => b.length + r);
    return { from, added, removed, changed };
  }

  // What a line reads or writes by index or key: nums[mid], grid[r][c], count[c - 'a']++, s.charAt(i),
  // list.get(i), list.set(i, x), map.get(k), map.put(k, v), map.containsKey(k)…
  const READ_CALLS = { charAt: false, get: false, getOrDefault: false, containsKey: false, set: true, put: true, remove: true };
  function accessesIn(line) {
    const code = (line || "").replace(/\/\/.*$/, "").replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const out = [];
    const index = /\b([A-Za-z_]\w*)\s*\[([^\[\]]+)\](?:\s*\[([^\[\]]+)\])?(\s*(?:[-+*\/%&|^]?=(?!=)|\+\+|--))?/g;
    for (let m; (m = index.exec(code));) {
      if (KEYWORDS.has(m[1]) || /\bnew\s+$/.test(code.slice(0, m.index))) continue;   // new int[n]
      out.push({ name: m[1], index: m[3] ? [m[2].trim(), m[3].trim()] : [m[2].trim()], write: !!m[4], text: m[0].replace(m[4] || "", "").trim() });
    }
    const call = /\b([A-Za-z_]\w*)\.(charAt|get|getOrDefault|containsKey|set|put|remove)\(\s*((?:[^,()]|\([^()]*\))+?)\s*[,)]/g;
    for (let m; (m = call.exec(code));) out.push({ name: m[1], call: m[2], arg: m[3], write: READ_CALLS[m[2]], text: `${m[1]}.${m[2]}(${m[3]}${m[2] === "set" || m[2] === "put" || m[2] === "getOrDefault" ? ", …" : ""})` });
    return out;
  }

  // Array name → the plain variables the code ever uses as its index (nums[i], s.charAt(left)): drawn as
  // pointers under the array when the program has no @pointers setting for it
  function indexVariables(code) {
    const map = new Map();
    for (const line of code.split("\n")) {
      for (const a of accessesIn(line)) {
        const v = a.index?.length === 1 ? a.index[0] : ["charAt", "get", "set"].includes(a.call) ? a.arg : null;
        if (!v || !/^[A-Za-z_]\w*$/.test(v) || KEYWORDS.has(v)) continue;
        if (!map.has(a.name)) map.set(a.name, []);
        if (!map.get(a.name).includes(v)) map.get(a.name).push(v);
      }
    }
    return map;
  }

  const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // ── The player ──
  class Player {
    // options: onClose (shows a close button), onStep(step, index) after every move, realLines (number lines
    // as in the file, for an editor next to it), title, kicker
    constructor(trace, dialog, options = {}) {
      this.t = trace;
      this.steps = trace.steps;
      this.dialog = dialog;
      this.options = options;
      this.onClose = options.onClose;
      this.i = 0;
      this.speed = 1;
      this.timer = null;
      this.pointers = parseSpec(trace.meta.pointers);
      this.window = parseSpec(trace.meta.window);
      this.cell = parseSpec(trace.meta.cell);
      this.indexVars = indexVariables(trace.code);
      this.codeLines = trace.code.split("\n");
      this.lineAccess = new Map();   // line number → accessesIn(that line)
      this.histories = new Map();    // object id → every change it went through (historyOf)
      this.histOpen = new Map();     // object id → whether its History is unfolded
      this.shown = false;
      this.build();
      this.go(0);
    }

    build() {
      const lines = highlightLines(this.t.code);
      const n = this.steps.length;
      // The "// @title …" settings at the top are for the recorder, not the reader: hide them and number from the code
      const raw = this.t.code.split("\n");
      let hidden = 0;
      while (!this.options.realLines && hidden < raw.length && /^\s*\/\/\s*@\w+/.test(raw[hidden])) hidden++;
      this.hidden = hidden;
      this.dialog.innerHTML = `
        <header class="viz-head">
          <div class="viz-head-text">
            <div class="viz-kicker">${esc(this.options.kicker || "Step through the code")}</div>
            <h2 class="viz-title" id="viz-title">${esc(this.options.title || this.t.meta.title || this.t.program)}</h2>
          </div>
          ${this.onClose ? `<button type="button" class="viz-icon-btn" data-act="close" aria-label="Close">${ICONS.close}</button>` : ""}
        </header>
        <div class="viz-body">
          <div class="viz-code" aria-label="Code">
            <div class="viz-cursor" aria-hidden="true"></div>
            ${lines.map((html, k) => k < hidden
              ? `<div class="viz-line" hidden></div>`
              : `<div class="viz-line"><span class="viz-ln">${k + 1 - hidden}</span><code>${html || " "}</code></div>`).join("")}
          </div>
          <div class="viz-state">
            <div class="viz-explain" aria-live="polite"></div>
            <section class="viz-section"><h3>Data</h3><div class="viz-data"></div></section>
            <section class="viz-section"><h3>Call stack</h3><div class="viz-stack"></div></section>
            <section class="viz-section viz-out-section"><h3>Output</h3><pre class="viz-out"></pre></section>
          </div>
        </div>
        <footer class="viz-controls">
          <div class="viz-buttons">
            <button type="button" class="viz-icon-btn" data-act="first" title="First step (Home)" aria-label="First step">${ICONS.first}</button>
            <button type="button" class="viz-icon-btn" data-act="prev" title="Back (←)" aria-label="Back">${ICONS.prev}</button>
            <button type="button" class="viz-icon-btn viz-play" data-act="play" title="Play / pause (Space)" aria-label="Play">${ICONS.play}</button>
            <button type="button" class="viz-icon-btn" data-act="next" title="Next (→)" aria-label="Next">${ICONS.next}</button>
            <button type="button" class="viz-icon-btn" data-act="last" title="Last step (End)" aria-label="Last step">${ICONS.lastStep}</button>
          </div>
          <input type="range" class="viz-slider" min="0" max="${n - 1}" value="0" aria-label="Step">
          <span class="viz-count"></span>
          <button type="button" class="viz-speed" data-act="speed" title="Playback speed">1×</button>
        </footer>`;
      this.lineEls = [...this.dialog.querySelectorAll(".viz-line")];
      this.codeEl = this.dialog.querySelector(".viz-code");
      this.dialog.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act) this.act(act);
        const step = e.target.closest("[data-goto]")?.dataset.goto;
        if (step !== undefined) { this.pause(); this.go(+step); }
      });
      // Remember which History lists are folded, across the redraw on every step ("toggle" doesn't bubble)
      this.dialog.addEventListener("toggle", (e) => {
        if (e.target.matches?.(".viz-hist")) this.histOpen.set(e.target.dataset.hist, e.target.open);
      }, true);
      this.dialog.querySelector(".viz-slider").addEventListener("input", (e) => { this.pause(); this.go(+e.target.value); });
    }

    act(act) {
      if (act === "close") return this.onClose();
      if (act === "play") return this.timer ? this.pause() : this.play();
      if (act === "speed") {
        this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
        this.dialog.querySelector(".viz-speed").textContent = `${this.speed}×`;
        if (this.timer) { this.pause(); this.play(); }
        return;
      }
      this.pause();
      const n = this.steps.length;
      this.go({ first: 0, prev: this.i - 1, next: this.i + 1, last: n - 1 }[act]);
    }

    play() {
      if (this.i >= this.steps.length - 1) this.go(0);
      this.setPlayIcon(true);
      this.timer = setInterval(() => {
        if (this.i >= this.steps.length - 1) return this.pause();
        this.go(this.i + 1);
      }, 1000 / this.speed);
    }

    pause() {
      clearInterval(this.timer);
      this.timer = null;
      this.setPlayIcon(false);
    }

    setPlayIcon(playing) {
      const btn = this.dialog.querySelector(".viz-play");
      btn.innerHTML = playing ? ICONS.pause : ICONS.play;
      btn.setAttribute("aria-label", playing ? "Pause" : "Play");
    }

    go(i) {
      const from = this.i;
      this.i = Math.max(0, Math.min(this.steps.length - 1, i));
      const s = this.steps[this.i], p = this.steps[this.i - 1] || null;
      // One step forward or back moves things to their new places; a jump (slider, first / last) just redraws
      const animate = this.shown && Math.abs(this.i - from) === 1 && !reducedMotion();
      const snap = this.snapshot(animate);
      this.renderCode(s, p);
      const explain = this.dialog.querySelector(".viz-explain");
      explain.innerHTML = this.explain(s, p);
      this.dialog.querySelector(".viz-data").innerHTML = this.renderData(s, p) || `<div class="viz-empty">No objects yet</div>`;
      this.dialog.querySelector(".viz-stack").innerHTML = this.renderStack(s, p);
      this.layoutBands();
      this.restoreScroll(snap);
      if (animate) {
        this.flip(snap);
        explain.animate?.([{ opacity: 0.35, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      }
      this.shown = true;
      const out = this.dialog.querySelector(".viz-out");
      const before = p ? p.out : "";
      out.innerHTML = s.out
        ? (s.out.startsWith(before) && s.out !== before ? esc(before) + `<mark>${esc(s.out.slice(before.length))}</mark>` : esc(s.out))
        : `<span class="viz-empty">Nothing printed yet</span>`;
      this.dialog.querySelector(".viz-slider").value = this.i;
      this.dialog.querySelector(".viz-count").textContent = `Step ${this.i + 1} of ${this.steps.length}`;
      this.dialog.querySelector('[data-act="prev"]').disabled = this.dialog.querySelector('[data-act="first"]').disabled = this.i === 0;
      this.dialog.querySelector('[data-act="next"]').disabled = this.dialog.querySelector('[data-act="last"]').disabled = this.i === this.steps.length - 1;
      this.options.onStep?.(s, this.i, this.dialog.querySelector(".viz-explain").textContent.trim());
    }

    // The next step (after the current one, wrapping round) that is about to run this line
    seekLine(line) {
      const n = this.steps.length;
      for (let k = 1; k <= n; k++) {
        const j = (this.i + k) % n;
        if (this.steps[j].line === line && this.steps[j].event === "step") { this.pause(); this.go(j); return true; }
      }
      return false;
    }

    // ── Motion ──
    // Every step redraws the state from scratch, so things would just jump. Instead: before a redraw, note where
    // each element with a data-k sits inside its structure (data-obj); after it, start every element that was
    // there before at its old place and slide it to the new one (a pointer moving to the next cell, a node of a
    // reversed list, a value swapped across the array). Elements that are gone fade out where they were, and
    // new ones pop in.
    snapshot(full) {
      const items = new Map(), roots = new Map();
      for (const root of this.dialog.querySelectorAll("[data-obj]")) {
        roots.set(root.dataset.obj, root.scrollLeft);
        if (!full) continue;
        const base = root.getBoundingClientRect();
        for (const el of root.querySelectorAll("[data-k]")) {
          items.set(`${root.dataset.obj}|${el.dataset.k}`, { el, key: el.dataset.k, root: root.dataset.obj, ...this.boxIn(el, base, root) });
        }
      }
      // The history lists keep their own scroll; the newest change is at the bottom
      const hist = new Map([...this.dialog.querySelectorAll(".viz-hist-list")].map(l => [l.closest(".viz-hist").dataset.hist, l.scrollHeight - l.scrollTop - l.clientHeight]));
      return { items, roots, hist };
    }

    // Where an element sits inside its structure's box (an SVG node: its circle)
    boxIn(el, base, root) {
      const r = (el.tagName === "g" ? el.querySelector("circle") || el : el).getBoundingClientRect();
      return { x: r.left - base.left - root.clientLeft + root.scrollLeft, y: r.top - base.top - root.clientTop + root.scrollTop, w: r.width, h: r.height };
    }

    // A wide array keeps its sideways scroll across steps; a History list stays scrolled to its newest change
    // unless you scrolled up to read an older one
    restoreScroll(snap) {
      for (const root of this.dialog.querySelectorAll("[data-obj]")) {
        if (snap.roots.has(root.dataset.obj)) root.scrollLeft = snap.roots.get(root.dataset.obj);
      }
      for (const list of this.dialog.querySelectorAll(".viz-hist-list")) {
        const fromBottom = snap.hist.get(list.closest(".viz-hist").dataset.hist);
        list.scrollTop = fromBottom > 24 ? list.scrollHeight - list.clientHeight - fromBottom : list.scrollHeight;
      }
    }

    // The @window band spans from its first cell to its last
    layoutBands() {
      for (const band of this.dialog.querySelectorAll(".viz-band")) {
        const [a, b] = band.dataset.band.split(",").map(Number);
        const cells = band.parentElement.querySelectorAll(":scope > .viz-cell");
        const A = cells[a], B = cells[b], val = A?.querySelector(".viz-val");
        if (!A || !B || !val) { band.remove(); continue; }
        Object.assign(band.style, {
          left: `${A.offsetLeft - 4}px`, width: `${B.offsetLeft + B.offsetWidth - A.offsetLeft + 8}px`,
          top: `${A.offsetTop + val.offsetTop - 4}px`, height: `${val.offsetHeight + 8}px`,
        });
      }
    }

    flip(snap) {
      const dur = this.timer ? Math.min(460, 800 / this.speed) : 460;
      const ease = "cubic-bezier(0.25, 0.9, 0.3, 1.12)";   // a little overshoot, so a pointer "lands"
      const seen = new Set(), moved = new Map(), entering = [], bentSvgs = new Set(), ghosts = [];
      for (const root of this.dialog.querySelectorAll("[data-obj]")) {
        const key = root.dataset.obj, had = snap.roots.has(key), base = root.getBoundingClientRect();
        for (const el of root.querySelectorAll("[data-k]")) {
          const k = `${key}|${el.dataset.k}`, old = snap.items.get(k);
          if (!old) { if (had) entering.push(el); continue; }
          seen.add(k);
          const now = this.boxIn(el, base, root);
          if (el.dataset.k === "band") {
            if (Math.abs(old.x - now.x) > 0.5 || Math.abs(old.w - now.w) > 0.5) {
              el.animate([{ transform: `translateX(${old.x - now.x}px) scaleX(${old.w / now.w})` }, { transform: "none" }], { duration: dur, easing: ease });
            }
            continue;
          }
          const dx = old.x + old.w / 2 - now.x - now.w / 2, dy = old.y + old.h / 2 - now.y - now.h / 2;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            moved.set(el, { dx, dy });
            if (el.tagName === "g") bentSvgs.add(el.ownerSVGElement);
          }
        }
        // Values that changed places in an array fly over in an arc from the cell they were in
        for (const el of root.querySelectorAll("[data-from]")) {
          const old = snap.items.get(`${key}|${el.dataset.from}`), cell = el.closest("[data-k]");
          if (!old || !cell) continue;
          const now = this.boxIn(cell, base, root), dx = old.x - now.x, dy = old.y - now.y;
          const lift = Math.min(26, 10 + Math.abs(dx) / 8) * (dx > 0 ? 1 : -1);   // swapped pairs pass above and below
          el.animate([
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: 3 },
            { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) scale(1.08)`, zIndex: 3, offset: 0.5 },
            { transform: "none", zIndex: 3 },
          ], { duration: dur * 1.25, easing: "cubic-bezier(0.45, 0, 0.25, 1)" });
        }
        // Cells removed from an array or list fade out where they stood
        for (const cells of root.querySelectorAll("[data-gone]")) {
          cells.dataset.gone.split(",").forEach(r => { const old = snap.items.get(`${key}|cell:${r}`); if (old) { ghosts.push(old.el); this.ghost(old, root, dur); } });
        }
      }
      for (const [el, d] of moved) {
        // A tag inside a node that moves too only needs its own part of the motion
        let { dx, dy } = d;
        for (let a = el.parentElement; a && !a.dataset?.obj; a = a.parentElement) {
          const ad = moved.get(a);
          if (ad) { dx -= ad.dx; dy -= ad.dy; break; }
        }
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: dur, easing: ease });
      }
      // A tree that changed shape: its edges fade in at their new places while the nodes glide there
      bentSvgs.forEach(svg => svg.querySelectorAll("line").forEach(line =>
        line.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: dur })));
      for (const el of entering) {
        if (entering.some(a => a !== el && a.contains(el))) continue;
        const drop = el.dataset.enter === "drop";
        el.animate([{ opacity: 0, transform: drop ? "translateY(-16px)" : "scale(0.55)" }, { opacity: 1, transform: "none" }], { duration: dur, easing: ease, fill: "backwards" });
      }
      for (const [k, old] of snap.items) {
        const what = old.key;
        if (seen.has(k) || what.startsWith("cell:") || what === "band" || old.el instanceof SVGElement) continue;
        if (ghosts.some(g => g.contains(old.el))) continue;
        const root = [...this.dialog.querySelectorAll("[data-obj]")].find(r => r.dataset.obj === old.root);
        if (!root) continue;
        ghosts.push(old.el);
        this.ghost(old, root, dur);
      }
    }

    // A removed element, put back where it was for a moment while it fades away
    ghost(old, root, dur) {
      const el = old.el;
      el.classList.add("viz-ghost");
      el.removeAttribute("data-k");
      el.querySelectorAll("[data-k]").forEach(c => c.removeAttribute("data-k"));
      Object.assign(el.style, { position: "absolute", left: `${old.x}px`, top: `${old.y}px`, width: `${old.w}px`, height: `${old.h}px`, margin: "0" });
      root.append(el);
      const lift = el.dataset.enter === "drop" ? "translateY(-14px) scale(0.92)" : "scale(0.6)";
      el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: lift }], { duration: dur, easing: "ease-in", fill: "forwards" })
        .onfinish = () => el.remove();
    }

    // ── Code: the line about to run, the one that just ran, and where each caller is waiting ──
    renderCode(s, p) {
      this.lineEls.forEach(el => el.classList.remove("is-next", "is-ran", "is-caller", "is-return", "is-error"));
      s.frames.slice(0, -1).forEach(f => this.lineEls[f.line - 1]?.classList.add("is-caller"));
      if (p && p.frames.length === s.frames.length && p.line !== s.line) this.lineEls[p.line - 1]?.classList.add("is-ran");
      const cur = this.lineEls[s.line - 1];
      if (!cur) return;
      const kind = s.event === "exception" ? "error" : s.event === "return" ? "return" : "next";
      cur.classList.add(`is-${kind}`);
      // The highlight slides from line to line instead of jumping
      const cursor = this.codeEl.querySelector(".viz-cursor");
      cursor.classList.toggle("no-anim", !this.shown);
      cursor.dataset.kind = kind;
      cursor.style.transform = `translateY(${cur.offsetTop}px)`;
      cursor.style.height = `${cur.offsetHeight}px`;
      const box = this.codeEl.getBoundingClientRect(), r = cur.getBoundingClientRect();
      if (r.top < box.top + 8 || r.bottom > box.bottom - 8) this.codeEl.scrollTop += r.top - box.top - box.height / 2 + r.height / 2;
    }

    // ── One sentence about this step ──
    explain(s, p) {
      const top = last(s.frames);
      const call = (f) => `<code>${esc(methodName(f))}(${f.locals.filter(([n]) => n !== "this").map(([, v]) => esc(short(v, s.heap))).join(", ")})</code>`;
      if (s.event === "exception") return `<span class="viz-badge error">Exception</span> <b>${esc(s.exception)}</b> on line ${s.line - this.hidden}`;
      if (s.event === "return") return `<span class="viz-badge return">Return</span> <code>${esc(methodName(top))}</code> returns <b>${esc(short(top.returned, s.heap))}</b>`;
      if (!p) return `<span class="viz-badge">Start</span> ${call(top)} starts. The highlighted line runs next.`;
      if (s.frames.length > p.frames.length) return `<span class="viz-badge call">Call</span> ${call(top)}: a new frame on the call stack`;
      if (s.frames.length < p.frames.length) {
        const done = last(p.frames);
        return `<span class="viz-badge">Back</span> in <code>${esc(methodName(top))}</code>${p.event === "return" ? `, with the value <b>${esc(short(done.returned, p.heap))}</b> from <code>${esc(methodName(done))}</code>` : ""}`;
      }
      const changes = this.changes(s, p);
      return `<span class="viz-badge">Line ${p.line - this.hidden}</span> ran${changes.length ? ": " + changes.slice(0, 4).join(" · ") : " (no variables changed)"}${changes.length > 4 ? " · …" : ""}`;
    }

    changes(s, p) {
      const out = [];
      const before = new Map(last(p.frames).locals.map(([n, v]) => [n, v]));
      for (const [name, v] of last(s.frames).locals) {
        if (!before.has(name)) out.push(`<code>${esc(name)}</code> = <b>${esc(short(v, s.heap))}</b>`);
        else if (!same(before.get(name), v)) out.push(`<code>${esc(name)}</code> ${esc(short(before.get(name), p.heap))} → <b>${esc(short(v, s.heap))}</b>`);
      }
      const names = this.namesById(s);
      for (const [id, o] of Object.entries(s.heap)) {
        const old = p.heap[id];
        if (!old || same(old, o)) continue;
        // Of the names pointing at it, prefer one the line that ran mentions (curr.next = prev → "curr", not "head")
        const ranCode = this.t.code.split("\n")[p.line - 1] || "";
        const who = names.get(id) || [];
        const label = (who.find(e => new RegExp(`\\b${e.name.replace(/\./g, "\\.")}\\b`).test(ranCode)) || who[0])?.name || o.type;
        if (o.kind === "array" || o.kind === "list") {
          o.items.forEach((x, k) => {
            if (!same(x, old.items[k])) out.push(`<code>${esc(label)}[${k}]</code> ${old.items[k] === undefined ? "" : esc(short(old.items[k], p.heap)) + " → "}<b>${esc(short(x, s.heap))}</b>`);
          });
          if (o.items.length < old.items.length) out.push(`<code>${esc(label)}</code> got shorter`);
        } else if (o.kind === "map") {
          const was = new Map(old.entries.map(([k, x]) => [JSON.stringify(k), x]));
          for (const [k, x] of o.entries) {
            const key = JSON.stringify(k);
            if (!was.has(key)) out.push(`<code>${esc(label)}</code> put ${esc(short(k, s.heap))} → <b>${esc(short(x, s.heap))}</b>`);
            else if (!same(was.get(key), x)) out.push(`<code>${esc(label)}</code>[${esc(short(k, s.heap))}] → <b>${esc(short(x, s.heap))}</b>`);
          }
          if (o.entries.length < old.entries.length) out.push(`<code>${esc(label)}</code> removed an entry`);
        } else if (o.kind === "object") {
          for (const [f, x] of o.fields) if (!same(fieldOf(old, f), x)) out.push(`<code>${esc(label)}.${esc(f)}</code> → <b>${esc(short(x, s.heap))}</b>`);
        } else if (!same(old, o)) out.push(`<code>${esc(label)}</code> changed`);
      }
      if (s.out !== p.out) out.push(`printed <b>${esc(JSON.stringify(s.out.slice(p.out.length)))}</b>`);
      return out;
    }

    // Object id → the variables pointing at it, innermost frame first
    namesById(s) {
      const map = new Map();
      const add = (id, entry) => { if (!map.has(id)) map.set(id, []); map.get(id).push(entry); };
      for (let fi = s.frames.length - 1; fi >= 0; fi--) {
        for (const [name, v] of s.frames[fi].locals) if (isRef(v)) add(v.ref, { name, top: fi === s.frames.length - 1 });
      }
      (s.statics || []).forEach(([name, v]) => { if (isRef(v)) add(v.ref, { name: name.split(".").pop(), top: false }); });
      const ret = last(s.frames).returned;
      if (isRef(ret)) add(ret.ref, { name: "returned", top: true });
      // A plain object's collections (e.g. MinStack's two stacks) and linked structures (a Trie's root) get drawn
      // too, named owner.field
      for (const [id, list] of [...map]) {
        const o = s.heap[id];
        if (o?.kind !== "object" || nodeKind(o, s.heap)) continue;
        for (const [f, v] of o.fields) {
          const target = isRef(v) ? s.heap[v.ref] : null;
          if (target && (target.kind !== "object" || nodeKind(target, s.heap))) add(v.ref, { name: `${list[0].name}.${f}`, top: list[0].top, field: true });
        }
      }
      return map;
    }

    // @pointers / @window on a String: draw its characters as cells, like a char[]
    stringArrays(s, names) {
      const out = {};
      for (const spec of [this.pointers, this.window]) {
        if (!spec || out[`str:${spec.array}`]) continue;
        for (let fi = s.frames.length - 1; fi >= 0; fi--) {
          const hit = s.frames[fi].locals.find(([n, v]) => n === spec.array && v && typeof v === "object" && "s" in v);
          if (!hit) continue;
          out[`str:${spec.array}`] = { kind: "array", type: "String", length: hit[1].s.length, items: [...hit[1].s].map(c => ({ c })) };
          names?.set(`str:${spec.array}`, [{ name: spec.array, top: fi === s.frames.length - 1 }]);
          break;
        }
      }
      return out;
    }

    // ── Data: every structure a variable points at, drawn once ──
    renderData(s, p) {
      const names = this.namesById(s);
      const drawn = new Set();
      const parts = [];
      const strings = this.stringArrays(s, names);
      const oldStrings = p ? this.stringArrays(p, null) : {};
      for (const [id, o] of Object.entries(strings)) parts.push(this.drawObject(id, o, s, p, names, oldStrings[id] || null));
      for (const id of names.keys()) {
        if (strings[id]) continue;
        if (drawn.has(id) || !s.heap[id]) continue;
        const o = s.heap[id];
        const kind = nodeKind(o, s.heap);
        if (kind === "list") parts.push(this.drawLinkedList(s, names, drawn, o.type));
        else if (kind === "tree") parts.push(this.drawTree(s, names, drawn, o.type));
        else if (kind === "trie") parts.push(this.drawTrie(s, names, drawn, o.type));
        else { drawn.add(id); parts.push(this.drawObject(id, o, s, p, names)); }
      }
      return parts.join("");
    }

    caption(id, o, names, extra = "") {
      const who = [...new Map((names.get(id) || []).map(e => [e.name, e])).values()];
      const size = o.kind === "map" ? o.entries.length : (o.length ?? o.items?.length);
      return `<div class="viz-obj-head">
        <span class="viz-names">${who.map(e => `<span class="${e.top ? "is-top" : ""}">${esc(e.name)}</span>`).join("")}</span>
        <span class="viz-type">${esc(o.type)}${size !== undefined ? ` · ${size}` : ""}${extra}</span>
      </div>`;
    }

    // Numbers the @pointers / @window settings refer to: top frame first, then the callers
    lookup(s, name) {
      for (let fi = s.frames.length - 1; fi >= 0; fi--) {
        const hit = s.frames[fi].locals.find(([n]) => n === name);
        if (hit && typeof hit[1] === "number") return hit[1];
      }
      return undefined;
    }

    evalBound(s, expr) {
      return evalSum(expr, (term) => this.termValue(s, term));
    }

    // A variable's value as recorded, top frame first
    local(s, name, topOnly = false) {
      for (let fi = s.frames.length - 1; fi >= (topOnly ? s.frames.length - 1 : 0); fi--) {
        const hit = s.frames[fi].locals.find(([n]) => n === name);
        if (hit) return hit[1];
      }
      return undefined;
    }

    // One term of an index or key: 3, 'a', i, nums[i], s.charAt(i), nums.length, list.size(). As a number
    // (chars as their code, so c - 'a' works), or with raw the Java value itself, to compare with map keys
    termValue(s, term, raw = false) {
      const num = (v) => raw ? v : typeof v === "number" ? v : v && typeof v === "object" && "c" in v ? v.c.charCodeAt(0) : undefined;
      let m;
      if (/^-?\d+$/.test(term)) return +term;
      if ((m = /^'(\\?.)'$/.exec(term))) return num({ c: m[1].replace(/^\\/, "") });
      if ((m = /^(\w+)\.(length|size)(\(\))?$/.exec(term))) {
        const v = this.local(s, m[1]);
        const o = isRef(v) ? s.heap[v.ref] : v;
        if (!o || typeof o !== "object") return undefined;
        return "s" in o ? o.s.length : o.kind === "map" ? o.entries.length : (o.length ?? o.items?.length);
      }
      if ((m = /^(\w+)\.charAt\((.+)\)$/.exec(term))) {
        const str = this.local(s, m[1]), k = this.evalBound(s, m[2]);
        const ch = str && typeof str === "object" && "s" in str && Number.isInteger(k) ? str.s[k] : undefined;
        return ch === undefined ? undefined : num({ c: ch });
      }
      if ((m = /^(\w+)\[(.+)\]$/.exec(term))) {
        const v = this.local(s, m[1]), k = this.evalBound(s, m[2]);
        const o = isRef(v) ? s.heap[v.ref] : null;
        return o?.items && Number.isInteger(k) ? num(o.items[k]) : undefined;
      }
      if (/^[A-Za-z_]\w*$/.test(term)) return num(this.local(s, term));
      return undefined;
    }

    // What the line about to run reads or writes in this object, by the names the current method has for it:
    // [{ index: k | [r, c] | key, write, text }]
    accessesOf(s, o, topNames) {
      if (s.event !== "step" || !topNames.length) return [];
      if (!this.lineAccess.has(s.line)) this.lineAccess.set(s.line, accessesIn(this.codeLines[s.line - 1]));
      const out = [];
      for (const a of this.lineAccess.get(s.line)) {
        if (!topNames.includes(a.name)) continue;
        if (a.index && o.kind !== "map") {
          const idx = a.index.map(e => this.evalBound(s, e));
          if (idx.every(Number.isInteger)) out.push({ index: idx.length === 1 ? idx[0] : idx, write: a.write, text: a.text });
        } else if (a.call && o.kind === "map" && ["get", "getOrDefault", "containsKey", "put", "remove"].includes(a.call)) {
          let key = this.termValue(s, a.arg, true);
          if (key === undefined) { const n = this.evalBound(s, a.arg); if (Number.isInteger(n)) key = n; }
          if (key !== undefined) out.push({ key: JSON.stringify(key), keyValue: key, write: a.write, text: a.text });
        } else if (a.call && ["charAt", "get", "set"].includes(a.call) && o.kind !== "map") {
          const k = this.evalBound(s, a.arg);
          if (Number.isInteger(k)) out.push({ index: k, write: a.write, text: a.text });
        }
      }
      return out;
    }

    // "next line reads nums[left], nums[right]": under a structure whose cells the line touches
    accessNote(acc, s) {
      if (!acc.length) return "";
      const group = (write) => [...new Set(acc.filter(a => a.write === write).map(a => a.text))];
      const parts = [];
      const reads = group(false), writes = group(true);
      if (reads.length) parts.push(`<span class="viz-legend read"></span>reads ${reads.map(t => `<code>${esc(t)}</code>`).join(" ")}`);
      if (writes.length) parts.push(`<span class="viz-legend write"></span>writes ${writes.map(t => `<code>${esc(t)}</code>`).join(" ")}`);
      const missing = acc.filter(a => a.key !== undefined && !a.found && !a.write).map(a => esc(short(a.keyValue, s.heap)));
      return `<div class="viz-note viz-access-note"><span>The next line</span>${parts.join(`<span>and</span>`)}${missing.length ? ` <span class="viz-miss">(${[...new Set(missing)].join(", ")} isn't in it yet)</span>` : ""}</div>`;
    }

    drawObject(id, o, s, p, names, old = p?.heap[id]) {
      const referredAs = (names.get(id) || []).map(e => e.name);
      const topNames = (names.get(id) || []).filter(e => e.top).map(e => e.name);
      const obj = (inner, extra = "") => `<div class="viz-obj" data-obj="${esc(id)}">${this.caption(id, o, names, extra)}${inner}</div>`;
      if (o.kind === "array" && o.items.length && o.items.every(x => isRef(x) && s.heap[x.ref]?.kind === "array")) {
        // A 2D array: a grid, with the @cell (row, column) ringed and the cells the next line touches outlined
        const rows = o.items.map(x => s.heap[x.ref]);
        const oldRows = old?.items?.map(x => p.heap[x.ref]);
        const at = this.cell && referredAs.includes(this.cell.array) ? this.cell.parts.map(e => this.evalBound(s, e)) : null;
        const acc = this.accessesOf(s, o, topNames).filter(a => Array.isArray(a.index));
        const touched = (r, c) => acc.find(a => a.index[0] === r && a.index[1] === c);
        const cols = Math.max(...rows.map(r => r.items.length));
        return obj(`
          <div class="viz-grid">
            <div class="viz-grid-row viz-grid-cols"><span class="viz-idx"></span>${Array.from({ length: cols }, (_, c) => `<span class="viz-idx">${c}</span>`).join("")}</div>
            ${rows.map((row, r) => `<div class="viz-grid-row"><span class="viz-idx">${r}</span>${row.items.map((x, c) => {
              const was = oldRows?.[r]?.items[c];
              const changed = oldRows?.[r] && !same(was, x);
              const here = at && at[0] === r && at[1] === c;
              const t = touched(r, c);
              return `<span class="viz-cell ${changed ? "changed" : ""} ${here ? "is-cell" : ""} ${t ? (t.write ? "is-write" : "is-read") : ""}"><span class="viz-val ${primClass(x)}">${esc(cellText(x, s.heap))}</span>${changed && was !== undefined ? `<span class="viz-was">${esc(cellText(was, p.heap))}</span>` : ""}</span>`;
            }).join("")}</div>`).join("")}
          </div>
          ${at && at.every(Number.isInteger) ? `<div class="viz-note"><span class="viz-legend is-top"></span> ${esc(this.cell.array)}[${esc(this.cell.parts[0])}][${esc(this.cell.parts[1])}] = ${esc(this.cell.array)}[${at[0]}][${at[1]}]</div>` : ""}
          ${this.accessNote(acc, s)}${this.drawHistory(id)}`, ` × ${cols}`);
      }
      const stackLike = (o.kind === "deque" || o.kind === "list") && (o.type === "Stack" || referredAs.some(n => /stack/i.test(n)));
      if (stackLike) {
        // A stack stands up: top first. ArrayDeque's push adds at the front; java.util.Stack's at the end.
        // Each item is keyed by its height, so a push drops in on top and a pop lifts off
        const items = o.type === "Stack" ? [...o.items].reverse() : o.items;
        const oldItems = old ? (old.type === "Stack" ? [...old.items].reverse() : old.items) : null;
        const grew = oldItems && (items.length !== oldItems.length || !same(items[0], oldItems[0]));
        return obj(items.length ? `<div class="viz-stack-col">${items.map((x, k) => `<div class="viz-stack-item ${k === 0 && grew ? "changed" : ""}" data-k="s:${items.length - 1 - k}" data-enter="drop">
            <span class="viz-val ${primClass(isRef(x) ? 0 : x)}">${esc(cellText(x, s.heap))}</span>${k === 0 ? `<span class="viz-stack-top" data-k="top">← top</span>` : ""}</div>`).join("")}</div>`
            : `<div class="viz-empty">empty</div>`);
      }
      if (["array", "list", "deque", "pq", "set"].includes(o.kind)) {
        // Pointers: the @pointers setting, else the plain variables the code indexes this array with (nums[i])
        let ptr = this.pointers && referredAs.includes(this.pointers.array) ? this.pointers.parts : [];
        const auto = !ptr.length && o.kind !== "set";
        if (auto) ptr = [...new Set(topNames.flatMap(n => this.indexVars.get(n) || []))].slice(0, 4);
        const win = this.window && referredAs.includes(this.window.array) ? this.window.parts.map(e => this.evalBound(s, e)) : null;
        const at = {};
        ptr.forEach((name, k) => {
          const v = auto ? this.local(s, name, true) : this.lookup(s, name);
          if (Number.isInteger(v) && v >= 0 && v <= o.items.length - (auto ? 1 : 0)) (at[v] = at[v] || []).push({ name, color: POINTER_COLORS[k % POINTER_COLORS.length] });
        });
        const acc = o.kind === "set" ? [] : this.accessesOf(s, o, topNames).filter(a => Number.isInteger(a.index));
        const diff = old && old.kind === o.kind && o.kind !== "set" ? diffItems(old.items, o.items) : null;
        const inWin = (k) => win && win.every(Number.isInteger) && k >= win[0] && k <= win[1];
        const showIdx = o.kind !== "set";
        const pointerTags = (list) => list.map(t => `<span class="viz-ptr ${t.color}" data-k="p:${esc(t.name)}">${esc(t.name)}</span>`).join("");
        const cells = o.items.map((x, k) => {
          const moved = diff?.from[k] != null;
          const changed = diff ? diff.changed.includes(k) && !moved : old && !same(old.items?.[k], x);
          const was = changed && diff && !diff.added.includes(k) ? old.items[k] : undefined;
          const t = acc.find(a => a.index === k);
          const first = at[k]?.[0];
          return `<div class="viz-cell ${changed ? "changed" : ""} ${moved ? "moved" : ""} ${inWin(k) ? "in-window" : ""} ${first ? "is-pointed" : ""} ${t ? (t.write ? "is-write" : "is-read") : ""}"
              data-k="cell:${k}"${first ? ` style="--pc: var(--accent-${first.color})"` : ""}>
            <span class="viz-val ${primClass(isRef(x) ? 0 : x)}"${moved ? ` data-from="cell:${diff.from[k]}"` : ""}>${esc(cellText(x, s.heap))}</span>
            ${was !== undefined ? `<span class="viz-was">${esc(cellText(was, p.heap))}</span>` : ""}
            ${showIdx ? `<span class="viz-idx">${k}</span>` : ""}
            <span class="viz-ptrs">${pointerTags(at[k] || [])}</span>
          </div>`;
        });
        if (at[o.items.length]) cells.push(`<div class="viz-cell ghost" data-k="cell:${o.items.length}"><span class="viz-val">&nbsp;</span><span class="viz-idx">${o.items.length}</span><span class="viz-ptrs">${pointerTags(at[o.items.length])}</span></div>`);
        // The @window range as one band behind the cells, which slides and stretches as the bounds move
        const lo = win && win.every(Number.isInteger) ? Math.max(0, win[0]) : 0, hi = win ? Math.min(o.items.length - 1, win[1]) : -1;
        const band = win && win.every(Number.isInteger) && lo <= hi ? `<span class="viz-band" data-k="band" data-band="${lo},${hi}"></span>` : "";
        const ends = o.kind === "deque" && o.items.length ? `<div class="viz-ends"><span>front</span><span>back</span></div>` : "";
        const note = o.kind === "pq" ? `<div class="viz-note">Stored as a heap: the smallest (by its comparator) is first</div>` : "";
        return obj(`${o.items.length || at[0] ? `<div class="viz-cells"${diff?.removed.length ? ` data-gone="${diff.removed.join(",")}"` : ""}>${band}${cells.join("")}</div>${ends}` : `<div class="viz-empty">empty</div>`}${note}
          ${this.accessNote(acc, s)}${o.kind === "set" ? "" : this.drawHistory(id)}`);
      }
      if (o.kind === "map") {
        const was = old?.kind === "map" ? new Map(old.entries.map(([k, x]) => [JSON.stringify(k), x])) : null;
        const acc = this.accessesOf(s, o, topNames).filter(a => a.key !== undefined);
        const keys = new Set(o.entries.map(([k]) => JSON.stringify(k)));
        acc.forEach(a => { a.found = keys.has(a.key); });
        return obj(`${o.entries.length ? `<table class="viz-map"><thead><tr><th>key</th><th>value</th></tr></thead><tbody>${o.entries.map(([k, x]) => {
            const key = JSON.stringify(k);
            const state = !was ? "" : !was.has(key) ? "added" : !same(was.get(key), x) ? "changed" : "";
            const t = acc.find(a => a.key === key);
            return `<tr class="${state} ${t ? (t.write ? "is-write" : "is-read") : ""}"><td class="${primClass(isRef(k) ? 0 : k)}">${esc(short(k, s.heap, 1))}</td><td class="${primClass(isRef(x) ? 0 : x)}">${state === "changed" ? `<span class="viz-tick">${esc(short(x, s.heap, 1))}</span>` : esc(short(x, s.heap, 1))}</td></tr>`;
          }).join("")}</tbody></table>` : `<div class="viz-empty">empty</div>`}${this.accessNote(acc, s)}`);
      }
      if (o.kind === "sb") {
        return obj(`<div class="viz-sb ${old && !same(old, o) ? "changed" : ""}">${esc(o.value) || "&nbsp;"}</div>`);
      }
      if (o.kind === "object") {
        return obj(`<table class="viz-fields">${o.fields.map(([f, x]) =>
          `<tr class="${old && !same(fieldOf(old, f), x) ? "changed" : ""}"><th>${esc(f)}</th><td class="${primClass(isRef(x) ? 0 : x)}">${esc(short(x, s.heap))}</td></tr>`).join("")}</table>`);
      }
      return obj("");
    }

    // ── History: every step that changed an array (or list, deque, grid), what it changed, and how it looked ──
    historyOf(id) {
      if (this.histories.has(id)) return this.histories.get(id);
      const entries = [];
      let prev;
      this.steps.forEach((st, k) => {
        const o = st.heap[id];
        if (!o || !o.items) return;
        const grid = o.kind === "array" && o.items.length > 0 && o.items.every(x => isRef(x) && st.heap[x.ref]?.kind === "array");
        const items = grid ? o.items.map(x => st.heap[x.ref].items) : o.items;
        if (prev === undefined) entries.push({ step: k, items, grid, heap: st.heap, hot: new Set(), text: "created" });
        else if (!same(prev, items)) entries.push({ step: k, items, grid, heap: st.heap, line: this.steps[k - 1]?.line, ...this.describeChange(prev, items, grid, this.steps[k - 1].heap, st.heap) });
        prev = items;
      });
      this.histories.set(id, entries);
      return entries;
    }

    describeChange(a, b, grid, oldHeap, heap) {
      const val = (x, h) => cellText(x, h);
      if (grid) {
        const cells = [];
        b.forEach((row, r) => row.forEach((x, c) => {
          if (!same(a[r]?.[c], x)) cells.push(`[${r}][${c}] ${a[r]?.[c] === undefined ? "" : val(a[r][c], oldHeap) + " → "}${val(x, heap)}`);
        }));
        return { hot: new Set(), text: cells.slice(0, 3).join(", ") + (cells.length > 3 ? ` +${cells.length - 3} more` : "") };
      }
      const d = diffItems(a, b);
      const hot = new Set([...d.changed, ...d.added]);
      const where = (k, n) => k === 0 && n > 1 ? "the front" : k === n - 1 ? "the end" : `[${k}]`;
      if (b.length === a.length + 1 && d.added.length === 1) return { hot, text: `added ${val(b[d.added[0]], heap)} at ${where(d.added[0], b.length)}` };
      if (b.length === a.length - 1 && d.removed.length === 1) return { hot, text: `removed ${val(a[d.removed[0]], oldHeap)} from ${where(d.removed[0], a.length)}` };
      const [i, j] = d.changed;
      if (d.changed.length === 2 && d.from[i] === j && d.from[j] === i) return { hot, swap: true, text: `swapped [${i}] ↔ [${j}]` };
      const parts = d.changed.map(k => `[${k}] ${a[k] === undefined ? "" : val(a[k], oldHeap) + " → "}${val(b[k], heap)}`);
      if (d.removed.length) parts.push(`${d.removed.length} removed from the end`);
      return { hot, text: parts.slice(0, 3).join(", ") + (parts.length > 3 ? ` +${parts.length - 3} more` : "") };
    }

    drawHistory(id) {
      const all = this.historyOf(id);
      if (!all.some(e => e.text !== "created")) return "";   // never changes: nothing to follow
      const upto = all.filter(e => e.step <= this.i);
      const changes = upto.filter(e => e.text !== "created").length;
      const open = this.histOpen.get(id) ?? true;
      const shown = upto.slice(-60);
      const latest = last(upto);
      const mini = (e) => {
        if (e.grid) return "";
        const items = e.items.slice(0, 16).map((x, k) =>
          `<span class="viz-mini ${e.hot.has(k) ? (e.swap ? "swap" : "hot") : ""}">${esc(cellText(x, e.heap))}</span>`).join("");
        return `<span class="viz-hist-cells">${items || `<span class="viz-mini empty">empty</span>`}${e.items.length > 16 ? `<span class="viz-mini more">…</span>` : ""}</span>`;
      };
      const rows = shown.map(e => `<li><button type="button" class="viz-hist-row ${e === latest ? "is-latest" : ""} ${e.step === this.i && e.text !== "created" ? "is-now" : ""}" data-goto="${e.step}" title="Go to step ${e.step + 1}">
          <span class="viz-hist-step">${e.step + 1}</span>${mini(e)}<span class="viz-hist-what">${esc(e.text)}</span>${e.line ? `<span class="viz-hist-line">line ${e.line - this.hidden}</span>` : ""}
        </button></li>`).join("");
      return `<details class="viz-hist" data-hist="${esc(id)}" ${open ? "open" : ""}>
        <summary>History <span>${changes ? `${changes} change${changes === 1 ? "" : "s"} so far · click one to go there` : "no changes yet"}</span></summary>
        ${upto.length > shown.length ? `<div class="viz-hist-more">${upto.length - shown.length} earlier not shown</div>` : ""}
        <ol class="viz-hist-list">${rows}</ol>
      </details>`;
    }

    // Variable tags on a node: the current method's variables stand out, callers' are faint
    tags(id, names) {
      const byName = new Map();   // one tag per name; highlighted if the current method has it
      for (const e of names.get(id) || []) byName.set(e.name, byName.get(e.name) || e.top);
      return [...byName].map(([name, top]) => `<span class="viz-tag ${top ? "is-top" : ""}" data-k="t:${esc(name)}">${esc(name)}</span>`).join("");
    }

    drawLinkedList(s, names, drawn, type) {
      const nodes = Object.entries(s.heap).filter(([, o]) => o.type === type && o.kind === "object");
      nodes.forEach(([id]) => drawn.add(id));
      const next = (o) => { const v = fieldOf(o, "next"); return isRef(v) ? v.ref : null; };
      const incoming = new Set(nodes.map(([, o]) => next(o)).filter(Boolean));
      let heads = nodes.filter(([id]) => !incoming.has(id)).map(([id]) => id);
      if (!heads.length && nodes.length) heads = [nodes[0][0]];   // a cycle with no start
      const seen = new Set();
      const chains = heads.map(head => {
        const parts = [];
        let id = head;
        while (id && !seen.has(id) && s.heap[id]) {
          seen.add(id);
          const o = s.heap[id];
          parts.push(`<div class="viz-node" data-k="n:${esc(id)}"><div class="viz-tags">${this.tags(id, names)}</div><div class="viz-node-box">${esc(nodeLabel(o))}</div></div>`);
          id = next(s.heap[id]);
          parts.push(`<span class="viz-arrow">→</span>`);
        }
        parts.push(id ? `<span class="viz-cycle">back to ${esc(nodeLabel(s.heap[id]))} ↺</span>` : `<span class="viz-null">null</span>`);
        return `<div class="viz-chain">${parts.join("")}</div>`;
      });
      return `<div class="viz-obj" data-obj="list:${esc(type)}"><div class="viz-obj-head"><span class="viz-names"></span><span class="viz-type">${esc(type.split(".").pop())} nodes · ${nodes.length}</span></div>${chains.join("")}</div>`;
    }

    drawTree(s, names, drawn, type) {
      const nodes = new Map(Object.entries(s.heap).filter(([, o]) => o.type === type && o.kind === "object"));
      nodes.forEach((_, id) => drawn.add(id));
      const child = (o, f) => { const v = fieldOf(o, f); return isRef(v) && nodes.has(v.ref) ? v.ref : null; };
      const incoming = new Set([...nodes.values()].flatMap(o => [child(o, "left"), child(o, "right")]).filter(Boolean));
      const roots = [...nodes.keys()].filter(id => !incoming.has(id));
      // In-order position for x, depth for y
      const pos = new Map();
      let x = 0;
      const place = (id, depth, guard) => {
        if (!id || guard.has(id)) return;
        guard.add(id);
        const o = nodes.get(id);
        place(child(o, "left"), depth + 1, guard);
        pos.set(id, { x: x++, y: depth });
        place(child(o, "right"), depth + 1, guard);
      };
      roots.forEach(r => { place(r, 0, new Set()); x++; });
      const W = 52, H = 64, R = 18, pad = 26;
      const width = Math.max(x - 1, 1) * W + pad * 2, height = (Math.max(...[...pos.values()].map(p => p.y), 0) + 1) * H + 18;
      const cx = (p) => pad + p.x * W, cy = (p) => R + 14 + p.y * H;
      const edges = [], circles = [];
      const onStack = new Set();   // nodes a caller's variable points at: the recursion's path
      for (const [id, list] of names) if (nodes.has(id) && list.some(e => !e.top)) onStack.add(id);
      for (const [id, p] of pos) {
        const o = nodes.get(id);
        for (const f of ["left", "right"]) {
          const c = child(o, f);
          if (c && pos.has(c)) edges.push(`<line x1="${cx(p)}" y1="${cy(p)}" x2="${cx(pos.get(c))}" y2="${cy(pos.get(c))}"/>`);
        }
        const top = (names.get(id) || []).filter(e => e.top).map(e => e.name);
        circles.push(`<g class="viz-tnode ${top.length ? "is-top" : ""} ${onStack.has(id) ? "on-stack" : ""}" data-k="n:${esc(id)}">
          <circle cx="${cx(p)}" cy="${cy(p)}" r="${R}"/>
          <text x="${cx(p)}" y="${cy(p)}" dy="0.35em">${esc(nodeLabel(o))}</text>
          ${top.length ? `<text class="viz-tlabel" x="${cx(p)}" y="${cy(p) + R + 13}">${esc([...new Set(top)].join(", "))}</text>` : ""}
        </g>`);
      }
      const cursor = this.treeCursor(s, pos, cx, cy, R);
      return `<div class="viz-obj" data-obj="tree:${esc(type)}"><div class="viz-obj-head"><span class="viz-names"></span><span class="viz-type">${esc(type.split(".").pop())} nodes · ${nodes.size}</span></div>
        <div class="viz-tree-wrap"><svg class="viz-tree" width="${width}" height="${height + 14}" viewBox="0 0 ${width} ${height + 14}">${edges.join("")}${cursor}${circles.join("")}</svg></div>
        ${onStack.size ? `<div class="viz-note"><span class="viz-legend on-stack"></span> where the waiting calls are &nbsp; <span class="viz-legend is-top"></span> the current call</div>` : ""}</div>`;
    }

    // A dashed ring around the node the current method is on (its first variable that points into the tree),
    // which glides from node to node as the code walks the tree
    treeCursor(s, pos, cx, cy, R) {
      const hit = last(s.frames).locals.find(([, v]) => isRef(v) && pos.has(v.ref));
      if (!hit) return "";
      const p = pos.get(hit[1].ref);
      return `<circle class="viz-tcursor" data-k="cursor" cx="${cx(p)}" cy="${cy(p)}" r="${R + 6}"/>`;
    }

    // A trie: each node shows the letter that leads to it, a ring marks where a word ends, and the variables that
    // point into it are tagged (the current method's stand out, callers' are dashed)
    drawTrie(s, names, drawn, type) {
      const nodes = new Map(Object.entries(s.heap).filter(([, o]) => o.type === type && o.kind === "object"));
      nodes.forEach((_, id) => drawn.add(id));
      // A node's children as [letter, id]: slot i of a 26-slot array is 'a' + i; a map's keys are the letters
      const kids = (o) => {
        const f = childrenField(o, s.heap) || o.fields.find(([, v]) => isRef(v) && ["array", "map"].includes(s.heap[v.ref]?.kind))?.[0];
        const c = f ? s.heap[fieldOf(o, f).ref] : null;
        if (!c) return [];
        const pairs = c.kind === "array"
          ? c.items.map((x, i) => [c.length === 26 ? String.fromCharCode(97 + i) : String(i), x])
          : c.entries.map(([k, x]) => [cellText(k, s.heap), x]);
        return pairs.filter(([, x]) => isRef(x) && nodes.has(x.ref)).map(([l, x]) => [l, x.ref]);
      };
      const isEnd = (o) => o.fields.some(([f, v]) => /^(is)?(end(OfWord)?|word|terminal|leaf)$/i.test(f) && (v === true || (v !== null && typeof v === "object" && "s" in v)));

      const children = new Map([...nodes].map(([id, o]) => [id, kids(o)]));
      const isChild = new Set([...children.values()].flat().map(([, c]) => c));
      const roots = [...nodes.keys()].filter(id => !isChild.has(id));
      // Leaves get consecutive columns; a parent sits centred over its children
      const pos = new Map(), letter = new Map();
      let col = 0, depthMax = 0;
      const place = (id, depth, seen) => {
        if (seen.has(id)) return;
        seen.add(id);
        depthMax = Math.max(depthMax, depth);
        const ch = children.get(id).filter(([, c]) => !seen.has(c));
        ch.forEach(([l, c]) => letter.set(c, l));
        ch.forEach(([, c]) => place(c, depth + 1, seen));
        const xs = ch.map(([, c]) => pos.get(c)?.x).filter(v => v !== undefined);
        pos.set(id, { x: xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : col++, y: depth });
      };
      roots.forEach(r => { place(r, 0, new Set()); col += 0.5; });

      const W = 46, H = 62, R = 16, pad = 26;
      const xMax = Math.max(0, ...[...pos.values()].map(p => p.x));
      const width = xMax * W + pad * 2, height = (depthMax + 1) * H + 22;
      const cx = (p) => pad + p.x * W, cy = (p) => R + 6 + p.y * H;
      const edges = [], circles = [];
      for (const [id, p] of pos) {
        for (const [, c] of children.get(id)) {
          if (pos.has(c)) edges.push(`<line x1="${cx(p)}" y1="${cy(p)}" x2="${cx(pos.get(c))}" y2="${cy(pos.get(c))}"/>`);
        }
        const tags = names.get(id) || [];
        const top = tags.some(e => e.top && !e.field), onStack = !top && tags.some(e => !e.top && !e.field);
        const labels = [...new Set(tags.filter(e => e.top || !e.field).map(e => e.name))];
        const end = isEnd(nodes.get(id));
        circles.push(`<g class="viz-tnode ${top ? "is-top" : ""} ${onStack ? "on-stack" : ""} ${end ? "is-end" : ""}" data-k="n:${esc(id)}">
          <circle cx="${cx(p)}" cy="${cy(p)}" r="${R}"/>
          ${end ? `<circle class="viz-tring" cx="${cx(p)}" cy="${cy(p)}" r="${R - 4}"/>` : ""}
          <text x="${cx(p)}" y="${cy(p)}" dy="0.35em">${esc(letter.get(id) ?? "·")}</text>
          ${labels.length ? `<text class="viz-tlabel" x="${cx(p)}" y="${cy(p) + R + 13}">${esc(labels.join(", "))}</text>` : ""}
        </g>`);
      }
      const words = [];
      const collect = (id, prefix, seen) => {
        if (seen.has(id)) return;
        seen.add(id);
        if (isEnd(nodes.get(id))) words.push(prefix);
        for (const [l, c] of children.get(id)) collect(c, prefix + l, seen);
      };
      roots.forEach(r => collect(r, "", new Set()));
      const cursor = this.treeCursor(s, pos, cx, cy, R);
      return `<div class="viz-obj" data-obj="trie:${esc(type)}"><div class="viz-obj-head"><span class="viz-names"></span><span class="viz-type">${esc(type.split(".").pop())} trie · ${nodes.size} nodes</span></div>
        <div class="viz-tree-wrap"><svg class="viz-tree viz-trie" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${edges.join("")}${cursor}${circles.join("")}</svg></div>
        <div class="viz-note"><span class="viz-legend is-end"></span> a word ends here${words.length ? `: ${esc(words.join(", "))}` : ""} &nbsp; <span class="viz-legend is-top"></span> the current method's variable</div></div>`;
    }

    // ── Call stack: the current method on top, the callers waiting below ──
    renderStack(s, p) {
      const frames = s.frames.map((f, k) => ({ f, k })).reverse();
      const html = frames.map(({ f, k }) => {
        const isTop = k === s.frames.length - 1;
        const before = p && p.frames[k] && p.frames[k].method === f.method ? new Map(p.frames[k].locals) : null;
        const rows = f.locals.map(([name, v]) => {
          const changed = before && (!before.has(name) || !same(before.get(name), v));
          const text = esc(short(v, s.heap));
          return `<tr class="${changed && isTop ? "changed" : ""}"><th>${esc(name)}</th><td class="${primClass(isRef(v) ? 0 : v)} ${isRef(v) ? "v-ref" : ""}">${changed && isTop ? `<span class="viz-tick">${text}</span>` : text}</td></tr>`;
        });
        if ("returned" in f) rows.push(`<tr class="viz-ret"><th>returns</th><td>${esc(short(f.returned, s.heap))}</td></tr>`);
        return `<div class="viz-frame ${isTop ? "is-top" : ""}" data-k="f:${k}" data-enter="drop">
          <div class="viz-frame-head"><code>${esc(methodName(f))}</code><span>line ${f.line - this.hidden}</span></div>
          ${rows.length ? `<table class="viz-locals">${rows.join("")}</table>` : `<div class="viz-empty">no variables yet</div>`}
        </div>`;
      }).join("");
      return `<div class="viz-frames" data-obj="callstack">${html}</div>`;
    }
  }

  // ── The dialog ──
  let current = null;

  function open(name) {
    close();
    const opener = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "viz-overlay";
    overlay.innerHTML = `<div class="viz-dialog" role="dialog" aria-modal="true" aria-labelledby="viz-title"><div class="viz-loading">Loading…</div></div>`;
    document.body.append(overlay);
    document.body.classList.add("viz-open");
    const dialog = overlay.firstElementChild;
    const state = { overlay, opener, player: null };
    current = state;

    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
    state.onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      const pl = state.player;
      if (!pl || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "range") return;
      const acts = { ArrowRight: "next", ArrowLeft: "prev", Home: "first", End: "last", " ": "play" };
      if (acts[e.key]) { e.preventDefault(); e.stopPropagation(); pl.act(acts[e.key]); }
      else if (e.key === "/") e.stopPropagation();   // don't jump to the app's search behind the dialog
    };
    document.addEventListener("keydown", state.onKey, true);

    loadTrace(name)
      .then(trace => {
        if (current !== state) return;
        state.player = new Player(trace, dialog, { onClose: close });
        dialog.querySelector('[data-act="next"]').focus();
      })
      .catch(() => {
        if (current !== state) return;
        dialog.innerHTML = `<div class="viz-loading">Couldn't load this visualization. Check your connection and try again.
          <button type="button" class="viz-speed" data-close>Close</button></div>`;
        dialog.querySelector("[data-close]").addEventListener("click", close);
      });
  }

  function close() {
    if (!current) return;
    const { overlay, opener, player, onKey } = current;
    player?.pause();
    document.removeEventListener("keydown", onKey, true);
    overlay.remove();
    document.body.classList.remove("viz-open");
    current = null;
    opener?.focus?.();
  }

  // Inside another page (the VS Code extension's panel): the player fills the container. Returns it, to drive
  // with go(i), act("next" | "prev" | "first" | "last" | "play") and seekLine(line)
  function embed(container, trace, options = {}) {
    container.classList.add("viz-dialog", "viz-embedded");
    return new Player(trace, container, options);
  }

  window.CodeVisualizer = { open, close, embed, isOpen: () => !!current };
})();
