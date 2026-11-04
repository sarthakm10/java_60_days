These two run in the browser: each is a single HTML page with its script inside. Save it as an `.html` file, open it with Live Server, and keep DevTools open. No libraries, just the DOM.

<!-- exercise: f9_e1 | Medium | A todo list with event delegation -->
**Concepts:** `createElement` · `textContent` · `classList.toggle` · form `submit` + `preventDefault` · event delegation with `closest`

**Task.** Make the todo list work:

1. Submitting the form adds a task (ignore empty input) and clears the input.
2. Clicking a task's text toggles it done (crossed out).
3. Clicking ✕ deletes the task.
4. The footer always shows how many tasks are left, like "2 tasks left" / "1 task left".

Use **one** click listener on the `ul` (event delegation), not one per task, and `textContent` for the task text, never `innerHTML`.

**Starter code** · `todo.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Todo</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 40px auto; }
    li { display: flex; gap: 8px; align-items: center; padding: 6px 0; }
    li span { flex: 1; cursor: pointer; }
    li.done span { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <h1>Todo</h1>
  <form id="add-form">
    <label for="title">New task</label>
    <input id="title" name="title" autocomplete="off">
    <button>Add</button>
  </form>
  <ul id="list"></ul>
  <p id="left">0 tasks left</p>

  <script>
    const form = document.querySelector("#add-form");
    const input = document.querySelector("#title");
    const list = document.querySelector("#list");
    const left = document.querySelector("#left");

    // TODO: addTask(text) builds <li><span>text</span><button>✕</button></li>
    // TODO: updateCount() writes "N tasks left" / "1 task left"
    // TODO: form submit → add (no page reload!)
    // TODO: ONE click listener on list: toggle when the span is clicked, remove when ✕ is clicked
  </script>
</body>
</html>
```

**Sample output** (what you should see after adding "Learn the DOM" and "Build a todo", then clicking the first one)

```text
Learn the DOM   ✕      ← crossed out
Build a todo    ✕
1 task left
```

<!-- hints -->
- In the submit handler call `event.preventDefault()` first, then `input.value.trim()`; skip empty text.
- Build the item with `document.createElement("li")`, a `span` whose `textContent` is the text, and a `button` with `aria-label="Delete task"`; `append` them.
- In the list's click handler, `event.target.closest("button")` finds a click on ✕; `event.target.closest("span")` a click on the text. Then `closest("li")` gets the item.
- Count with `list.querySelectorAll("li:not(.done)").length`, and call `updateCount()` after every change.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Todo</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 40px auto; }
    li { display: flex; gap: 8px; align-items: center; padding: 6px 0; }
    li span { flex: 1; cursor: pointer; }
    li.done span { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <h1>Todo</h1>
  <form id="add-form">
    <label for="title">New task</label>
    <input id="title" name="title" autocomplete="off">
    <button>Add</button>
  </form>
  <ul id="list"></ul>
  <p id="left">0 tasks left</p>

  <script>
    const form = document.querySelector("#add-form");
    const input = document.querySelector("#title");
    const list = document.querySelector("#list");
    const left = document.querySelector("#left");

    function addTask(text) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = text;                       // text, never parsed as HTML
      const del = document.createElement("button");
      del.textContent = "✕";
      del.setAttribute("aria-label", "Delete task");
      li.append(span, del);
      list.append(li);
    }

    function updateCount() {
      const n = list.querySelectorAll("li:not(.done)").length;
      left.textContent = `${n} task${n === 1 ? "" : "s"} left`;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();                        // stop the page reload
      const text = input.value.trim();
      if (!text) return;
      addTask(text);
      input.value = "";
      input.focus();
      updateCount();
    });

    list.addEventListener("click", (event) => {      // one listener for every task, now and later
      const item = event.target.closest("li");
      if (!item) return;
      if (event.target.closest("button")) item.remove();
      else if (event.target.closest("span")) item.classList.toggle("done");
      updateCount();
    });
  </script>
