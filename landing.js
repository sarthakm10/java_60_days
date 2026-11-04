// ============================================================
// Java Fullstack — landing page behaviour
// Numbers and the curriculum timeline come from the same data files the app uses
// (data.js, data-beginner.js, question-sets.js), so they never go stale.
// ============================================================

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const STORAGE_KEY = "sde_prep_tracker_v2";   // the app's saved state (theme and progress live here)

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch (e) { return null; }
  }

  // ── Theme: shared with the app ──
  const ICON_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
  const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    $('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#070910" : "#f5f6fc");
    $("#theme-toggle").innerHTML = theme === "dark" ? ICON_SUN : ICON_MOON;
    if (persist) {
      const saved = readSaved() || {};
      saved.theme = theme;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch (e) { /* private mode */ }
    }
  }

  applyTheme(document.documentElement.getAttribute("data-theme") || "dark", false);
  $("#theme-toggle").addEventListener("click", () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
  });

  // ── Nav: glass background once scrolled, mobile menu, active section ──
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuBtn = $("#menu-btn");
  const links = $("#nav-links");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a", links).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", (e) => {
    if (links.classList.contains("open") && !e.target.closest("#nav")) setMenu(false);
  });

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$("a", links).forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  // "top" (the hero) has no nav link, so reaching it clears the highlight
  ["top", "tracks", "how", "curriculum", "features", "faq"].forEach(id => sectionObserver.observe(document.getElementById(id)));

  // ── Hero headline: words rise in one after another ──
  $$(".hero-title .word").forEach((w, i) => w.style.setProperty("--i", i));

  // ── Reveal on scroll ──
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  const observeReveals = () => $$(".reveal:not(.in), .phase-item:not(.in)").forEach(el => revealObserver.observe(el));

  const stepsObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { entry.target.classList.add("drawn"); stepsObserver.disconnect(); }
  }, { threshold: 0.4 });
  stepsObserver.observe($(".steps"));

  // ── Stats from the real data ──
  function computeStats() {
    const stats = {};
    if (typeof BEGINNER_DATA !== "undefined") {
      stats.beginnerDays = BEGINNER_DATA.length;
      stats.topics = BEGINNER_DATA.reduce((n, d) => n + d.topics.reduce((m, t) => m + t.subtopics.length, 0), 0);
      stats.exercises = BEGINNER_DATA.reduce((n, d) => n + d.practice.length, 0);
      if (typeof CURRICULUM_DATA !== "undefined") stats.totalDays = BEGINNER_DATA.length + CURRICULUM_DATA.length;
    }
    if (typeof QUESTION_SETS !== "undefined") {
      stats.sets = QUESTION_SETS.length;
      stats.problems = new Set(QUESTION_SETS.flatMap(s => s.problems.map(p => p[2]))).size;
    }
    return stats;
  }

  function countUp(el, target) {
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const start = performance.now();
    const duration = 1400 + Math.min(target, 1000) * 0.6;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function initCounters(stats) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = stats[el.dataset.count] ?? parseInt(el.textContent.replace(/\D/g, ""), 10);
        if (Number.isFinite(target)) countUp(el, target);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(el => countObserver.observe(el));
  }

  // ── Typing code editor ──
  const SNIPPETS = [
    {
      file: "Hello.java", day: "Day 1",
      code: 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      output: "Hello, World!"
    },
    {
      file: "WordCount.java", day: "Day 27",
      code: 'Map<String, Integer> counts = new HashMap<>();\nfor (String word : "to be or not to be".split(" ")) {\n    counts.merge(word, 1, Integer::sum);\n}\nSystem.out.println(counts);',
      output: "{not=1, be=2, or=1, to=2}"
    },
    {
      file: "HelloController.java", day: "Day 54",
      code: '@RestController\npublic class HelloController {\n\n    @GetMapping("/hello")\n    public Greeting hello(@RequestParam String name) {\n        return new Greeting("Hello", name);\n    }\n}',
      output: 'GET /hello?name=Asha  ->  200 OK\n{"message":"Hello","name":"Asha"}'
    },
    {
      file: "ranking.sql", day: "Day 49",
      code: "SELECT name, dept,\n       DENSE_RANK() OVER (\n           PARTITION BY dept\n           ORDER BY salary DESC\n       ) AS rnk\nFROM employees;",
      output: "Nisha | Engineering | 1\nAsha  | Engineering | 2"
    }
  ];

  const TOKENS = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(@\w+)|\b(public|private|class|static|void|new|for|return|final|int|SELECT|FROM|AS|OVER|PARTITION|BY|ORDER|DESC|DENSE_RANK)\b|\b(String|Map|HashMap|Integer|System|Greeting)\b|\b(\d+)\b/g;
  const CLASSES = ["tok-com", "tok-str", "tok-ann", "tok-kw", "tok-type", "tok-num"];

  function highlight(src) {
    const escaped = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(TOKENS, (match, ...groups) => {
      const which = groups.slice(0, 6).findIndex(g => g !== undefined);
      return which < 0 ? match : `<span class="${CLASSES[which]}">${match}</span>`;
    });
  }

  let heroVisible = true;
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe($("#hero-visual"));
  const waitUntilVisible = async () => { while (!heroVisible || document.hidden) await sleep(300); };

  async function typeLoop() {
    const codeEl = $("#typed-code"), fileEl = $("#editor-file"), dayEl = $("#editor-day"), out = $("#editor-output");
    if (reduceMotion) {
      codeEl.innerHTML = highlight(SNIPPETS[0].code);
      out.textContent = SNIPPETS[0].output;
      out.classList.add("show");
      return;
    }
    await sleep(900);
    for (let i = 0; ; i = (i + 1) % SNIPPETS.length) {
      const s = SNIPPETS[i];
      fileEl.textContent = s.file;
      dayEl.textContent = s.day;
      out.classList.remove("show");
      for (let k = 1; k <= s.code.length; k++) {
        await waitUntilVisible();
        codeEl.innerHTML = highlight(s.code.slice(0, k));
        const ch = s.code[k - 1];
        await sleep(ch === "\n" ? 110 : ch === " " ? 14 : 24 + Math.random() * 34);
      }
      await sleep(350);
      out.textContent = s.output;
      out.classList.add("show");
      await sleep(3000);
      out.classList.remove("show");
      for (let k = s.code.length; k >= 0; k -= 4) {
        codeEl.innerHTML = highlight(s.code.slice(0, Math.max(0, k)));
        await sleep(7);
      }
      await sleep(300);
    }
  }

  // ── Pointer effects: parallax cards, tilting editor, spotlight glow, magnetic buttons ──
  function initPointerEffects() {
    if (!finePointer || reduceMotion) return;

    const hero = $(".hero");
    const visual = $("#hero-visual");
    const editor = $(".editor");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      visual.style.setProperty("--px", px.toFixed(3));
      visual.style.setProperty("--py", py.toFixed(3));
      editor.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 5}deg)`;
    });
    hero.addEventListener("pointerleave", () => {
      visual.style.setProperty("--px", 0);
      visual.style.setProperty("--py", 0);
      editor.style.transform = "";
    });

    $$(".spotlight").forEach(card => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });

    $$(".magnetic").forEach(btn => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.12}px, ${dy * 0.25}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  // ── Tech marquee ──
  const STACK = [
    ["☕", "Java 21"], ["🧱", "OOP"], ["🗂️", "Collections"], ["🌊", "Streams"], ["🧵", "Concurrency"], ["⚙️", "JVM"],
    ["🧮", "DSA"], ["🗄️", "SQL"], ["🐘", "PostgreSQL"], ["🌿", "Spring Boot"], ["🔗", "Spring Data JPA"],
    ["🔐", "Spring Security · JWT"], ["🧪", "JUnit · Mockito"], ["🐳", "Docker"], ["📨", "Kafka"],
    ["☸️", "Kubernetes"], ["☁️", "AWS"], ["🏗️", "Terraform"], ["📐", "System Design"], ["🎤", "Interviews"]
  ];
  const pills = STACK.map(([icon, name]) => `<span class="tech"><span>${icon}</span>${name}</span>`).join("");
  $("#marquee-track").innerHTML = pills + pills;   // two copies, so the loop is seamless

  // ── Curriculum timeline ──
  const PHASE_INFO = [
    ["💻", "Install Java and write your first program, then variables, conditions, loops, methods, arrays, strings, debugging, Big-O and Git."],
    ["🧱", "Classes and objects, encapsulation, inheritance, polymorphism, interfaces and exceptions, ending with a library management project."],
    ["🗂️", "Generics, ArrayList, LinkedList, HashMap inside and out, sets, queues, TreeMap and an LRU cache."],
    ["⚡", "Lambdas, streams, Optional, the Date/Time API and the newest Java features."],
    ["🧵", "Threads, synchronization, thread pools, concurrent collections, virtual threads, memory and garbage collection."],
    ["🌐", "How the web works, Maven and unit tests, SQL from scratch to window functions, JDBC and NoSQL."],
    ["🌿", "Dependency injection, REST APIs, validation, testing, JPA, transactions and JWT security, and a Task Manager API built step by step, one step a day."],
    ["📐", "SOLID, the classic design patterns and low-level design interview problems."],
    ["☁️", "Docker, microservices, Kafka, Kubernetes, CI/CD, AWS and Terraform."],
    ["🎯", "System design, revision, behavioural answers, your resume and a final mock interview."]
  ];

  function buildTimeline() {
    if (typeof BEGINNER_DATA === "undefined") return;
    const phases = [];
    BEGINNER_DATA.forEach(d => {
      let p = phases.find(x => x.name === d.phase);
      if (!p) phases.push(p = { name: d.phase, from: d.day, to: d.day });
      p.to = d.day;
    });
    $("#timeline-list").innerHTML = phases.map((p, i) => {
      const [emoji, blurb] = PHASE_INFO[i] || ["📘", ""];
      const short = p.name.replace(/^Phase \d+:\s*/, "");
      const days = p.to - p.from + 1;
      return `
        <li class="phase-item">
          <div class="phase-card">
            <div class="phase-top"><span class="phase-emoji">${emoji}</span><span class="phase-range">Phase ${i + 1} · Days ${p.from}–${p.to}</span></div>
            <h3>${short}</h3>
            <p>${blurb}</p>
            <span class="phase-days">${days} days</span>
          </div>
        </li>`;
    }).join("");
  }

  function updateTimelineFill() {
    const timeline = $("#timeline");
    const r = timeline.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    $("#timeline-fill").style.height = `${(progress * 100).toFixed(1)}%`;
  }

  // ── Study heatmap illustration ──
  function buildHeatmap() {
    const box = $("#heat-visual");
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cells = [];
    for (let i = 0; i < 7 * 18; i++) {
      const recent = i % 18 > 9;   // busier towards the right, like a streak building up
      const r = rand();
      const level = r < (recent ? 0.12 : 0.4) ? 0 : Math.min(4, 1 + Math.floor(r * (recent ? 4.5 : 3)));
      cells.push(level);
    }
    box.innerHTML = cells.map(() => `<span class="heat-cell"></span>`).join("");
    const nodes = $$(".heat-cell", box);
    // the grid fills row by row; the bottom-right cell plays "today"
    nodes[7 * 18 - 1].classList.add("today");
    const paint = () => nodes.forEach((n, i) => {
      const col = i % 18;
      setTimeout(() => { if (cells[i]) n.classList.add(`l${cells[i]}`); }, reduceMotion ? 0 : col * 60);
    });
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { paint(); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(box);
  }

  // ── Returning learners: "continue where you left off" ──
  function showContinue() {
    const saved = readSaved();
    if (!saved || typeof BEGINNER_DATA === "undefined" || typeof CURRICULUM_DATA === "undefined") return;
    let track, checked;
    if (saved.tracks) {
      track = saved.track === "interview" ? "interview" : "beginner";
      checked = saved.tracks[track]?.checkedSubtopics || {};
    } else {
      track = "interview";   // saved before tracks existed
      checked = saved.checkedSubtopics || {};
    }
    const done = Object.keys(checked).length;
    if (!done) return;
    const days = track === "interview" ? CURRICULUM_DATA : BEGINNER_DATA;
    const current = days.find(d => d.topics.some(t => t.subtopics.some(s => !checked[s.id])));
    const day = current ? current.day : days.length;
    const name = track === "interview" ? "Interview" : "Beginner";
    const card = $("#continue-card");
    $(".continue-text", card).innerHTML = `Welcome back! You're on <strong>Day ${day}</strong> of the ${name} track, with ${done} topic${done === 1 ? "" : "s"} done.`;
    card.hidden = false;
    $("#nav-cta").textContent = `Continue Day ${day}`;
  }

  // ── Start ──
  function start() {
    const stats = computeStats();
    buildTimeline();
    buildHeatmap();
    showContinue();
    observeReveals();
    initCounters(stats);
    initPointerEffects();
    typeLoop();
    updateTimelineFill();
    addEventListener("scroll", updateTimelineFill, { passive: true });
    addEventListener("resize", updateTimelineFill);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
