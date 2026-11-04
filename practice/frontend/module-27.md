Two classic machine-coding builds in plain JavaScript (some companies ask for vanilla JS, and it proves you understand what React does for you). Set a timer for 45 minutes each, build it, then compare with the solution. Save each as an `.html` file and open it with Live Server.

<!-- exercise: f27_e1 | Medium | A star rating widget -->
**Concepts:** generating elements · hover preview · `aria-checked` radio group · keyboard support · a `change` callback

**Task.** Build `createRating(container, { max = 5, onChange })`:

1. Shows `max` star buttons. Hovering previews that many filled stars; leaving restores the current rating.
2. Clicking a star sets the rating and calls `onChange(value)`; clicking the current rating again clears it to 0.
3. Keyboard: Tab focuses the widget; ← and → lower and raise the rating.
4. Accessible: the container is `role="radiogroup"` with a label, each star is `role="radio"` with `aria-checked` and an `aria-label` like "3 stars".

The page shows "You rated N / 5" under the widget.

**Starter code** · `rating.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rating</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .star { font-size: 32px; background: none; border: none; cursor: pointer; color: #cbd5e1; padding: 0 2px; }
    .star.on { color: #f59e0b; }
    .rating:focus-within { outline: 2px solid #2563eb; outline-offset: 4px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Rate this course</h1>
  <div id="rating"></div>
  <p id="result">Not rated yet</p>

  <script>
    function createRating(container, { max = 5, onChange = () => {} } = {}) {
      let value = 0;
      // TODO: build the buttons, paint(n) to fill stars, hover / click / keyboard
    }

    createRating(document.querySelector("#rating"), {
      onChange: (v) => {
        document.querySelector("#result").textContent = v ? `You rated ${v} / 5` : "Not rated yet";
      },
    });
  </script>
</body>
</html>
```

**Sample output**

```text
★★★★☆   (hovering the 4th star; leaving shows the saved rating again)
You rated 4 / 5   (after clicking it; → makes it 5, ← makes it 3)
```