</body>
</html>
```

The list listener works for tasks added later because clicks **bubble** up from the span or button to the `ul`. `closest` makes it robust: it finds the button even if the click lands on something inside it. Using `textContent` means a task called `<img src=x onerror=alert(1)>` shows up as harmless text instead of running script (XSS, Module 25).

<!-- exercise: f9_e2 | Medium | Character counter and a remembered theme -->
**Concepts:** the `input` event · `classList` · `dataset` · `localStorage` · applying saved settings on load

**Task.** Two small features on one page:

1. **Counter**: under the textarea show "N characters left" (out of 140), updating on every keystroke. When fewer than 20 are left, add the `warn` class to the counter; at 0 left, disable the Post button.
2. **Theme**: the button switches between light and dark by setting `document.body.dataset.theme`. The choice is saved in `localStorage` and applied when the page loads, so a reload keeps it. The button text says what clicking it will do ("Dark mode" / "Light mode").

**Starter code** · `counter-theme.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Post</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 460px; margin: 40px auto; background: #fff; color: #111; }
    body[data-theme="dark"] { background: #111827; color: #f3f4f6; }
    textarea { width: 100%; height: 90px; }
    #count.warn { color: crimson; font-weight: bold; }
  </style>
</head>
<body>
  <button id="theme">Dark mode</button>
  <h1>New post</h1>
  <label for="post">What's on your mind?</label>
  <textarea id="post" maxlength="140"></textarea>
  <p id="count">140 characters left</p>
  <button id="send">Post</button>

  <script>
    const MAX = 140;
    const post = document.querySelector("#post");
    const count = document.querySelector("#count");
    const send = document.querySelector("#send");
    const themeBtn = document.querySelector("#theme");

    // TODO: updateCounter() on every input event
    // TODO: applyTheme(theme): set body's data-theme, the button text, and save to localStorage
    // TODO: on load, apply the saved theme (default "light")
    // TODO: the theme button toggles
  </script>
</body>
</html>
```

**Sample output**

```text
Typing 125 characters → "15 characters left" in red; reloading the page in dark mode keeps it dark.
```

<!-- hints -->
- `post.value.length` is the current length; listen for `"input"` (fires on every change, including paste).
- `count.classList.toggle("warn", leftCount < 20)`: the second argument forces the class on or off.
- `send.disabled = leftCount === 0` disables the button.
- Saved values are strings: `localStorage.getItem("theme") ?? "light"`. In `applyTheme`, set `document.body.dataset.theme = theme` and `localStorage.setItem("theme", theme)`.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Post</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 460px; margin: 40px auto; background: #fff; color: #111; }
    body[data-theme="dark"] { background: #111827; color: #f3f4f6; }
    textarea { width: 100%; height: 90px; }
    #count.warn { color: crimson; font-weight: bold; }
  </style>
</head>
<body>
  <button id="theme">Dark mode</button>
  <h1>New post</h1>
  <label for="post">What's on your mind?</label>
  <textarea id="post" maxlength="140"></textarea>
  <p id="count">140 characters left</p>
  <button id="send">Post</button>

  <script>
    const MAX = 140;
    const post = document.querySelector("#post");
    const count = document.querySelector("#count");
    const send = document.querySelector("#send");
    const themeBtn = document.querySelector("#theme");

    function updateCounter() {
      const leftCount = MAX - post.value.length;
      count.textContent = `${leftCount} character${leftCount === 1 ? "" : "s"} left`;
      count.classList.toggle("warn", leftCount < 20);
      send.disabled = leftCount === 0;
    }

    function applyTheme(theme) {
      document.body.dataset.theme = theme;
      themeBtn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      try { localStorage.setItem("theme", theme); } catch { /* storage blocked: still works for this visit */ }
    }

    let saved = "light";
    try { saved = localStorage.getItem("theme") ?? "light"; } catch { /* storage blocked */ }
    applyTheme(saved);
    updateCounter();

    post.addEventListener("input", updateCounter);
    themeBtn.addEventListener("click", () => {
      applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    });
  </script>
</body>
</html>
```

The style lives in CSS (`body[data-theme="dark"]`, `#count.warn`); the script only switches state with `dataset` and `classList`, which keeps the two concerns apart. `localStorage` can throw when storage is blocked (some private modes), so the solution wraps it: the page still works, it just won't remember. This tracker saves its own light/dark choice the same way.
