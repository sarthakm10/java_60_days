Effects connect a component to things outside React: data loading, timers, browser APIs. Both exercises use a fake API inside the page (random delays, occasional failures) so you can see loading states and race conditions without a server.

<!-- exercise: f17_e1 | Medium | User search with loading, errors and no race conditions -->
**Concepts:** `useEffect` with dependencies · async loading · loading / error / empty states · ignoring stale responses · cleanup

**Task.** `searchUsers(query)` in the starter is a fake API: it answers after a random 100–900 ms and fails about 1 time in 8. Build `UserSearch`:

1. Search as the user types (no button), but only for 2+ characters; for less, show "Type at least 2 letters".
2. Show "Searching…" while a request runs, the error message with a **Retry** button if it fails, "No users found" for an empty result, otherwise the list.
3. **No race conditions**: because delays are random, an older search can finish after a newer one. Only the latest query's results may ever be shown. The page has a log that records each response, so you can see stale ones being ignored.

**Starter code** · `user-search.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User search</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 420px; }
    input { width: 100%; padding: 8px; font-size: 16px; }
    .error { color: #b91c1c; }
    .log { font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useState } from "react";
    import { createRoot } from "react-dom/client";

    const USERS = ["Asha Rao", "Ashok Kumar", "Ben Thomas", "Bhavna Iyer", "Chen Li", "Divya Nair", "Farah Khan", "Rahul Das"];
    window.responseLog = [];

    function searchUsers(query) {
      const ms = 100 + Math.random() * 800;
      return new Promise((resolve, reject) => setTimeout(() => {
        window.responseLog.push(query);
        if (Math.random() < 0.125) reject(new Error("Server error, please try again"));
        else resolve(USERS.filter(u => u.toLowerCase().includes(query.toLowerCase())));
      }, ms));
    }

    function UserSearch() {
      const [query, setQuery] = useState("");
      // TODO: state for results / loading / error, and an effect that searches when query changes
      return (
        <div>
          <label htmlFor="q">Search users</label>
          <input id="q" value={query} onChange={e => setQuery(e.target.value)} />
          <p>TODO: states and results</p>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<UserSearch />);
  </script>
</body>
</html>
```

**Sample output**

```text
Type "as" → Searching… → Asha Rao, Ashok Kumar
Type "ash" quickly → only results for "ash" appear, even if the "as" response arrives last
```

<!-- hints -->
- One state for the whole request is tidy: `{ status: "idle" | "loading" | "error" | "done", results, error }`.
- In the effect: return early (setting the "idle" state) when `query.trim().length < 2`; otherwise set loading and call `searchUsers`.
- To ignore stale responses, declare `let ignore = false;` inside the effect, check `if (!ignore)` before setting state, and return a cleanup `() => { ignore = true; }`. When `query` changes, React runs the old effect's cleanup first.
- For Retry, add a `retry` number to state and to the effect's dependencies; bumping it re-runs the effect.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User search</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 420px; }
    input { width: 100%; padding: 8px; font-size: 16px; }
    .error { color: #b91c1c; }
    .log { font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useState } from "react";
    import { createRoot } from "react-dom/client";

    const USERS = ["Asha Rao", "Ashok Kumar", "Ben Thomas", "Bhavna Iyer", "Chen Li", "Divya Nair", "Farah Khan", "Rahul Das"];
    window.responseLog = [];

    function searchUsers(query) {
      const ms = 100 + Math.random() * 800;
      return new Promise((resolve, reject) => setTimeout(() => {
        window.responseLog.push(query);
        if (Math.random() < 0.125) reject(new Error("Server error, please try again"));
        else resolve(USERS.filter(u => u.toLowerCase().includes(query.toLowerCase())));
      }, ms));
    }

    function UserSearch() {
      const [query, setQuery] = useState("");
      const [retry, setRetry] = useState(0);
      const [request, setRequest] = useState({ status: "idle", results: [], error: null });

      useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
          setRequest({ status: "idle", results: [], error: null });
          return;
        }
        let ignore = false;
        setRequest(r => ({ ...r, status: "loading", error: null }));   // keep old results visible while loading
        searchUsers(q)
          .then(results => { if (!ignore) setRequest({ status: "done", results, error: null }); })
          .catch(err => { if (!ignore) setRequest({ status: "error", results: [], error: err.message }); });
        return () => { ignore = true; };                               // a newer query makes this one stale
      }, [query, retry]);

      const { status, results, error } = request;
      return (
        <div>
          <label htmlFor="q">Search users</label>
          <input id="q" value={query} onChange={e => setQuery(e.target.value)} />
          <div aria-live="polite">
            {status === "idle" && <p>Type at least 2 letters</p>}
            {status === "loading" && <p>Searching…</p>}
            {status === "error" && (
              <p className="error" role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry</button></p>
            )}
            {status === "done" && results.length === 0 && <p>No users found</p>}
          </div>
          {status !== "idle" && status !== "error" && (
            <ul data-testid="results">{results.map(name => <li key={name}>{name}</li>)}</ul>
          )}
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<UserSearch />);
  </script>
