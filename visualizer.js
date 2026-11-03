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

  // Linked structures are drawn as a whole: a class with left + right is a tree, one with next is a list
  function nodeKind(o) {
    if (!o || o.kind !== "object") return null;
    if (hasField(o, "left") && hasField(o, "right")) return "tree";
    if (hasField(o, "next")) return "list";
    return null;
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
      case "object": return nodeKind(o) ? `${o.type.split(".").pop()}(${nodeLabel(o)})` : o.type.split(".").pop();
      default: return o.type;
    }
  }

  // "array: a b" settings from the program's @pointers / @window comments
  function parseSpec(text) {
    const m = /^(\w+):\s*(.+)$/.exec(text || "");
    return m ? { array: m[1], parts: m[2].trim().split(/\s+/) } : null;
  }

  // Java code, one highlighted HTML string per line
  function highlightLines(code) {
    return code.replace(/\n$/, "").split("\n").map(line =>
      window.Prism?.languages?.java ? Prism.highlight(line, Prism.languages.java, "java") : esc(line));
  }

  // ── The player ──
  class Player {
    constructor(trace, dialog, onClose) {
      this.t = trace;
      this.steps = trace.steps;
      this.dialog = dialog;
      this.onClose = onClose;
      this.i = 0;
      this.speed = 1;
      this.timer = null;
      this.pointers = parseSpec(trace.meta.pointers);
      this.window = parseSpec(trace.meta.window);
      this.build();
      this.go(0);
    }

    build() {
      const lines = highlightLines(this.t.code);
      const n = this.steps.length;
      // The "// @title …" settings at the top are for the recorder, not the reader: hide them and number from the code
      const raw = this.t.code.split("\n");
      let hidden = 0;
      while (hidden < raw.length && /^\s*\/\/\s*@\w+/.test(raw[hidden])) hidden++;
      this.hidden = hidden;
      this.dialog.innerHTML = `
        <header class="viz-head">
          <div class="viz-head-text">
            <div class="viz-kicker">Step through the code</div>
            <h2 class="viz-title" id="viz-title">${esc(this.t.meta.title || this.t.program)}</h2>
          </div>
          <button type="button" class="viz-icon-btn" data-act="close" aria-label="Close">${ICONS.close}</button>
        </header>
        <div class="viz-body">
          <div class="viz-code" aria-label="Code">
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
      });
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
      this.i = Math.max(0, Math.min(this.steps.length - 1, i));
      const s = this.steps[this.i], p = this.steps[this.i - 1] || null;
      this.renderCode(s, p);
      this.dialog.querySelector(".viz-explain").innerHTML = this.explain(s, p);
      this.dialog.querySelector(".viz-data").innerHTML = this.renderData(s, p) || `<div class="viz-empty">No objects yet</div>`;
      this.dialog.querySelector(".viz-stack").innerHTML = this.renderStack(s, p);
      const out = this.dialog.querySelector(".viz-out");
      const before = p ? p.out : "";
      out.innerHTML = s.out
        ? (s.out.startsWith(before) && s.out !== before ? esc(before) + `<mark>${esc(s.out.slice(before.length))}</mark>` : esc(s.out))
        : `<span class="viz-empty">Nothing printed yet</span>`;
      this.dialog.querySelector(".viz-slider").value = this.i;
      this.dialog.querySelector(".viz-count").textContent = `Step ${this.i + 1} of ${this.steps.length}`;
      this.dialog.querySelector('[data-act="prev"]').disabled = this.dialog.querySelector('[data-act="first"]').disabled = this.i === 0;
      this.dialog.querySelector('[data-act="next"]').disabled = this.dialog.querySelector('[data-act="last"]').disabled = this.i === this.steps.length - 1;
    }

    // ── Code: the line about to run, the one that just ran, and where each caller is waiting ──
    renderCode(s, p) {
      this.lineEls.forEach(el => el.classList.remove("is-next", "is-ran", "is-caller", "is-return", "is-error"));
      s.frames.slice(0, -1).forEach(f => this.lineEls[f.line - 1]?.classList.add("is-caller"));
      if (p && p.frames.length === s.frames.length && p.line !== s.line) this.lineEls[p.line - 1]?.classList.add("is-ran");
      const cur = this.lineEls[s.line - 1];
      if (!cur) return;
      cur.classList.add(s.event === "exception" ? "is-error" : s.event === "return" ? "is-return" : "is-next");
      const box = this.codeEl.getBoundingClientRect(), r = cur.getBoundingClientRect();
      if (r.top < box.top + 8 || r.bottom > box.bottom - 8) this.codeEl.scrollTop += r.top - box.top - box.height / 2 + r.height / 2;
    }

    // ── One sentence about this step ──
    explain(s, p) {
      const top = last(s.frames);
      const call = (f) => `<code>${esc(f.method)}(${f.locals.filter(([n]) => n !== "this").map(([, v]) => esc(short(v, s.heap))).join(", ")})</code>`;
      if (s.event === "exception") return `<span class="viz-badge error">Exception</span> <b>${esc(s.exception)}</b> on line ${s.line - this.hidden}`;
      if (s.event === "return") return `<span class="viz-badge return">Return</span> <code>${esc(top.method)}</code> returns <b>${esc(short(top.returned, s.heap))}</b>`;
      if (!p) return `<span class="viz-badge">Start</span> ${call(top)} starts. The highlighted line runs next.`;
      if (s.frames.length > p.frames.length) return `<span class="viz-badge call">Call</span> ${call(top)}: a new frame on the call stack`;
      if (s.frames.length < p.frames.length) {
        const done = last(p.frames);
        return `<span class="viz-badge">Back</span> in <code>${esc(top.method)}</code>${p.event === "return" ? `, with the value <b>${esc(short(done.returned, p.heap))}</b> from <code>${esc(done.method)}</code>` : ""}`;
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
        const label = names.get(id)?.[0]?.name || o.type;
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
      return map;
    }

    // ── Data: every structure a variable points at, drawn once ──
    renderData(s, p) {
      const names = this.namesById(s);
      const drawn = new Set();
      const parts = [];
      for (const id of names.keys()) {
        if (drawn.has(id) || !s.heap[id]) continue;
        const o = s.heap[id];
        const kind = nodeKind(o);
        if (kind === "list") parts.push(this.drawLinkedList(s, names, drawn, o.type));
        else if (kind === "tree") parts.push(this.drawTree(s, names, drawn, o.type));
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
      const vars = {};
      (expr.match(/[A-Za-z_]\w*/g) || []).forEach(n => { vars[n] = this.lookup(s, n); });
      if (Object.values(vars).some(v => v === undefined)) return undefined;
      try { return Function(...Object.keys(vars), `return (${expr});`)(...Object.values(vars)); } catch { return undefined; }
    }

    drawObject(id, o, s, p, names) {
      const old = p?.heap[id];
      const referredAs = (names.get(id) || []).map(e => e.name);
      if (o.kind === "array" && o.items.length && o.items.every(x => isRef(x) && s.heap[x.ref]?.kind === "array")) {
        // A 2D array: a grid
        const rows = o.items.map(x => s.heap[x.ref]);
        const oldRows = old?.items?.map(x => p.heap[x.ref]);
        return `<div class="viz-obj">${this.caption(id, o, names)}
          <div class="viz-grid">${rows.map((row, r) => `<div class="viz-grid-row"><span class="viz-idx">${r}</span>${row.items.map((x, c) =>
            `<span class="viz-cell ${oldRows?.[r] && !same(oldRows[r].items[c], x) ? "changed" : ""}"><span class="viz-val ${primClass(x)}">${esc(short(x, s.heap))}</span></span>`).join("")}</div>`).join("")}
          </div></div>`;
      }
      if (["array", "list", "deque", "pq", "set"].includes(o.kind)) {
        const ptr = this.pointers && referredAs.includes(this.pointers.array) ? this.pointers.parts : [];
        const win = this.window && referredAs.includes(this.window.array) ? this.window.parts.map(e => this.evalBound(s, e)) : null;
        const at = {};
        ptr.forEach((name, k) => {
          const v = this.lookup(s, name);
          if (Number.isInteger(v) && v >= 0 && v <= o.items.length) (at[v] = at[v] || []).push({ name, color: POINTER_COLORS[k % POINTER_COLORS.length] });
        });
        const inWin = (k) => win && win.every(Number.isInteger) && k >= win[0] && k <= win[1];
        const showIdx = o.kind !== "set";
        const cells = o.items.map((x, k) => {
          const changed = old && old.kind === o.kind && !same(old.items?.[k], x);
          return `<div class="viz-cell ${changed ? "changed" : ""} ${inWin(k) ? "in-window" : ""}">
            <span class="viz-val ${primClass(isRef(x) ? 0 : x)}">${esc(short(x, s.heap, 1))}</span>
            ${showIdx ? `<span class="viz-idx">${k}</span>` : ""}
            <span class="viz-ptrs">${(at[k] || []).map(t => `<span class="viz-ptr ${t.color}">${esc(t.name)}</span>`).join("")}</span>
          </div>`;
        });
        if (at[o.items.length]) cells.push(`<div class="viz-cell ghost"><span class="viz-val">&nbsp;</span><span class="viz-idx">${o.items.length}</span><span class="viz-ptrs">${at[o.items.length].map(t => `<span class="viz-ptr ${t.color}">${esc(t.name)}</span>`).join("")}</span></div>`);
        const stackLike = o.kind === "deque" && referredAs.some(n => /stack/i.test(n));
        const ends = o.kind === "deque" && o.items.length ? `<div class="viz-ends"><span>${stackLike ? "top" : "front"}</span><span>${stackLike ? "bottom" : "back"}</span></div>` : "";
        const note = o.kind === "pq" ? `<div class="viz-note">Stored as a heap: the smallest (by its comparator) is first</div>` : "";
        return `<div class="viz-obj">${this.caption(id, o, names)}
          ${o.items.length ? `<div class="viz-cells">${cells.join("")}</div>${ends}` : `<div class="viz-empty">empty</div>`}${note}</div>`;
      }
      if (o.kind === "map") {
        const was = old?.kind === "map" ? new Map(old.entries.map(([k, x]) => [JSON.stringify(k), x])) : null;
        return `<div class="viz-obj">${this.caption(id, o, names)}
          ${o.entries.length ? `<table class="viz-map"><thead><tr><th>key</th><th>value</th></tr></thead><tbody>${o.entries.map(([k, x]) => {
            const key = JSON.stringify(k);
            const changed = was && (!was.has(key) || !same(was.get(key), x));
            return `<tr class="${changed ? "changed" : ""}"><td class="${primClass(isRef(k) ? 0 : k)}">${esc(short(k, s.heap, 1))}</td><td class="${primClass(isRef(x) ? 0 : x)}">${esc(short(x, s.heap, 1))}</td></tr>`;
          }).join("")}</tbody></table>` : `<div class="viz-empty">empty</div>`}</div>`;
      }
      if (o.kind === "sb") {
        return `<div class="viz-obj">${this.caption(id, o, names)}<div class="viz-sb ${old && !same(old, o) ? "changed" : ""}">${esc(o.value) || "&nbsp;"}</div></div>`;
      }
      if (o.kind === "object") {
        return `<div class="viz-obj">${this.caption(id, o, names)}<table class="viz-fields">${o.fields.map(([f, x]) =>
          `<tr class="${old && !same(fieldOf(old, f), x) ? "changed" : ""}"><th>${esc(f)}</th><td class="${primClass(isRef(x) ? 0 : x)}">${esc(short(x, s.heap))}</td></tr>`).join("")}</table></div>`;
      }
      return `<div class="viz-obj">${this.caption(id, o, names)}</div>`;
    }

    // Variable tags on a node: the current method's variables stand out, callers' are faint
    tags(id, names) {
      const byName = new Map();   // one tag per name; highlighted if the current method has it
      for (const e of names.get(id) || []) byName.set(e.name, byName.get(e.name) || e.top);
      return [...byName].map(([name, top]) => `<span class="viz-tag ${top ? "is-top" : ""}">${esc(name)}</span>`).join("");
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
          parts.push(`<div class="viz-node"><div class="viz-tags">${this.tags(id, names)}</div><div class="viz-node-box">${esc(nodeLabel(o))}</div></div>`);
          id = next(s.heap[id]);
          parts.push(`<span class="viz-arrow">→</span>`);
        }
        parts.push(id ? `<span class="viz-cycle">back to ${esc(nodeLabel(s.heap[id]))} ↺</span>` : `<span class="viz-null">null</span>`);
        return `<div class="viz-chain">${parts.join("")}</div>`;
      });
      return `<div class="viz-obj"><div class="viz-obj-head"><span class="viz-names"></span><span class="viz-type">${esc(type.split(".").pop())} nodes · ${nodes.length}</span></div>${chains.join("")}</div>`;
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
        circles.push(`<g class="viz-tnode ${top.length ? "is-top" : ""} ${onStack.has(id) ? "on-stack" : ""}">
          <circle cx="${cx(p)}" cy="${cy(p)}" r="${R}"/>
          <text x="${cx(p)}" y="${cy(p)}" dy="0.35em">${esc(nodeLabel(o))}</text>
          ${top.length ? `<text class="viz-tlabel" x="${cx(p)}" y="${cy(p) + R + 13}">${esc([...new Set(top)].join(", "))}</text>` : ""}
        </g>`);
      }
      return `<div class="viz-obj"><div class="viz-obj-head"><span class="viz-names"></span><span class="viz-type">${esc(type.split(".").pop())} nodes · ${nodes.size}</span></div>
        <div class="viz-tree-wrap"><svg class="viz-tree" width="${width}" height="${height + 14}" viewBox="0 0 ${width} ${height + 14}">${edges.join("")}${circles.join("")}</svg></div>
        ${onStack.size ? `<div class="viz-note"><span class="viz-legend on-stack"></span> where the waiting calls are &nbsp; <span class="viz-legend is-top"></span> the current call</div>` : ""}</div>`;
    }

    // ── Call stack: the current method on top, the callers waiting below ──
    renderStack(s, p) {
      const frames = s.frames.map((f, k) => ({ f, k })).reverse();
      return frames.map(({ f, k }) => {
        const isTop = k === s.frames.length - 1;
        const before = p && p.frames[k] && p.frames[k].method === f.method ? new Map(p.frames[k].locals) : null;
        const rows = f.locals.map(([name, v]) => {
          const changed = before && (!before.has(name) || !same(before.get(name), v));
          return `<tr class="${changed && isTop ? "changed" : ""}"><th>${esc(name)}</th><td class="${primClass(isRef(v) ? 0 : v)} ${isRef(v) ? "v-ref" : ""}">${esc(short(v, s.heap))}</td></tr>`;
        });
        if ("returned" in f) rows.push(`<tr class="viz-ret"><th>returns</th><td>${esc(short(f.returned, s.heap))}</td></tr>`);
        return `<div class="viz-frame ${isTop ? "is-top" : ""}">
          <div class="viz-frame-head"><code>${esc(f.method)}</code><span>line ${f.line - this.hidden}</span></div>
          ${rows.length ? `<table class="viz-locals">${rows.join("")}</table>` : `<div class="viz-empty">no variables yet</div>`}
        </div>`;
      }).join("");
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
        state.player = new Player(trace, dialog, close);
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

  window.CodeVisualizer = { open, close, isOpen: () => !!current };
})();
