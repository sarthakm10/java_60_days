// ============================================================
// NoteBook: shows a day's study notes as a book you flip through, instead of one long scroll.
//
// The rendered notes stay real DOM (checkboxes, copy buttons, diagrams keep their listeners):
// their blocks are *moved* into fixed-size pages, and wrappers like a Kunal note, a list or a
// blockquote are split across pages with shallow copies. Pages that aren't on screen wait in a
// hidden shelf inside the article, so ids and querySelector still find everything.
// The first pages are a title page and an index built from the headings, with page numbers.
//
// Also: reading settings (text size, line spacing, paper), bookmarks, highlights with notes,
// and a focus mode that hides the rest of the app.
// ============================================================
(function () {
  const SPLIT = new Set(["UL", "OL", "BLOCKQUOTE", "SECTION", "TABLE", "TBODY"]);
  const HEADING = /^H[1-4]$/;
  const MODE_KEY = "notes_view_mode";   // "book" | "scroll"
  const PREFS_KEY = "notes_reader_prefs";
  const SIZES = { s: 0.9, m: 1, l: 1.12, xl: 1.25 };
  const LEADINGS = { compact: 1.55, normal: 1.72, relaxed: 1.95 };
  const PAPERS = { cream: "Cream", white: "White", sepia: "Sepia" };
  const COLORS = ["yellow", "green", "pink", "blue"];
  // A highlight stays inside one of these; the paginator moves them whole, so marks inside are safe
  const BLOCK = "p, li, td, th, h1, h2, h3, h4, h5, h6, dt, dd, pre, figcaption, summary";
  const SKIP = "button, label, input, svg, .mermaid-diagram";   // text that can't be highlighted
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const books = new Set();   // books on the page, so a settings change reaches all of them

  // Start fetching the book's serif now, so pages are measured with it
  try { document.fonts?.load("700 16px Fraunces"); document.fonts?.load("italic 400 16px Fraunces"); } catch {}

  function getMode() { try { return localStorage.getItem(MODE_KEY) || "book"; } catch { return "book"; } }
  function setMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch {} }

  // ---------- reading settings ----------
  const DEFAULT_PREFS = { size: "m", leading: "normal", paper: "cream" };
  function getPrefs() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch {}
    return {
      size: SIZES[p.size] ? p.size : DEFAULT_PREFS.size,
      leading: LEADINGS[p.leading] ? p.leading : DEFAULT_PREFS.leading,
      paper: PAPERS[p.paper] ? p.paper : DEFAULT_PREFS.paper
    };
  }
  function setPrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
    for (const b of books) {
      b.applyPrefs();
      b.renderSettings();
      if (b.visible() && b.sig !== layoutSig()) b.busy ? b.relayout() : b.paginate();
    }
  }
  // What a layout depends on besides the page size: a book laid out under another one is re-laid when shown
  const isFocus = () => document.body.classList.contains("nb-focus");
  const layoutSig = () => { const p = getPrefs(); return `${p.size}|${p.leading}|${isFocus() ? "f" : ""}`; };

  // ---------- focus mode ----------
  function setFocus(on) {
    if (on === isFocus()) return;
    document.body.classList.toggle("nb-focus", on);
    for (const b of books) {
      b.updateFocusBtn();
      if (b.visible()) {
        b.busy ? b.relayout() : b.paginate();
        if (on) b.article.closest(".study-notes")?.scrollTo?.(0, 0);
        else b.keepInView();
      }
    }
  }

  // Which blocks may be split across pages
  function splittable(n) {
    if (n.nodeType !== 1) return false;
    if (SPLIT.has(n.tagName)) return n.children.length > 0;
    return n.tagName === "DIV" && n.classList.contains("kunal-note");
  }

  // ---------- finding a block again ----------
  // A bookmark or highlight remembers its block as { tag, key, nth }: the nth element with that tag whose text
  // starts with key. That survives a new page size or a fresh render (page numbers don't).
  const keyOf = (n) => norm(n.textContent).slice(0, 80);
  function finder(roots) {
    const byTag = new Map(), keys = new Map();
    const list = (tag) => {
      // A code listing split over pages counts once, as its first piece
      if (!byTag.has(tag)) byTag.set(tag, roots.flatMap(r => [...r.querySelectorAll(tag)]).filter(e => !e.classList.contains("nb-clone") && !e._off));
      return byTag.get(tag);
    };
    const key = (e) => { if (!keys.has(e)) keys.set(e, keyOf(e._orig || e)); return keys.get(e); };
    return {
      find(loc) {
        if (!loc?.tag) return null;
        let n = 0;
        for (const e of list(loc.tag)) if (key(e) === loc.key && n++ === loc.nth) return e;
        return null;
      },
      locate(e) {
        if (e._first) e = e._first;
        const tag = e.tagName.toLowerCase(), k = key(e);
        let nth = 0;
        for (const x of list(tag)) {
          if (x === e) return { tag, key: k, nth };
          if (key(x) === k) nth++;
        }
        return null;
      }
    };
  }

  // ---------- highlights ----------
  function textNodesIn(range) {
    const root = range.commonAncestorContainer;
    if (root.nodeType === 3) return root.parentNode.closest(SKIP) ? [] : [root];
    const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) if (range.intersectsNode(t) && !t.parentNode.closest(SKIP)) out.push(t);
    return out;
  }
  function markClass(hl) { return `nb-hl nb-hl-${COLORS.includes(hl.color) ? hl.color : "yellow"}${hl.note ? " nb-hl-noted" : ""}`; }
  // Wrap the text of a range (inside one block) in <mark>s, one per text node
  function wrapRange(range, hl) {
    const parts = textNodesIn(range).map(t => [t, t === range.startContainer ? range.startOffset : 0, t === range.endContainer ? range.endOffset : t.length]);
    const marks = [];
    for (let [t, s, e] of parts) {
      if (e <= s || !t.data.slice(s, e).trim()) continue;
      if (e < t.length) t.splitText(e);
      if (s > 0) t = t.splitText(s);
      const m = el("mark", markClass(hl));
      m.dataset.hl = hl.id;
      if (hl.note) m.title = hl.note;
      t.before(m);
      m.appendChild(t);
      marks.push(m);
    }
    return marks;
  }
  function unwrap(root, id) {
    root.querySelectorAll(id ? `mark.nb-hl[data-hl="${id}"]` : "mark.nb-hl").forEach(m => {
      const p = m.parentNode;
      m.replaceWith(...m.childNodes);
      p.normalize();
    });
  }
  // A range over characters [start, start + len) of a block's text
  function rangeAt(block, start, len) {
    const r = document.createRange();
    const w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let pos = 0, started = false;
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const end = pos + t.length;
      if (!started && start < end) { r.setStart(t, start - pos); started = true; }
      if (started && start + len <= end) { r.setEnd(t, start + len - pos); return r; }
      pos = end;
    }
    return null;
  }
  // Draw saved highlights into notes (book or scroll view); returns the ids that couldn't be found
  function applyHighlights(roots, highlights) {
    roots.forEach(r => unwrap(r));
    const f = finder(roots), missing = new Set();
    for (const hl of highlights || []) {
      const block = f.find(hl);
      const text = block?.textContent || "";
      const at = text.substr(hl.start, hl.quote.length) === hl.quote ? hl.start : text.indexOf(hl.quote);
      const range = block && at >= 0 && hl.quote ? rangeAt(block, at, hl.quote.length) : null;
      if (range) wrapRange(range, hl); else missing.add(hl.id);
    }
    return missing;
  }

  class NoteBook {
    constructor(article, opts = {}) {
      this.article = article;
      this.opts = opts;
      this.pages = [];
      this.spread = 0;
      this.busy = false;
      this.moves = [];
      this.splits = [];   // [original code block, its pieces] for listings too long for one page
      article._notebook = this;
      article.classList.add("nb-active");
      article.closest(".study-notes")?.classList.add("nb-mode");
      books.add(this);

      // Bookmarks and highlights for these notes (a copy: pages get attached to it)
      const saved = opts.marks?.load?.() || {};
      this.marks = opts.marks ? {
        bookmarks: (saved.bookmarks || []).map(b => ({ ...b })),
        highlights: (saved.highlights || []).map(h => ({ ...h }))
      } : null;

      // The original content goes into a hidden source tree; pages borrow its blocks
      this.source = el("div", "nb-source");
      this.source.append(...article.childNodes);
      const first = this.source.firstElementChild;
      if (first?.tagName === "H1") first.classList.add("nb-hidden-title");   // the title is already in the header
      if (this.marks) this.missing = applyHighlights([this.source], this.marks.highlights);
      this.shelf = el("div", "nb-shelf");
      this.measure = el("div", "nb-measure");
      this.root = el("div", "nb-book");
      const seg = (pref, opts) => `<div class="nb-seg" data-pref="${pref}">${opts}</div>`;
      this.root.innerHTML = `
        <div class="nb-stage">
          <button class="nb-edge nb-edge-prev" aria-label="Previous page"><span>‹</span></button>
          <div class="nb-spread">
            <div class="nb-slot nb-left"></div>
            <div class="nb-spine" aria-hidden="true"></div>
            <div class="nb-slot nb-right"></div>
          </div>
          <button class="nb-edge nb-edge-next" aria-label="Next page"><span>›</span></button>
        </div>
        <div class="nb-bar">
          <button class="nb-btn nb-index-btn" title="Go to the index">☰ <span>Index</span></button>
          <button class="nb-btn nb-prev" title="Previous page (←)">‹</button>
          <input class="nb-range" type="range" min="0" value="0" aria-label="Page">
          <span class="nb-count"></span>
          <button class="nb-btn nb-next" title="Next page (→)">›</button>
          <span class="nb-bar-sep" aria-hidden="true"></span>
          ${this.marks ? `
          <button class="nb-btn nb-icon nb-mark-btn" title="Bookmark this page (M)" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg></button>
          <button class="nb-btn nb-marks-btn" title="Your bookmarks and highlights">✎ <span>Marks</span><b class="nb-marks-count"></b></button>` : ""}
          <button class="nb-btn nb-aa-btn" title="Reading settings: text size, spacing, paper"><span class="nb-aa">Aa</span></button>
          <button class="nb-btn nb-icon nb-focus-btn" title="Focus mode (F)" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
          <button class="nb-btn nb-mode-btn" title="Read as one long scrolling page">⇅ <span>Scroll view</span></button>

          <div class="nb-pop nb-aa-pop" hidden>
            <div class="nb-pop-head"><b>Reading settings</b><button class="nb-pop-x" aria-label="Close">✕</button></div>
            <div class="nb-set-row"><span>Text size</span>${seg("size", Object.keys(SIZES).map(k => `<button data-v="${k}" class="nb-size-${k}" aria-label="Text size ${k.toUpperCase()}">A</button>`).join(""))}</div>
            <div class="nb-set-row"><span>Line spacing</span>${seg("leading", Object.keys(LEADINGS).map(k => `<button data-v="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join(""))}</div>
            <div class="nb-set-row"><span>Paper</span>${seg("paper", Object.entries(PAPERS).map(([k, name]) => `<button data-v="${k}"><i class="nb-paper-dot nb-paper-${k}"></i>${name}</button>`).join(""))}</div>
            <button class="nb-set-reset">Reset to default</button>
          </div>
          ${this.marks ? `
          <div class="nb-pop nb-marks-pop" hidden>
            <div class="nb-pop-head"><b>Bookmarks &amp; highlights</b><button class="nb-pop-x" aria-label="Close">✕</button></div>
            <div class="nb-marks-list"></div>
          </div>` : ""}
        </div>
        ${this.marks ? `
        <div class="nb-tool" hidden>
          ${COLORS.map(c => `<button class="nb-swatch nb-hl-${c}" data-color="${c}" title="Highlight ${c}" aria-label="Highlight ${c}"></button>`).join("")}
          <button class="nb-tool-note" title="Highlight and add a note">✎ Note</button>
        </div>
        <div class="nb-editor" hidden>
          <div class="nb-editor-colors">${COLORS.map(c => `<button class="nb-swatch nb-hl-${c}" data-color="${c}" aria-label="${c}"></button>`).join("")}</div>
          <textarea class="nb-editor-note" rows="3" maxlength="600" placeholder="Add a note to this highlight…"></textarea>
          <div class="nb-editor-actions">
            <button class="nb-editor-del">Remove</button>
            <button class="nb-editor-done">Done</button>
          </div>
        </div>` : ""}`;
      article.append(this.root, this.shelf, this.measure, this.source);
      this.spreadEl = this.root.querySelector(".nb-spread");
      this.left = this.root.querySelector(".nb-left");
      this.right = this.root.querySelector(".nb-right");
      this.applyPrefs();
      this.renderSettings();
      this.updateFocusBtn();
      this.bind();
      this.paginate();
    }

    visible() { return this.article.isConnected && !!this.article.offsetParent; }

    // ---------- settings ----------
    applyPrefs() {
      const p = getPrefs();
      this.article.style.setProperty("--nb-scale", SIZES[p.size]);
      this.article.style.setProperty("--nb-leading", LEADINGS[p.leading]);
      this.article.dataset.nbPaper = p.paper;
    }
    renderSettings() {
      const p = getPrefs();
      this.root.querySelectorAll(".nb-aa-pop .nb-seg").forEach(s =>
        s.querySelectorAll("button").forEach(b => b.classList.toggle("on", p[s.dataset.pref] === b.dataset.v)));
    }
    updateFocusBtn() {
      const b = this.root.querySelector(".nb-focus-btn");
      b.setAttribute("aria-pressed", String(isFocus()));
      b.title = isFocus() ? "Leave focus mode (F or Esc)" : "Focus mode (F)";
    }

    // ---------- layout ----------
    // Two pages side by side when there is room; fixed at each layout so a spread number keeps its meaning
    get fitsTwo() { return this.article.clientWidth >= 900; }

    sizes() {
      const w = this.article.clientWidth;
      const pageW = this.fitsTwo ? Math.floor((Math.min(w, 1500) - 28) / 2) : Math.min(w, 760);
      // Fit a page, plus the controls under it, between the top bar and the phone's bottom bar
      const top = isFocus() ? 8 : Math.max(0, this.article.closest(".content-scroll")?.getBoundingClientRect().top || 0);
      const nav = document.querySelector(".bottom-nav");
      const bottom = nav && getComputedStyle(nav).display !== "none" ? Math.min(nav.getBoundingClientRect().top, window.innerHeight) : window.innerHeight;
      // Room for the controls under the page (on a phone they wrap onto more rows)
      const bar = this.root.querySelector(".nb-bar")?.offsetHeight || 0;
      const controls = Math.max(this.fitsTwo ? 100 : 130, bar + (isFocus() ? 70 : 50));
      const pageH = Math.max(420, Math.min(bottom - top - controls, 1000));
      return { pageW, pageH };
    }

    makePage(kind) {
      const page = el("div", `nb-page ${kind ? "nb-page-" + kind : ""}`);
      page.innerHTML = `<div class="nb-paper"><div class="nb-body"></div></div><div class="nb-folio"></div>`;
      page.body = page.querySelector(".nb-body");
      page.style.width = this.pageW + "px";
      page.style.height = this.pageH + "px";
      return page;
    }

    overflow(page) { return page.body.scrollHeight > page.body.clientHeight + 1; }

    // Cut a code listing taller than a page into page-sized runs of lines (each run keeps the syntax colours and
    // highlights: a copy of that stretch of the original). The copy button stays on the first piece and copies it all.
    splitCode(block, avail) {
      const pre = block.querySelector(":scope > pre");
      if (!pre) return null;
      const code = pre.querySelector(":scope > code") || pre;
      const text = code.textContent;
      const starts = [0];
      for (let i = text.indexOf("\n"); i >= 0 && i < text.length - 1; i = text.indexOf("\n", i + 1)) starts.push(i + 1);
      const cs = getComputedStyle(code);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6;
      const extra = block.getBoundingClientRect().height - starts.length * lh;   // padding, borders, a scrollbar
      const per = Math.max(4, Math.floor((avail * 0.94 - extra) / lh));
      if (starts.length <= per) return null;
      const pieces = [];
      let first = null;
      for (let i = 0; i < starts.length; i += per) {
        const s = starts[i], e = i + per < starts.length ? starts[i + per] - 1 : text.length;   // without the line break
        const r = rangeAt(code, s, e - s);
        if (!r) return null;
        const piece = block.cloneNode(false);
        piece.removeAttribute("id");
        piece.classList.add("nb-piece");
        if (i) piece.classList.add("nb-cont");
        const p = pre.cloneNode(false);
        p.removeAttribute("id");
        const c = code === pre ? p : p.appendChild(code.cloneNode(false));
        c.appendChild(r.cloneContents());
        p._orig = pre; p._off = s; p._first = first || p;
        first = first || p;
        piece.appendChild(p);
        pieces.push(piece);
      }
      const btn = block.querySelector(":scope > .code-copy");
      if (btn) pieces[0].appendChild(btn);
      return pieces;
    }

    // Scale a page's text and pictures down together (CSS zoom, so the layout shrinks too) until nothing scrolls
    shrinkToFit(page) {
      const fit = el("div", "nb-fit");
      fit.append(...page.body.childNodes);
      page.body.appendChild(fit);
      page.classList.add("nb-recto");
      this.measure.replaceChildren(page);
      const room = page.body.clientHeight - parseFloat(getComputedStyle(page.body).paddingTop) - parseFloat(getComputedStyle(page.body).paddingBottom) - 4;
      let z = 1;
      for (let i = 0; i < 12 && fit.getBoundingClientRect().height > room && z > 0.3; i++) {
        z = Math.max(0.3, z * Math.min(0.96, room / fit.getBoundingClientRect().height));
        fit.style.zoom = String(z);
      }
      page.classList.remove("nb-recto");
      this.measure.replaceChildren();
    }

    // Put every block back into the source tree in its original order
    restore() {
      for (const [node, parent] of this.moves) parent.appendChild(node);
      this.moves = [];
      for (const [orig, pieces] of this.splits) {
        const btn = pieces[0].querySelector(":scope > .code-copy");
        if (btn) orig.appendChild(btn);
        pieces[0].replaceWith(orig);
        pieces.slice(1).forEach(p => p.remove());
        orig._pieces = null;
      }
      this.splits = [];
      this.pages.forEach(p => p.remove());
      this.pages = [];
    }

    paginate() {
      if (this.busy) { this.pendingLayout = true; return; }
      this.hideFloating();
      let anchor = this.currentAnchor();
      if (anchor?.closest?.(".nb-piece")) anchor = anchor.closest(".nb-piece").querySelector("pre")._orig.parentNode;   // a split listing: its original
      // Hold the book's height while its pages are rebuilt, or the page around it scrolls back to the top
      this.article.style.minHeight = this.article.offsetHeight + "px";
      this.restore();
      // Highlights live in the original blocks: draw them again, so ones added or removed on a split listing stick
      if (this.marks) this.missing = applyHighlights([this.source], this.marks.highlights);
      this.applyPrefs();
      this.sig = layoutSig();
      this.twoUp = this.fitsTwo;
      const { pageW, pageH } = this.sizes();
      this.pageW = pageW; this.pageH = pageH;
      this.root.classList.toggle("nb-two", this.twoUp);
      this.root.style.setProperty("--nb-page-w", pageW + "px");
      this.root.style.setProperty("--nb-page-h", pageH + "px");

      // 1. Lay the whole text out once, in a column as wide as a page's text, and note where every block sits
      const probe = this.makePage();
      probe.classList.add("nb-recto");
      this.measure.replaceChildren(probe);
      const pcs = getComputedStyle(probe.body);
      const avail = probe.body.clientHeight - parseFloat(pcs.paddingTop) - parseFloat(pcs.paddingBottom) - 22;
      // No picture is ever taller than a page's text area
      this.article.style.setProperty("--nb-img-h", Math.max(80, avail - 8) + "px");
      probe.body.style.height = "auto";
      probe.body.append(...this.source.childNodes);
      const top0 = probe.body.getBoundingClientRect().top + parseFloat(pcs.paddingTop);
      const edges = new Map();   // a split wrapper's padding + border, repeated on every page it continues on
      const edge = (n) => {
        if (!edges.has(n)) {
          const c = getComputedStyle(n);
          // a split table also repeats its header row on every page
          edges.set(n, { top: parseFloat(c.paddingTop) + parseFloat(c.borderTopWidth) + (n._nbHead || 0), bottom: parseFloat(c.paddingBottom) + parseFloat(c.borderBottomWidth) + (n.classList.contains("kunal-note") ? 0 : parseFloat(c.marginBottom) || 0) });
        }
        return edges.get(n);
      };
      const items = [];
      let lastBottom = 0;
      const walk = (node, chain) => {
        if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())) return;
        // Split a wrapper only when it is big: a short callout or list stays in one piece
        if (splittable(node) && (node.classList.contains("kunal-note") || node.getBoundingClientRect().height > avail * 0.5)) {
          const c = [...chain, node];
          if (node.tagName === "TABLE") {
            // Every piece of the table keeps the same column widths and repeats the header
            const row = node.rows[0], cells = row ? [...row.cells] : [];
            node._nbTHead = node.tHead;   // remembered: the header itself moves onto the table's first page
            node._nbHead = node.tHead ? node.tHead.getBoundingClientRect().height : 0;
            node._nbCols = cells.length && cells.every(td => td.colSpan === 1) ? cells.map(td => td.getBoundingClientRect().width) : null;
          }
          for (const ch of [...node.childNodes]) walk(ch, c);
          return;
        }
        // A code listing taller than a page goes over several pages, a run of lines on each
        if (node.nodeType === 1 && node.classList.contains("code-block") && !node.classList.contains("nb-piece") && node.getBoundingClientRect().height > avail) {
          const pieces = this.splitCode(node, avail);
          if (pieces) {
            node.replaceWith(...pieces);
            node._pieces = pieces;
            this.splits.push([node, pieces]);
            for (const p of pieces) walk(p, chain);
            return;
          }
        }
        let r;
        if (node.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(node); r = rg.getBoundingClientRect(); }
        else r = node.getBoundingClientRect();
        let top = r.top - top0, bottom = r.bottom - top0;
        if (!r.width && !r.height) top = bottom = lastBottom;   // hidden or empty (a subtopic anchor)
        lastBottom = Math.max(lastBottom, bottom);
        items.push({ node, chain, top, bottom,
          lead: node.nodeType === 1 && (HEADING.test(node.tagName) || node.tagName === "THEAD" || node.classList.contains("notes-anchor")) });
      };
      for (const child of [...probe.body.childNodes]) walk(child, []);
      this.source.append(...probe.body.childNodes);
      this.measure.replaceChildren();

      // 2. Break into pages by position: a block that would cross the bottom starts the next page,
      //    bringing along the heading (and subtopic anchor) just before it
      const chainTop = (ch) => ch.reduce((s, n) => s + edge(n).top, 0);
      const chainBottom = (ch) => ch.reduce((s, n) => s + edge(n).bottom, 0);
      const lists = [];
      const tall = new Set();
      let cur = null, start = 0;
      for (const it of items) {
        if (!cur) { cur = []; lists.push(cur); start = it.top - chainTop(it.chain); }
        if (it.bottom - start + chainBottom(it.chain) > avail && cur.length) {
          let cut = cur.length;
          while (cut > 0 && cur[cut - 1].lead) cut--;
          if (cut === 0) cut = cur.length;   // never empty a page
          const carried = cur.splice(cut);
          cur = [...carried];
          lists.push(cur);
          const first = carried[0] || it;
          start = first.top - chainTop(first.chain);
        }
        cur.push(it);
        if (it.bottom - start + chainBottom(it.chain) > avail) tall.add(cur);   // too big for any page: it scrolls
      }
      // A page holding only a rule or an empty marker joins the page after it
      const slight = (list) => list.every(it => it.node.nodeName === "HR" || it.bottom - it.top < 4);
      for (let i = lists.length - 2; i >= 0; i--) if (slight(lists[i])) lists[i + 1].unshift(...lists.splice(i, 1)[0]);
      if (lists.length > 1 && slight(lists[lists.length - 1])) lists[lists.length - 2].push(...lists.pop());

      // 3. Build the pages, re-opening split wrappers (a Kunal note, a list) as shallow copies
      const seen = new Set(), liDone = new Map();
      const content = lists.map((list, i) => {
        const page = this.makePage();
        if (tall.has(list)) page.classList.add("nb-tall");
        let open = [];
        for (const it of list) {
          let d = 0;
          while (d < open.length && d < it.chain.length && open[d].orig === it.chain[d]) d++;
          open.length = d;
          for (let j = d; j < it.chain.length; j++) {
            const orig = it.chain[j], c = orig.cloneNode(false);
            c.classList.add("nb-clone");
            // A split wrapper goes back in its turn too, or restore() would put it after its siblings
            if (!seen.has(orig)) this.moves.push([orig, orig.parentNode]);
            if (seen.has(orig)) {
              c.classList.add("nb-cont");
              c.removeAttribute("id");
              if (orig.tagName === "OL") c.start = (orig.start || 1) + (liDone.get(orig) || 0);
              if (orig.tagName === "TABLE" && orig._nbTHead) {
                const head = orig._nbTHead.cloneNode(true);   // the header again: a copy nobody can highlight
                [head, ...head.querySelectorAll("*")].forEach(e => { e.classList.add("nb-clone"); e.removeAttribute("id"); });
                c.appendChild(head);
              }
            }
            if (orig.tagName === "TABLE" && orig._nbCols) {
              // An empty row of cells at the measured widths (<col> widths don't hold in these scrolling tables)
              const sizer = el("tbody", "nb-clone nb-sizer"), tr = el("tr", "nb-clone");
              sizer.setAttribute("aria-hidden", "true");
              orig._nbCols.forEach(w => { const td = el("td", "nb-clone"); td.style.width = td.style.minWidth = td.style.maxWidth = w + "px"; tr.appendChild(td); });
              sizer.appendChild(tr);
              c.prepend(sizer);
            }
            seen.add(orig);
            (j ? open[j - 1].clone : page.body).appendChild(c);
            open.push({ orig, clone: c });
          }
          const parent = it.node.parentNode;
          if (it.node.nodeName === "LI") liDone.set(parent, (liDone.get(parent) || 0) + 1);
          this.moves.push([it.node, parent]);
          (open.length ? open[open.length - 1].clone : page.body).appendChild(it.node);
        }
        return page;
      });
      // A block too big for any page (a long code listing, a big table) is shrunk until the page holds it
      content.filter(p => p.classList.contains("nb-tall")).forEach(p => this.shrinkToFit(p));
      const pagesOut = content.length ? content : [this.makePage()];

      // Front matter: a title page, then the index
      const title = this.makePage("title");
      title.body.innerHTML = `
        <div class="nb-title-ornament">❦</div>
        <div class="nb-title-kicker">${esc(this.opts.kicker || "Study notes")}</div>
        <h1 class="nb-title-main">${esc(this.opts.title || "Notes")}</h1>
        <div class="nb-title-rule"></div>
        <div class="nb-title-hint">Flip with the arrows, the ← → keys, or swipe.<br>${this.marks ? "Select any text to highlight it. " : ""}The index comes next.</div>`;

      const heads = pagesOut.flatMap((p, i) => [...p.body.querySelectorAll("h2, h3")]
        .filter(h => !h.closest(".kunal-note") || (h.tagName === "H2" && h.dataset.slug !== "table-of-contents"))
        .map(h => ({ h, i })));
      const index = [];
      let ip = this.makePage("index");
      this.measure.replaceChildren(ip);
      ip.body.innerHTML = `<h2 class="nb-index-title">Index</h2><ol class="nb-index"></ol>`;
      index.push(ip);
      const entries = [];
      for (const { h, i } of heads) {
        const li = el("li", `nb-index-item ${h.closest(".kunal-note") ? "lvl-sub" : "lvl-" + h.tagName.toLowerCase()}`,
          `<a href="#"><span class="nb-index-text">${esc(headingText(h))}</span><span class="nb-dots"></span><span class="nb-index-num">${i + 1}</span></a>`);   // the number now, so the page is measured with it
        li.h = h; li.pageIdx = i;
        let list = ip.body.querySelector(".nb-index");
        list.appendChild(li);
        if (this.overflow(ip)) {
          li.remove();
          ip = this.makePage("index");
          this.measure.replaceChildren(ip);
          ip.body.innerHTML = `<ol class="nb-index nb-cont"></ol>`;
          index.push(ip);
          ip.body.querySelector(".nb-index").appendChild(li);
        }
        entries.push(li);
      }
      this.measure.replaceChildren();

      this.front = 1 + index.length;
      this.pages = [title, ...index, ...pagesOut];
      if (this.twoUp && this.pages.length % 2) this.pages.push(this.blank());
      this.pages.forEach((p, n) => {
        p.pageNo = n;
        const f = p.querySelector(".nb-folio");
        f.textContent = n >= this.front ? String(n - this.front + 1) : "";
        p.classList.toggle("nb-verso", this.twoUp && n % 2 === 0);   // a left-hand page
        p.classList.toggle("nb-recto", !(this.twoUp && n % 2 === 0));
        this.shelf.appendChild(p);
      });
      entries.forEach(li => {
        li.querySelector(".nb-index-num").textContent = li.pageIdx + 1;
        li.querySelector("a").addEventListener("click", (e) => { e.preventDefault(); this.goToElement(li.h); });
      });
      this.total = this.pages.length;
      const range = this.root.querySelector(".nb-range");
      range.max = String(this.spreadCount() - 1);
      this.refreshMarks(false);

      const to = anchor ? this.pageOf(anchor) : 0;
      if (this.pinned) this.openAt(this.pinned);   // a page asked for before the layout settled (fonts, diagrams)
      else this.show(this.spreadFor(to < 0 ? 0 : to));
      this.article.style.minHeight = "";
      this.lastW = this.article.clientWidth;
      this.lastH = window.innerHeight;
    }

    // Where the reader is, as a content page out of how many: survives a different page size (roughly)
    where() {
      const [a] = this.pagesAt(this.spread);
      const content = this.total - this.front;
      return { page: Math.max(-1, (a?.pageNo ?? 0) - this.front), of: content };
    }
    openAt(where) {
      const { page, of } = where || {};
      if (page == null) return;
      this.pinned = where;
      const content = this.total - this.front;
      const p = page < 0 ? -1 : (of && of !== content ? Math.round(page / of * content) : page);
      this.show(p < 0 ? 0 : this.spreadFor(Math.min(this.total - 1, this.front + p)));
    }

    blank() { const p = this.makePage("blank"); p.classList.add("nb-recto"); p.body.innerHTML = `<div class="nb-blank-mark">❦</div>`; return p; }
    spreadCount() { return this.twoUp ? Math.ceil(this.total / 2) : this.total; }
    spreadFor(pageIdx) { return this.twoUp ? Math.floor(pageIdx / 2) : pageIdx; }
    pagesAt(s) { return this.twoUp ? [this.pages[2 * s], this.pages[2 * s + 1]] : [this.pages[s]]; }
    pageOf(node) { const p = (node._pieces?.[0] || node).closest?.(".nb-page"); return p ? this.pages.indexOf(p) : -1; }
    contentPages() { return this.pages.slice(this.front).filter(p => !p.classList.contains("nb-page-blank")); }
    contentRoots() { return this.contentPages().map(p => p.body); }
    firstBlock(page) { return [...page.body.querySelectorAll("*")].find(n => !n.classList.contains("nb-clone") && !n.classList.contains("nb-fit")) || null; }

    // The first block on screen, to land on the same place after a re-layout
    currentAnchor() {
      const [a] = this.pages.length ? this.pagesAt(this.spread) : [];
      if (!a || a.pageNo < this.front) return null;
      return this.firstBlock(a);
    }

    show(s) {
      s = Math.max(0, Math.min(this.spreadCount() - 1, s));
      this.spread = s;
      this.hideFloating();
      const [a, b] = this.pagesAt(s);
      this.shelf.append(...this.left.childNodes, ...this.right.childNodes);
      if (a) (this.twoUp ? this.left : this.right).appendChild(a);
      if (b) this.right.appendChild(b);
      a?.querySelector(".nb-body")?.scrollTo?.(0, 0);
      this.updateBar();
      this.opts.onPage?.(this.where(), this);
    }

    updateBar() {
      const s = this.spread, n = this.spreadCount();
      const range = this.root.querySelector(".nb-range");
      range.value = String(s);
      range.style.setProperty("--nb-fill", `${n > 1 ? (s / (n - 1)) * 100 : 100}%`);
      const here = this.pagesAt(s).filter(Boolean);
      const nums = here.filter(p => !p.classList.contains("nb-page-blank")).map(p => p.pageNo).filter(i => i >= this.front).map(i => i - this.front + 1);
      const last = this.total - this.front - (this.pages[this.total - 1]?.classList.contains("nb-page-blank") ? 1 : 0);
      this.root.querySelector(".nb-count").textContent = nums.length
        ? `Page ${nums.join("–")} of ${last}` : (s === 0 ? "Title & index" : "Index");
      this.root.querySelector(".nb-prev").disabled = this.root.querySelector(".nb-edge-prev").disabled = s === 0;
      this.root.querySelector(".nb-next").disabled = this.root.querySelector(".nb-edge-next").disabled = s >= n - 1;
      const markBtn = this.root.querySelector(".nb-mark-btn");
      if (markBtn) {
        const content = here.filter(p => p.pageNo >= this.front && !p.classList.contains("nb-page-blank"));
        const marked = content.some(p => p.classList.contains("nb-marked"));
        markBtn.disabled = !content.length;
        markBtn.setAttribute("aria-pressed", String(marked));
        markBtn.title = marked ? "Remove this bookmark (M)" : "Bookmark this page (M)";
        const count = this.marks.bookmarks.length + this.marks.highlights.length;
        this.root.querySelector(".nb-marks-count").textContent = count ? String(count) : "";
      }
      const fill = document.querySelector(".view.active #reading-progress-fill");
      if (fill && this.article.isConnected) fill.style.width = `${n > 1 ? (s / (n - 1)) * 100 : 100}%`;
    }

    // ---------- turning pages ----------
    next() { this.flipTo(this.spread + 1); }
    prev() { this.flipTo(this.spread - 1); }
    goToElement(node, { flash = true, instant = false } = {}) {
      const i = this.pageOf(node);
      if (i < 0) return;
      const after = () => {
        // A subtopic anchor is an empty marker: light up its heading
        const mark = node.classList.contains("notes-anchor") ? node.nextElementSibling : node;
        if (!flash || !mark) return;
        mark.classList.remove("nb-flash");
        void mark.offsetWidth;
        mark.classList.add("nb-flash");
        setTimeout(() => mark.classList.remove("nb-flash"), 1600);
      };
      if (instant) { this.pinned = null; this.show(this.spreadFor(i)); after(); }
      else this.flipTo(this.spreadFor(i), after);
    }

    flipTo(t, done) {
      this.pinned = null;   // the reader has moved on
      const n = this.spreadCount();
      t = Math.max(0, Math.min(n - 1, t));
      if (this.busy) return;
      if (t === this.spread) { done?.(); return; }
      this.hideFloating();
      this.keepInView();
      if (reduceMotion()) { this.show(t); done?.(); return; }
      const fwd = t > this.spread;
      const [curA, curB] = this.pagesAt(this.spread);
      const [tA, tB] = this.pagesAt(t);
      this.busy = true;

      const leaf = el("div", `nb-leaf ${fwd ? "nb-leaf-fwd" : "nb-leaf-back"}`);
      const front = el("div", "nb-face nb-face-front"), back = el("div", "nb-face nb-face-back");
      const shadeF = el("div", "nb-shade"), shadeB = el("div", "nb-shade");
      leaf.append(front, back);
      let from = 0, to = fwd ? -180 : 180;

      if (this.twoUp) {
        if (fwd) {          // the right page turns over to the left
          front.appendChild(curB); back.appendChild(tA);
          if (tB) this.right.appendChild(tB);
          leaf.style.left = "50%";
        } else {            // the left page turns back to the right
          front.appendChild(curA); back.appendChild(tB);
          this.left.appendChild(tA);
          leaf.style.left = "0";
        }
      } else {
        leaf.style.left = "0";
        if (fwd) {          // the page lifts off to the left, revealing the next
          front.appendChild(curA); back.appendChild(this.blank());
          this.right.appendChild(tA);
        } else {            // the previous page comes back from the left
          front.appendChild(tA); back.appendChild(this.blank());
          from = -180; to = 0;
        }
      }
      front.appendChild(shadeF); back.appendChild(shadeB);
      this.spreadEl.appendChild(leaf);
      this.root.classList.add("nb-flipping");

      const dur = 900, ease = "cubic-bezier(.45,.05,.25,1)";
      const anim = leaf.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${(from + to) / 2}deg) translateZ(1px)`, offset: .5 }, { transform: `rotateY(${to}deg)` }], { duration: dur, easing: ease });
      shadeF.animate([{ opacity: 0 }, { opacity: .55 }], { duration: dur / 2, easing: ease, fill: "forwards" });
      shadeB.animate([{ opacity: .55 }, { opacity: .55, offset: .5 }, { opacity: 0 }], { duration: dur, easing: ease, fill: "forwards" });
      anim.onfinish = () => {
        this.shelf.append(...[...leaf.querySelectorAll(".nb-page")].filter(p => this.pages.includes(p)));
        leaf.remove();
        this.root.classList.remove("nb-flipping");
        this.busy = false;
        this.show(t);
        done?.();
        if (this.pendingLayout) { this.pendingLayout = false; this.paginate(); }
      };
    }

    // Keep the book in view (the page may have been scrolled)
    keepInView() {
      const r = this.root.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * .4) this.root.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    // ---------- bookmarks & highlights ----------
    saveMarks() {
      if (!this.marks) return;
      this.opts.marks.save({
        bookmarks: this.marks.bookmarks.map(({ _page, ...b }) => b),
        highlights: this.marks.highlights.map(h => ({ ...h }))
      });
    }
    // Which pages have a bookmark (page numbers change with the page size, so this is found again each layout)
    refreshMarks(update = true) {
      if (!this.marks) return;
      const f = finder(this.contentRoots());
      this.pages.forEach(p => p.classList.remove("nb-marked"));
      for (const b of this.marks.bookmarks) {
        b._page = f.find(b)?.closest(".nb-page") || null;
        b._page?.classList.add("nb-marked");
      }
      if (update) this.updateBar();
      if (!this.root.querySelector(".nb-marks-pop")?.hidden) this.renderMarks();
    }
    // The section a page starts in: its own heading if it opens with one, else the last heading before it
    headingBefore(page, anchor) {
      if (anchor && /^H[23]$/.test(anchor.tagName)) return headingText(anchor);
      const heads = (p) => [...p.body.querySelectorAll("h2, h3")].filter(h => !h.classList.contains("nb-hidden-title"));
      for (let i = this.pages.indexOf(page) - 1; i >= this.front; i--) {
        const hs = heads(this.pages[i]);
        if (hs.length) return headingText(hs[hs.length - 1]);
      }
      const own = heads(page);
      return own.length ? headingText(own[0]) : (this.opts.title || "Notes");
    }
    toggleBookmark() {
      if (!this.marks || this.busy) return;
      const here = this.pagesAt(this.spread).filter(p => p && p.pageNo >= this.front && !p.classList.contains("nb-page-blank"));
      if (!here.length) return;
      const existing = this.marks.bookmarks.filter(b => here.includes(b._page));
      if (existing.length) {
        this.marks.bookmarks = this.marks.bookmarks.filter(b => !existing.includes(b));
        this.toast("Bookmark removed");
      } else {
        // A paragraph, list item or heading: those are never split, so it is found again at any page size
        const page = here[0];
        const anchor = [...page.body.querySelectorAll(BLOCK)].find(n => !n.closest(".nb-hidden-title")) || this.firstBlock(page);
        const loc = anchor && finder(this.contentRoots()).locate(anchor);
        if (!loc) return;
        this.marks.bookmarks.push({ id: uid(), ...loc, label: this.headingBefore(page, anchor), snippet: norm(anchor.textContent).slice(0, 90), at: Date.now() });
        this.toast("Page bookmarked");
      }
      this.saveMarks();
      this.refreshMarks();
    }
    toast(msg) { this.opts.toast?.(msg); }

    // Show the little colour bar over selected text
    onSelection() {
      if (!this.marks) return;
      const sel = window.getSelection();
      if (sel?.isCollapsed && Date.now() - (this.toolDown || 0) < 700) return;   // a tap on the colour bar cleared it
      if (this.busy || !sel || !sel.rangeCount || sel.isCollapsed || !this.visible()) return this.hideTool();
      const r = sel.getRangeAt(0);
      const startEl = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
      const page = startEl.closest?.(".nb-page");
      const block = startEl.closest?.(BLOCK);
      if (!page || !this.spreadEl.contains(page) || page.closest(".nb-leaf") || page.pageNo < this.front
          || !block || !page.contains(block) || block.classList.contains("nb-clone") || startEl.closest(SKIP)) return this.hideTool();
      const range = r.cloneRange();
      if (!block.contains(range.endContainer)) range.setEnd(block, block.childNodes.length);   // one block at a time
      if (!range.toString().trim()) return this.hideTool();
      this.sel = { range, block };
      const tool = this.root.querySelector(".nb-tool");
      tool.hidden = false;
      this.place(tool, range.getBoundingClientRect(), matchMedia("(pointer: coarse)").matches);
    }
    hideTool() { const t = this.root.querySelector(".nb-tool"); if (t) t.hidden = true; this.sel = null; }
    hideFloating() {
      this.hideTool();
      this.closeEditor();
    }
    // Put a floating box above (or below) a rect on screen, inside the book
    place(box, rect, below) {
      const rr = this.root.getBoundingClientRect();
      const w = box.offsetWidth, h = box.offsetHeight;
      let x = rect.left + rect.width / 2 - rr.left - w / 2;
      x = Math.max(4, Math.min(rr.width - w - 4, x));
      let y = below ? rect.bottom - rr.top + 10 : rect.top - rr.top - h - 10;
      if (y < 0) y = rect.bottom - rr.top + 10;
      box.style.left = x + "px";
      box.style.top = y + "px";
    }
    addHighlight(color, withNote) {
      const s = this.sel;
      if (!s || !s.block.isConnected) return this.hideTool();
      const loc = finder(this.contentRoots()).locate(s.block);
      if (!loc) return this.hideTool();
      const before = document.createRange();
      before.setStart(s.block, 0);
      before.setEnd(s.range.startContainer, s.range.startOffset);
      const hl = { id: uid(), color, note: "", quote: s.range.toString(), start: before.toString().length + (s.block._off || 0), ...loc, at: Date.now() };
      const marks = wrapRange(s.range, hl);
      window.getSelection()?.removeAllRanges();
      this.hideTool();
      if (!marks.length) return;
      this.marks.highlights.push(hl);
      this.saveMarks();
      this.updateBar();
      if (withNote) this.openEditor(hl.id, marks[0], true);
    }
    marksOf(id) { return [...this.article.querySelectorAll(`mark.nb-hl[data-hl="${id}"]`)]; }
    openEditor(id, markEl, focusNote) {
      const hl = this.marks.highlights.find(h => h.id === id);
      if (!hl) return;
      const ed = this.root.querySelector(".nb-editor");
      this.editing = hl;
      ed.hidden = false;
      ed.querySelectorAll(".nb-swatch").forEach(b => b.classList.toggle("on", b.dataset.color === hl.color));
      const note = ed.querySelector(".nb-editor-note");
      note.value = hl.note || "";
      this.place(ed, markEl.getBoundingClientRect(), true);
      if (focusNote) note.focus({ preventScroll: true });
    }
    closeEditor() {
      const ed = this.root.querySelector(".nb-editor");
      if (!ed || ed.hidden) return;
      ed.hidden = true;
      if (this.editing) this.saveMarks();
      this.editing = null;
    }
    restyle(hl) {
      this.marksOf(hl.id).forEach(m => { m.className = markClass(hl); if (hl.note) m.title = hl.note; else m.removeAttribute("title"); });
    }
    removeHighlight(id) {
      this.marks.highlights = this.marks.highlights.filter(h => h.id !== id);
      unwrap(this.article, id);
      this.saveMarks();
      this.updateBar();
    }

    renderMarks() {
      const list = this.root.querySelector(".nb-marks-list");
      const pageNum = (e) => { const p = e?.closest?.(".nb-page"); return p && this.pages.includes(p) ? p.pageNo - this.front + 1 : null; };
      const bms = this.marks.bookmarks.map(b => ({ b, n: pageNum(b._page) })).sort((x, y) => (x.n ?? 1e9) - (y.n ?? 1e9));
      const hls = this.marks.highlights.map(h => { const m = this.marksOf(h.id)[0]; return { h, m, n: pageNum(m) }; })
        .sort((x, y) => (x.n ?? 1e9) - (y.n ?? 1e9) || x.h.start - y.h.start);
      const pg = (n) => `<span class="nb-mark-page">${n ? "p. " + n : "not found"}</span>`;
      list.innerHTML = (!bms.length && !hls.length)
        ? `<div class="nb-marks-empty">Nothing here yet.<br>Select text on a page to highlight it, or press
             <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z" fill="currentColor"/></svg>
             to bookmark a page.</div>`
        : `${bms.length ? `<div class="nb-marks-sec">Bookmarks</div>` + bms.map(({ b, n }) => `
            <div class="nb-mark-item" data-kind="b" data-id="${b.id}">
              <button class="nb-mark-go" ${n ? "" : "disabled"}><span class="nb-mark-ico">🔖</span>
                <span class="nb-mark-text"><b>${esc(b.label || "Bookmark")}</b><small>${esc(b.snippet || "")}</small></span>${pg(n)}</button>
              <button class="nb-mark-del" title="Remove bookmark" aria-label="Remove bookmark">✕</button>
            </div>`).join("") : ""}
          ${hls.length ? `<div class="nb-marks-sec">Highlights</div>` + hls.map(({ h, n }) => `
            <div class="nb-mark-item" data-kind="h" data-id="${h.id}">
              <button class="nb-mark-go" ${n ? "" : "disabled"}><span class="nb-mark-bar nb-hl-${esc(h.color)}"></span>
                <span class="nb-mark-text"><q>${esc(h.quote.length > 180 ? h.quote.slice(0, 180) + "…" : h.quote)}</q>${h.note ? `<small class="nb-mark-note">✎ ${esc(h.note)}</small>` : ""}</span>${pg(n)}</button>
              <button class="nb-mark-del" title="Remove highlight" aria-label="Remove highlight">✕</button>
            </div>`).join("") : ""}`;
    }
    togglePop(cls, open) {
      const pop = this.root.querySelector(cls);
      if (!pop) return;
      const show = open ?? pop.hidden;
      this.root.querySelectorAll(".nb-pop").forEach(p => { p.hidden = true; });
      if (show) {
        if (cls === ".nb-marks-pop") this.renderMarks();
        pop.hidden = false;
      }
    }

    // ---------- input ----------
    bind() {
      const r = this.root;
      r.querySelector(".nb-next").onclick = r.querySelector(".nb-edge-next").onclick = () => this.next();
      r.querySelector(".nb-prev").onclick = r.querySelector(".nb-edge-prev").onclick = () => this.prev();
      r.querySelector(".nb-index-btn").onclick = () => this.flipTo(this.twoUp ? 0 : 1);
      r.querySelector(".nb-range").oninput = (e) => { this.pinned = null; this.show(+e.target.value); };
      r.querySelector(".nb-mode-btn").onclick = () => { setFocus(false); setMode("scroll"); this.destroy(); this.opts.onModeChange?.("scroll"); };
      r.querySelector(".nb-focus-btn").onclick = () => setFocus(!isFocus());
      r.querySelector(".nb-aa-btn").onclick = () => this.togglePop(".nb-aa-pop");
      r.querySelectorAll(".nb-pop-x").forEach(b => { b.onclick = () => { b.closest(".nb-pop").hidden = true; }; });
      r.querySelectorAll(".nb-aa-pop .nb-seg").forEach(s => s.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]");
        if (b) setPrefs({ ...getPrefs(), [s.dataset.pref]: b.dataset.v });
      }));
      r.querySelector(".nb-set-reset").onclick = () => setPrefs({ ...DEFAULT_PREFS });

      if (this.marks) {
        r.querySelector(".nb-mark-btn").onclick = () => this.toggleBookmark();
        r.querySelector(".nb-marks-btn").onclick = () => this.togglePop(".nb-marks-pop");
        r.querySelector(".nb-marks-list").addEventListener("click", (e) => {
          const item = e.target.closest(".nb-mark-item");
          if (!item) return;
          const { kind, id } = item.dataset;
          if (e.target.closest(".nb-mark-del")) {
            if (kind === "b") { this.marks.bookmarks = this.marks.bookmarks.filter(b => b.id !== id); this.saveMarks(); this.refreshMarks(); }
            else { this.removeHighlight(id); this.renderMarks(); }
            return;
          }
          if (!e.target.closest(".nb-mark-go")) return;
          const bm = kind === "b" && this.marks.bookmarks.find(b => b.id === id);
          const target = kind === "b" ? bm && finder(this.contentRoots()).find(bm) : this.marksOf(id)[0];
          if (!target) return;
          this.togglePop(".nb-marks-pop", false);
          this.goToElement(target, { flash: kind === "h" });
        });
        // Keep the selection while a colour is clicked
        const tool = r.querySelector(".nb-tool");
        tool.addEventListener("pointerdown", (e) => { e.preventDefault(); this.toolDown = Date.now(); });
        tool.addEventListener("mousedown", (e) => e.preventDefault());
        tool.addEventListener("click", (e) => {
          const b = e.target.closest("button");
          if (!b) return;
          if (b.classList.contains("nb-tool-note")) this.addHighlight("yellow", true);
          else this.addHighlight(b.dataset.color, false);
        });
        const ed = r.querySelector(".nb-editor");
        ed.querySelector(".nb-editor-colors").addEventListener("click", (e) => {
          const b = e.target.closest("button[data-color]");
          if (!b || !this.editing) return;
          this.editing.color = b.dataset.color;
          ed.querySelectorAll(".nb-swatch").forEach(x => x.classList.toggle("on", x === b));
          this.restyle(this.editing);
          this.saveMarks();
        });
        let noteTimer;
        ed.querySelector(".nb-editor-note").addEventListener("input", (e) => {
          if (!this.editing) return;
          this.editing.note = e.target.value.trim() ? e.target.value : "";
          this.restyle(this.editing);
          clearTimeout(noteTimer);
          noteTimer = setTimeout(() => this.saveMarks(), 400);
        });
        ed.querySelector(".nb-editor-note").addEventListener("keydown", (e) => {
          if (e.key === "Escape") { e.stopPropagation(); this.closeEditor(); }
        });
        ed.querySelector(".nb-editor-done").onclick = () => this.closeEditor();
        ed.querySelector(".nb-editor-del").onclick = () => { const id = this.editing?.id; this.editing = null; ed.hidden = true; if (id) this.removeHighlight(id); };
        // Click a highlight to change its colour, add a note or remove it
        this.spreadEl.addEventListener("click", (e) => {
          const m = e.target.closest("mark.nb-hl");
          if (!m || !window.getSelection()?.isCollapsed) return;
          this.openEditor(m.dataset.hl, m, false);
        });
        let selTimer;
        this.onSelChange = () => { clearTimeout(selTimer); selTimer = setTimeout(() => this.onSelection(), 180); };
        document.addEventListener("selectionchange", this.onSelChange);
      }

      // A click outside a panel closes it
      this.onDocDown = (e) => {
        if (!this.article.isConnected) return;
        if (!e.target.closest(".nb-pop, .nb-aa-btn, .nb-marks-btn")) this.root.querySelectorAll(".nb-pop").forEach(p => { p.hidden = true; });
        if (!e.target.closest(".nb-editor, mark.nb-hl")) this.closeEditor();
      };
      document.addEventListener("mousedown", this.onDocDown);
      document.addEventListener("touchstart", this.onDocDown, { passive: true });

      this.onKey = (e) => {
        if (!this.visible()) return;
        if (e.target.closest?.("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector(".modal-overlay.open, .modal-overlay.active, .kunal-reader.open, #kunal-reader, .viz-overlay.open")) return;
        if (e.key === "Escape") {
          const open = [...this.root.querySelectorAll(".nb-pop")].some(p => !p.hidden) || !this.root.querySelector(".nb-editor")?.hidden;
          if (open) { this.root.querySelectorAll(".nb-pop").forEach(p => { p.hidden = true; }); this.closeEditor(); e.preventDefault(); }
          else if (isFocus()) { setFocus(false); e.preventDefault(); }
          return;
        }
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); this.next(); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); this.prev(); }
        else if (e.key === "Home") { e.preventDefault(); this.flipTo(0); }
        else if (e.key === "End") { e.preventDefault(); this.flipTo(this.spreadCount() - 1); }
        else if (e.key === "f" || e.key === "F") { e.preventDefault(); setFocus(!isFocus()); }
        else if ((e.key === "m" || e.key === "M") && this.marks) { e.preventDefault(); this.toggleBookmark(); }
      };
      document.addEventListener("keydown", this.onKey);

      let x0 = null, y0 = 0;
      const stage = r.querySelector(".nb-stage");
      stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      stage.addEventListener("touchend", (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (!window.getSelection()?.isCollapsed) return;   // dragging a selection handle, not swiping
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) dx < 0 ? this.next() : this.prev();
      }, { passive: true });

      // Re-lay the pages when the width or the window height really changes (not for a phone's address bar),
      // or when the reading settings or focus mode changed while this book was out of sight
      let timer;
      this.lastW = this.article.clientWidth;
      this.lastH = window.innerHeight;
      this.onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!this.article.offsetParent) return;
          const w = this.article.clientWidth, h = window.innerHeight;
          if (Math.abs(w - this.lastW) < 8 && Math.abs(h - this.lastH) < 90 && this.sig === layoutSig()) return;
          this.busy ? this.relayout() : this.paginate();
        }, 180);
      };
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(this.article);
      window.addEventListener("resize", this.onResize);
      this.relayout = () => { clearTimeout(this.relayoutTimer); this.relayoutTimer = setTimeout(() => { if (!this.article.isConnected) return; this.busy ? this.relayout() : this.paginate(); }, 250); };
      if (document.fonts?.status === "loading") document.fonts.ready.then(this.relayout);
      // A picture that loads later changes its page's height
      this.article.addEventListener("load", (e) => { if (e.target.tagName === "IMG") this.relayout(); }, true);
    }

    // Back to a normal long page
    destroy() {
      this.closeEditor();
      this.restore();
      if (this.marks) applyHighlights([this.source], this.marks.highlights);
      document.removeEventListener("keydown", this.onKey);
      document.removeEventListener("mousedown", this.onDocDown);
      document.removeEventListener("touchstart", this.onDocDown);
      if (this.onSelChange) document.removeEventListener("selectionchange", this.onSelChange);
      this.ro?.disconnect();
      window.removeEventListener("resize", this.onResize);
      this.article.replaceChildren(...this.source.childNodes);
      this.article.classList.remove("nb-active");
      this.article.style.removeProperty("--nb-scale");
      this.article.style.removeProperty("--nb-leading");
      delete this.article.dataset.nbPaper;
      this.article.closest(".study-notes")?.classList.remove("nb-mode");
      delete this.article._notebook;
      books.delete(this);
    }
  }

  // A heading's text without its "Done" tick box
  function headingText(h) {
    const copy = h.cloneNode(true);
    copy.querySelector(".notes-done-toggle")?.remove();
    return norm(copy.textContent);
  }

  window.NoteBook = {
    mode: getMode,
    setMode,
    getPrefs,
    setPrefs,
    isFocus,
    setFocus,
    attach(article, opts) { return new NoteBook(article, opts); },
    // Saved highlights drawn into notes shown as one long page
    applyHighlights(article, marks) { applyHighlights([article], marks?.highlights || []); },
    // Show an element: flip to its page in book mode, scroll to it otherwise
    reveal(node, opts) {
      const book = node?.closest?.(".nb-active")?._notebook;
      if (book) { book.goToElement(node, opts); return true; }
      node?.scrollIntoView(opts?.scroll || { block: "start" });
      return false;
    }
  };
})();
