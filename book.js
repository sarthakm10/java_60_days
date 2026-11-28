// ============================================================
// NoteBook: shows a day's study notes as a book you flip through, instead of one long scroll.
//
// The rendered notes stay real DOM (checkboxes, copy buttons, diagrams keep their listeners):
// their blocks are *moved* into fixed-size pages, and wrappers like a Kunal note, a list or a
// blockquote are split across pages with shallow copies. Pages that aren't on screen wait in a
// hidden shelf inside the article, so ids and querySelector still find everything.
// The first pages are a title page and an index built from the headings, with page numbers.
// ============================================================
(function () {
  const SPLIT = new Set(["UL", "OL", "BLOCKQUOTE", "SECTION"]);
  const HEADING = /^H[1-4]$/;
  const MODE_KEY = "notes_view_mode";   // "book" | "scroll"
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Start fetching the book's serif now, so pages are measured with it
  try { document.fonts?.load("700 16px Fraunces"); document.fonts?.load("italic 400 16px Fraunces"); } catch {}

  function getMode() { try { return localStorage.getItem(MODE_KEY) || "book"; } catch { return "book"; } }
  function setMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch {} }

  // Which blocks may be split across pages
  function splittable(n) {
    if (n.nodeType !== 1) return false;
    if (SPLIT.has(n.tagName)) return n.children.length > 0;
    return n.tagName === "DIV" && n.classList.contains("kunal-note");
  }

  class NoteBook {
    constructor(article, opts = {}) {
      this.article = article;
      this.opts = opts;
      this.pages = [];
      this.spread = 0;
      this.busy = false;
      this.moves = [];
      article._notebook = this;
      article.classList.add("nb-active");
      article.closest(".study-notes")?.classList.add("nb-mode");

      // The original content goes into a hidden source tree; pages borrow its blocks
      this.source = el("div", "nb-source");
      this.source.append(...article.childNodes);
      const first = this.source.firstElementChild;
      if (first?.tagName === "H1") first.classList.add("nb-hidden-title");   // the title is already in the header
      this.shelf = el("div", "nb-shelf");
      this.measure = el("div", "nb-measure");
      this.root = el("div", "nb-book");
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
          <button class="nb-btn nb-mode-btn" title="Read as one long scrolling page">⇅ <span>Scroll view</span></button>
        </div>`;
      article.append(this.root, this.shelf, this.measure, this.source);
      this.spreadEl = this.root.querySelector(".nb-spread");
      this.left = this.root.querySelector(".nb-left");
      this.right = this.root.querySelector(".nb-right");
      this.bind();
      this.paginate();
    }

    // ---------- layout ----------
    // Two pages side by side when there is room; fixed at each layout so a spread number keeps its meaning
    get fitsTwo() { return this.article.clientWidth >= 900; }

    sizes() {
      const w = this.article.clientWidth;
      const pageW = this.fitsTwo ? Math.floor((Math.min(w, 1500) - 28) / 2) : Math.min(w, 760);
      // Fit a page, plus the controls under it, between the top bar and the phone's bottom bar
      const top = Math.max(0, this.article.closest(".content-scroll")?.getBoundingClientRect().top || 0);
      const nav = document.querySelector(".bottom-nav");
      const bottom = nav && getComputedStyle(nav).display !== "none" ? Math.min(nav.getBoundingClientRect().top, window.innerHeight) : window.innerHeight;
      const pageH = Math.max(420, Math.min(bottom - top - (this.fitsTwo ? 100 : 130), 1000));   // on a phone the controls take two rows
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

    // Put every block back into the source tree in its original order
    restore() {
      for (const [node, parent] of this.moves) parent.appendChild(node);
      this.moves = [];
      this.pages.forEach(p => p.remove());
      this.pages = [];
    }

    paginate() {
      if (this.busy) { this.pendingLayout = true; return; }
      const anchor = this.currentAnchor();
      // Hold the book's height while its pages are rebuilt, or the page around it scrolls back to the top
      this.article.style.minHeight = this.article.offsetHeight + "px";
      this.restore();
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
      probe.body.style.height = "auto";
      probe.body.append(...this.source.childNodes);
      const top0 = probe.body.getBoundingClientRect().top + parseFloat(pcs.paddingTop);
      const edges = new Map();   // a split wrapper's padding + border, repeated on every page it continues on
      const edge = (n) => {
        if (!edges.has(n)) {
          const c = getComputedStyle(n);
          edges.set(n, { top: parseFloat(c.paddingTop) + parseFloat(c.borderTopWidth), bottom: parseFloat(c.paddingBottom) + parseFloat(c.borderBottomWidth) });
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
          for (const ch of [...node.childNodes]) walk(ch, c);
          return;
        }
        let r;
        if (node.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(node); r = rg.getBoundingClientRect(); }
        else r = node.getBoundingClientRect();
        let top = r.top - top0, bottom = r.bottom - top0;
        if (!r.width && !r.height) top = bottom = lastBottom;   // hidden or empty (a subtopic anchor)
        lastBottom = Math.max(lastBottom, bottom);
        items.push({ node, chain, top, bottom,
          lead: node.nodeType === 1 && (HEADING.test(node.tagName) || node.classList.contains("notes-anchor")) });
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
            if (seen.has(orig)) {
              c.classList.add("nb-cont");
              c.removeAttribute("id");
              if (orig.tagName === "OL") c.start = (orig.start || 1) + (liDone.get(orig) || 0);
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
      const pagesOut = content.length ? content : [this.makePage()];

      // Front matter: a title page, then the index
      const title = this.makePage("title");
      title.body.innerHTML = `
        <div class="nb-title-ornament">❦</div>
        <div class="nb-title-kicker">${esc(this.opts.kicker || "Study notes")}</div>
        <h1 class="nb-title-main">${esc(this.opts.title || "Notes")}</h1>
        <div class="nb-title-rule"></div>
        <div class="nb-title-hint">Flip with the arrows, the ← → keys, or swipe.<br>The index comes next.</div>`;

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
        const copy = h.cloneNode(true);
        copy.querySelector(".notes-done-toggle")?.remove();
        const li = el("li", `nb-index-item ${h.closest(".kunal-note") ? "lvl-sub" : "lvl-" + h.tagName.toLowerCase()}`,
          `<a href="#"><span class="nb-index-text">${esc(copy.textContent.trim())}</span><span class="nb-dots"></span><span class="nb-index-num"></span></a>`);
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

      const to = anchor ? this.pageOf(anchor) : 0;
      if (this.pinned) this.openAt(this.pinned);   // a page asked for before the layout settled (fonts, diagrams)
      else this.show(this.spreadFor(to < 0 ? 0 : to));
      this.article.style.minHeight = "";
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
    pageOf(node) { const p = node.closest?.(".nb-page"); return p ? this.pages.indexOf(p) : -1; }

    // The first block on screen, to land on the same place after a re-layout
    currentAnchor() {
      const [a] = this.pages.length ? this.pagesAt(this.spread) : [];
      if (!a || a.pageNo < this.front) return null;
      return [...a.body.querySelectorAll("*")].find(n => !n.classList.contains("nb-clone")) || null;
    }

    show(s) {
      s = Math.max(0, Math.min(this.spreadCount() - 1, s));
      this.spread = s;
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
      const nums = this.pagesAt(s).filter(Boolean).map(p => p.pageNo).filter(i => i >= this.front).map(i => i - this.front + 1);
      const last = this.total - this.front - (this.pages[this.total - 1]?.classList.contains("nb-page-blank") ? 1 : 0);
      this.root.querySelector(".nb-count").textContent = nums.length
        ? `Page ${nums.join("–")} of ${last}` : (s === 0 ? "Title & index" : "Index");
      this.root.querySelector(".nb-prev").disabled = this.root.querySelector(".nb-edge-prev").disabled = s === 0;
      this.root.querySelector(".nb-next").disabled = this.root.querySelector(".nb-edge-next").disabled = s >= n - 1;
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
        if (node.closest(".nb-page").classList.contains("nb-tall")) node.scrollIntoView({ block: "start" });
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

    // ---------- input ----------
    bind() {
      const r = this.root;
      r.querySelector(".nb-next").onclick = r.querySelector(".nb-edge-next").onclick = () => this.next();
      r.querySelector(".nb-prev").onclick = r.querySelector(".nb-edge-prev").onclick = () => this.prev();
      r.querySelector(".nb-index-btn").onclick = () => this.flipTo(this.twoUp ? 0 : 1);
      r.querySelector(".nb-range").oninput = (e) => { this.pinned = null; this.show(+e.target.value); };
      r.querySelector(".nb-mode-btn").onclick = () => { setMode("scroll"); this.destroy(); this.opts.onModeChange?.("scroll"); };

      this.onKey = (e) => {
        if (!this.article.isConnected || !this.article.offsetParent) return;
        if (e.target.closest?.("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector(".modal-overlay.open, .kunal-reader.open")) return;
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); this.next(); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); this.prev(); }
        else if (e.key === "Home") { e.preventDefault(); this.flipTo(0); }
        else if (e.key === "End") { e.preventDefault(); this.flipTo(this.spreadCount() - 1); }
      };
      document.addEventListener("keydown", this.onKey);

      let x0 = null, y0 = 0;
      const stage = r.querySelector(".nb-stage");
      stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      stage.addEventListener("touchend", (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) dx < 0 ? this.next() : this.prev();
      }, { passive: true });

      // Re-lay the pages when the width or the window height really changes (not for a phone's address bar)
      let lastW = this.article.clientWidth, lastH = window.innerHeight, timer;
      this.onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!this.article.offsetParent) return;
          const w = this.article.clientWidth, h = window.innerHeight;
          if (Math.abs(w - lastW) < 8 && Math.abs(h - lastH) < 90) return;
          lastW = w; lastH = h;
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
      this.restore();
      document.removeEventListener("keydown", this.onKey);
      this.ro?.disconnect();
      window.removeEventListener("resize", this.onResize);
      this.article.replaceChildren(...this.source.childNodes);
      this.article.classList.remove("nb-active");
      this.article.closest(".study-notes")?.classList.remove("nb-mode");
      delete this.article._notebook;
    }
  }

  window.NoteBook = {
    mode: getMode,
    setMode,
    attach(article, opts) { return new NoteBook(article, opts); },
    // Show an element: flip to its page in book mode, scroll to it otherwise
    reveal(node, opts) {
      const book = node?.closest?.(".nb-active")?._notebook;
      if (book) { book.goToElement(node, opts); return true; }
      node?.scrollIntoView(opts?.scroll || { block: "start" });
      return false;
    }
  };
})();