<!-- hints -->
- Keep the state in one variable (`value`) and write one `paint(n)` function that turns the first `n` stars on (`classList.toggle("on", i < n)`) and updates `aria-checked`. Every event just calls `paint` with the right number.
- Use event delegation: one `mouseover`, one `click` and one `keydown` listener on the container, reading the star number from `event.target.closest(".star")?.dataset.value`.
- For keyboard support with a radio group, only the checked star (or the first, when nothing is rated) should have `tabIndex = 0`; the others `-1`. Move focus to the new star after an arrow key.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rating</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .star { font-size: 32px; background: none; border: none; cursor: pointer; color: #cbd5e1; padding: 0 2px; }
    .star.on { color: #f59e0b; }
    .rating:focus-within { outline: 2px solid #2563eb; outline-offset: 4px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Rate this course</h1>
  <div id="rating"></div>
  <p id="result">Not rated yet</p>

  <script>
    function createRating(container, { max = 5, onChange = () => {} } = {}) {
      let value = 0;
      container.classList.add("rating");
      container.setAttribute("role", "radiogroup");
      container.setAttribute("aria-label", "Rating");

      const stars = Array.from({ length: max }, (_, i) => {
        const star = document.createElement("button");
        star.type = "button";
        star.className = "star";
        star.textContent = "★";
        star.dataset.value = i + 1;
        star.setAttribute("role", "radio");
        star.setAttribute("aria-label", `${i + 1} star${i ? "s" : ""}`);
        container.append(star);
        return star;
      });

      function paint(n) {
        stars.forEach((star, i) => {
          star.classList.toggle("on", i < n);
          star.setAttribute("aria-checked", String(i + 1 === value));
          star.tabIndex = i === Math.max(value, 1) - 1 ? 0 : -1;   // one tab stop for the group
        });
      }

      function set(n) {
        value = Math.max(0, Math.min(max, n));
        paint(value);
        onChange(value);
      }

      const starOf = (event) => Number(event.target.closest(".star")?.dataset.value || 0);

      container.addEventListener("mouseover", (e) => { if (starOf(e)) paint(starOf(e)); });
      container.addEventListener("mouseleave", () => paint(value));
      container.addEventListener("click", (e) => {
        const n = starOf(e);
        if (n) set(n === value ? 0 : n);
      });
      container.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        set(value + step);
        stars[Math.max(value, 1) - 1].focus();
      });

      paint(0);
      return { get value() { return value; }, set };
    }

    createRating(document.querySelector("#rating"), {
      onChange: (v) => {
        document.querySelector("#result").textContent = v ? `You rated ${v} / 5` : "Not rated yet";
      },
    });
  </script>
</body>
</html>
```

The design points to talk through: **one source of truth** (`value`) and **one render function** (`paint`), so hover, click and keys can't get out of sync; **event delegation** on the container; a **callback API** (`onChange`) so the widget is reusable; and the **radio group pattern** for accessibility, with a single tab stop and arrow keys inside it. The same structure turns into a React component almost line for line: `value` becomes state, and `paint` becomes the JSX.

<!-- exercise: f27_e2 | Hard | Debounced search with keyboard navigation -->
**Concepts:** debounce · ignoring stale responses · rendering lists safely · ↑ ↓ Enter Escape · `aria-activedescendant`

**Task.** Build a search box over the fake API in the starter (`searchApi` returns matching cities after a random 50–400 ms delay):

1. Search only after 250 ms without typing, and only for 2+ characters.
2. Show "Searching…", "No results", or the results list. Results must never be from an older query, even though responses arrive in random order.
3. Highlight the matching part of each result with a `mark` element, **without** `innerHTML`.
4. ↑/↓ move the highlighted option, Enter picks it (puts it in the input and closes the list), Escape closes the list. Clicking an option picks it too.

**Starter code** · `search.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>City search</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 360px; }
    input { width: 100%; padding: 8px; font-size: 16px; }
    ul { list-style: none; margin: 4px 0 0; padding: 0; border: 1px solid #ddd; border-radius: 6px; }
    li { padding: 8px; cursor: pointer; }
    li[aria-selected="true"] { background: #dbeafe; }
    mark { background: #fde68a; }
    #status { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <label for="q">Search cities</label>
  <input id="q" role="combobox" aria-expanded="false" aria-controls="results" aria-autocomplete="list" autocomplete="off">
  <p id="status" aria-live="polite"></p>
  <ul id="results" role="listbox" hidden></ul>
  <p id="picked"></p>

  <script>
    const CITIES = ["Bengaluru", "Bhopal", "Bhubaneswar", "Chennai", "Delhi", "Hyderabad", "Jaipur", "Kolkata",
      "Lucknow", "Mumbai", "Mysuru", "Nagpur", "Patna", "Pune", "Surat", "Thane", "Vadodara", "Visakhapatnam"];

    // A fake API: matching cities after a random delay, so responses can come back out of order
    function searchApi(query) {
      const delay = 50 + Math.random() * 350;
      const q = query.toLowerCase();
      return new Promise(resolve => setTimeout(() => resolve(CITIES.filter(c => c.toLowerCase().includes(q))), delay));
    }

    const input = document.querySelector("#q");
    const list = document.querySelector("#results");
    const status = document.querySelector("#status");

    // TODO: debounce, latest-query check, render with <mark>, keyboard, click, pick
  </script>
</body>
</html>
```

**Sample output**

```text
Typing "bh" quickly → after 250 ms: Searching… → Bhopal, Bhubaneswar (with "Bh" highlighted)
↓ ↓ Enter → the input shows "Bhubaneswar" and the list closes
```

<!-- hints -->
- Debounce the input handler (Module 12's `debounce`).
- To drop stale responses, keep a counter `let latest = 0;`. Each search does `const id = ++latest;` and, when its results arrive, ignores them if `id !== latest`.
- Build each option with `createElement`: text before the match, a `mark` with the match, text after, all through `textContent` or text nodes. Give each option an id and set the input's `aria-activedescendant` to the active one.
- Keep `active` (an index) in a variable. Use `mousedown` + `preventDefault` on the list so clicking an option doesn't blur the input before the click registers.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>City search</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 360px; }
    input { width: 100%; padding: 8px; font-size: 16px; }
    ul { list-style: none; margin: 4px 0 0; padding: 0; border: 1px solid #ddd; border-radius: 6px; }
    li { padding: 8px; cursor: pointer; }
    li[aria-selected="true"] { background: #dbeafe; }
    mark { background: #fde68a; }
    #status { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <label for="q">Search cities</label>
  <input id="q" role="combobox" aria-expanded="false" aria-controls="results" aria-autocomplete="list" autocomplete="off">
  <p id="status" aria-live="polite"></p>
  <ul id="results" role="listbox" hidden></ul>
  <p id="picked"></p>

  <script>
    const CITIES = ["Bengaluru", "Bhopal", "Bhubaneswar", "Chennai", "Delhi", "Hyderabad", "Jaipur", "Kolkata",
      "Lucknow", "Mumbai", "Mysuru", "Nagpur", "Patna", "Pune", "Surat", "Thane", "Vadodara", "Visakhapatnam"];

    function searchApi(query) {
      const delay = 50 + Math.random() * 350;
      const q = query.toLowerCase();
      return new Promise(resolve => setTimeout(() => resolve(CITIES.filter(c => c.toLowerCase().includes(q))), delay));
    }

    const input = document.querySelector("#q");
    const list = document.querySelector("#results");
    const status = document.querySelector("#status");

    let results = [];
    let active = -1;
    let latest = 0;                                   // id of the newest search

    function debounce(fn, wait) {
      let timer;
      return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
    }

    function open(show) {
      list.hidden = !show;
      input.setAttribute("aria-expanded", String(show));
    }

    function highlighted(text, query) {               // text with <mark> around the match, no innerHTML
      const li = document.createElement("li");
      const i = text.toLowerCase().indexOf(query.toLowerCase());
      if (i < 0) { li.textContent = text; return li; }
      const mark = document.createElement("mark");
      mark.textContent = text.slice(i, i + query.length);
      li.append(text.slice(0, i), mark, text.slice(i + query.length));
      return li;
    }

    function render(query) {
      list.replaceChildren(...results.map((city, i) => {
        const li = highlighted(city, query);
        li.id = `opt-${i}`;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === active));
        li.dataset.index = i;
        return li;
      }));
      if (active >= 0) input.setAttribute("aria-activedescendant", `opt-${active}`);
      else input.removeAttribute("aria-activedescendant");
      open(results.length > 0);
    }

    async function search(query) {
      const id = ++latest;
      if (query.length < 2) { results = []; status.textContent = ""; open(false); return; }
      status.textContent = "Searching…";
      const found = await searchApi(query);
      if (id !== latest) return;                     // an older search finished late: ignore it
      results = found;
      active = -1;
      status.textContent = found.length ? `${found.length} result${found.length === 1 ? "" : "s"}` : "No results";
      render(query);
    }

    function pick(i) {
      input.value = results[i];
      document.querySelector("#picked").textContent = `Picked: ${results[i]}`;
      results = [];
      active = -1;
      latest++;                                      // a search still in flight shouldn't reopen the list
      status.textContent = "";
      render("");
    }

    const debouncedSearch = debounce(search, 250);
    input.addEventListener("input", () => debouncedSearch(input.value.trim()));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { open(false); return; }
      if (!results.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(input.value.trim()); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(input.value.trim()); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(active); }
    });

    list.addEventListener("mousedown", (e) => e.preventDefault());   // keep focus in the input
    list.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-index]");
      if (li) pick(Number(li.dataset.index));
    });
  </script>
</body>
</html>
```

The pieces to call out in the interview: the **debounce** saves requests; the **latest-id check** is what really prevents wrong results, because debouncing alone can't stop a slow old response landing after a fast new one (with `fetch` you'd also abort the old request); **text nodes and `mark` elements** keep user-visible text safe from XSS; and the **combobox pattern** (`role="combobox"`, `aria-activedescendant`, `aria-live` status) makes it usable with a screen reader while focus stays in the input. Module 27's React version of the same component is a good comparison.