</body>
</html>
```

Every time `query` changes, React runs the **previous** effect's cleanup before the new effect, setting that request's `ignore` to true. So a slow response for "as" that arrives after "ash" is simply dropped: `window.responseLog` shows it arrived, but the screen never shows it. With `fetch` you'd also pass an `AbortController` signal and abort in the cleanup, so the browser stops the request too. In a real app, add a debounce (Module 18's `useDebounce`) so you don't send a request per keystroke.

<!-- exercise: f17_e2 | Medium | A stopwatch with laps -->
**Concepts:** `useEffect` cleanup · `setInterval` · `useRef` for values that don't render · functional updates · unmounting

**Task.** Build a `Stopwatch` with Start/Pause, Lap and Reset, showing the time as `mm:ss.t` (tenths), and a list of laps (newest first) with the time since the previous lap. A **Hide stopwatch** checkbox unmounts it: the interval must stop when it's hidden (the page counts running intervals, so you can check).

**Starter code** · `stopwatch.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stopwatch</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .time { font: 700 44px ui-monospace, monospace; }
    button { font-size: 16px; margin-right: 6px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useRef, useState } from "react";
    import { createRoot } from "react-dom/client";

    // Counts live intervals, so you can check that unmounting stops yours
    window.activeIntervals = 0;
    const startInterval = (fn, ms) => { window.activeIntervals++; return setInterval(fn, ms); };
    const stopInterval = (id) => { window.activeIntervals--; clearInterval(id); };

    const format = (tenths) => {
      const mm = String(Math.floor(tenths / 600)).padStart(2, "0");
      const ss = String(Math.floor((tenths % 600) / 10)).padStart(2, "0");
      return `${mm}:${ss}.${tenths % 10}`;
    };

    function Stopwatch() {
      // TODO: elapsed tenths, running, laps; an effect that starts and stops the interval
      return <div className="time">00:00.0</div>;
    }

    function App() {
      const [hidden, setHidden] = useState(false);
      return (
        <>
          <label><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hide stopwatch</label>
          {!hidden && <Stopwatch />}
        </>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
02:15.4      [Pause] [Lap] [Reset]
Lap 2  00:41.2  (+00:20.0)
Lap 1  00:21.2  (+00:21.2)
Hiding the stopwatch → window.activeIntervals is 0
```

<!-- hints -->
- Use `startInterval`/`stopInterval` from the starter instead of `setInterval`/`clearInterval`.
- Put the interval in an effect that depends on `running`: start it when `running` is true, and return a cleanup that stops it. Pausing, resetting and unmounting then all stop it automatically.
- Inside the interval, use `setTenths(t => t + 1)`: a plain `setTenths(tenths + 1)` would capture the starting value and stay stuck (a stale closure).
- Laps can be state (`[{ at, split }]`); the split is `tenths` minus the previous lap's `at`. A `useRef` is useful for values you need between renders but don't display.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stopwatch</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .time { font: 700 44px ui-monospace, monospace; }
    button { font-size: 16px; margin-right: 6px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useRef, useState } from "react";
    import { createRoot } from "react-dom/client";

    window.activeIntervals = 0;
    const startInterval = (fn, ms) => { window.activeIntervals++; return setInterval(fn, ms); };
    const stopInterval = (id) => { window.activeIntervals--; clearInterval(id); };

    const format = (tenths) => {
      const mm = String(Math.floor(tenths / 600)).padStart(2, "0");
      const ss = String(Math.floor((tenths % 600) / 10)).padStart(2, "0");
      return `${mm}:${ss}.${tenths % 10}`;
    };

    function Stopwatch() {
      const [tenths, setTenths] = useState(0);
      const [running, setRunning] = useState(false);
      const [laps, setLaps] = useState([]);
      const lastLapAt = useRef(0);                         // needed between renders, never displayed

      useEffect(() => {
        if (!running) return;
        const id = startInterval(() => setTenths(t => t + 1), 100);
        return () => stopInterval(id);                      // pause, reset and unmount all land here
      }, [running]);

      function lap() {
        const split = tenths - lastLapAt.current;             // read the ref now, not inside the updater
        lastLapAt.current = tenths;
        setLaps(ls => [{ n: ls.length + 1, at: tenths, split }, ...ls]);
      }

      function reset() {
        setRunning(false);
        setTenths(0);
        setLaps([]);
        lastLapAt.current = 0;
      }

      return (
        <div>
          <div className="time" data-testid="time">{format(tenths)}</div>
          <button onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Start"}</button>
          <button onClick={lap} disabled={!running}>Lap</button>
          <button onClick={reset}>Reset</button>
          <ol reversed>
            {laps.map(l => <li key={l.n}>Lap {l.n} {format(l.at)} (+{format(l.split)})</li>)}
          </ol>
        </div>
      );
    }

    function App() {
      const [hidden, setHidden] = useState(false);
      return (
        <>
          <label><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hide stopwatch</label>
          {!hidden && <Stopwatch />}
        </>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

The effect describes "while running, tick every 100 ms", and its cleanup undoes it, so there's no special code for pause, reset or unmount: whenever `running` changes or the component disappears, React runs the cleanup. One trap in `lap`: the updater function you pass to `setLaps` doesn't run immediately; React calls it later, during the next render. If it read `lastLapAt.current`, it would see the value *after* the next line had already updated it, and every split would be 0. So `lap` reads the ref first, into a normal variable. Check `window.activeIntervals` in the console after hiding the stopwatch: it's back to 0. Remove the cleanup and it keeps climbing, a classic memory leak. (`setInterval` drifts slightly over long periods; for precise timing, store the start time and compute elapsed with `Date.now()`.)
