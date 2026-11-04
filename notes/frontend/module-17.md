# Frontend 17 — Effects and Data Fetching

> **Rendering must be pure, but apps need side effects:** loading data from your API, timers, subscriptions, talking to the DOM directly. `useEffect` is how a component syncs with the world outside React. It's powerful and easy to misuse, so this module covers both the right uses and the wrong ones.

<!-- subtopic: f17_s1 -->
### useEffect: when it runs, dependencies and cleanup

```tsx
import { useEffect, useState } from "react";

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);   // start something
    return () => clearInterval(id);                          // cleanup: stop it
  }, []);                                                    // dependency array

  return <p>{now.toLocaleTimeString()}</p>;
}
```

An effect runs **after** React has updated the screen. The dependency array decides **when**:

| Dependencies | Effect runs |
|---|---|
| none: `useEffect(fn)` | after **every** render (rarely what you want) |
| `[]` | once, after the first render ("on mount") |
| `[userId, page]` | after the first render, and again whenever `userId` or `page` changed |

The **cleanup** function runs before the effect runs again and when the component is removed ("unmount"). Use it to undo whatever the effect set up: clear timers, remove listeners, cancel requests, close connections. Forgetting it causes leaks and "state update on an unmounted component" bugs.

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

**List every value from the component that the effect uses** (props, state, functions defined in the component) in the dependency array. The `react-hooks/exhaustive-deps` ESLint rule does this for you. Leaving one out gives you an effect that uses **stale** values from an old render.

Think of an effect as "keep X in sync with these values", not "run this at mount time".

<details>
<summary>What does the function returned from useEffect do, and when does it run?</summary>

It's the cleanup. It runs before the effect runs again (when dependencies changed) and when the component unmounts, to undo what the effect set up: clear timers, remove listeners, abort requests.
</details>

<!-- subtopic: f17_s2 -->
### Fetching data: loading, error and empty states

The classic pattern for loading from your Spring Boot API:

```tsx
type Task = { id: number; title: string; done: boolean };

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setTasks(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading tasks…</p>;
  if (error) return <p role="alert">Couldn't load tasks: {error}</p>;
  if (tasks.length === 0) return <p>No tasks yet.</p>;
  return <ul>{tasks.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

Notes:

- The effect function itself can't be `async` (it must return nothing or a cleanup), so define an async function inside and call it.
- **Always handle four states**: loading, error, empty, data. Users notice when one is missing.
- A discriminated union (Module 14) models this even better than three separate states.
- Remember `fetch` doesn't throw on a 404 or 500 (Module 10).

This works, and it's what you should understand first. In real apps you'll usually let **TanStack Query** do this (caching, retries, refetching, deduplication: Module 19), or the framework's data loading (Next.js, React Router loaders).

<details>
<summary>Why can't you write useEffect(async () => { … })?</summary>

An async function always returns a promise, but React expects the effect to return either nothing or a cleanup function. Define an async function inside the effect and call it instead.
</details>

<!-- subtopic: f17_s3 -->
### Race conditions and cancelling requests

When an effect depends on a value that changes quickly (a search box, a selected user), responses can arrive **out of order**:

```text
type "ja"   → request A starts (slow)
type "java" → request B starts (fast)
B returns   → shows results for "java"
A returns   → overwrites them with results for "ja" 😬
```

Fix it in the cleanup: ignore or abort the stale request.

```tsx
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<Task[]>([]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const controller = new AbortController();

    fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(setResults)
      .catch(err => { if (err.name !== "AbortError") console.error(err); });

    return () => controller.abort();      // a newer query (or unmount) cancels this request
  }, [query]);

  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

Every time `query` changes, React first runs the previous effect's cleanup, which aborts the old request, so only the latest response can ever set state. (The other common fix is an `ignore` flag: `let ignore = false; … if (!ignore) setResults(data); return () => { ignore = true; }`.)

Combine it with debouncing (Module 12) so you don't send a request on every keystroke.

<details>
<summary>What is a race condition in data fetching, and how do you prevent it in an effect?</summary>

A slower, older request finishing after a newer one and overwriting its results. Prevent it in the effect's cleanup: abort the old request with an AbortController (or set an ignore flag), so only the latest request updates state.
</details>

<!-- subtopic: f17_s4 -->
### StrictMode: why effects run twice in development

With `<StrictMode>` (on in Vite's template), React in **development only**:

- renders components **twice**, to catch impure rendering;
- runs every effect, then its cleanup, then the effect **again** on mount.

So you'll see two requests in the Network tab and two `console.log`s. That's deliberate: it simulates a component being removed and shown again, and it **exposes missing cleanups**. If your effect breaks when it runs twice (two subscriptions, a timer that runs double speed, a duplicate POST), it would also break in production when users navigate back and forth.

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);      // with this cleanup, mount → unmount → mount is harmless
}, []);
```

Don't "fix" double effects by removing StrictMode or adding a `didRun` ref. Fix the cleanup. Production builds run effects once.

For one-off actions like "send a purchase", don't use an effect at all: put it in the event handler of the button that caused it (next section).

<details>
<summary>Your effect sends two API requests in development. Is that a bug?</summary>

Not by itself. StrictMode deliberately mounts, unmounts and remounts components in development to test that effects clean up after themselves. Make sure the effect has a proper cleanup (for example aborting the fetch); production builds run it once.
</details>

<!-- subtopic: f17_s5 -->
### You might not need an effect

Effects are for syncing with **external systems** (network, timers, browser APIs, non-React widgets). Many effects in beginner code shouldn't exist:

**1. Transforming data for rendering** → compute it during render:

```tsx
// ❌ extra state + effect + an extra render
const [visible, setVisible] = useState<Task[]>([]);
useEffect(() => setVisible(tasks.filter(t => !t.done)), [tasks]);

// ✅
const visible = tasks.filter(t => !t.done);
```

**2. Reacting to a user action** → do it in the event handler:

```tsx
// ❌ an effect watching a flag
useEffect(() => { if (submitted) postOrder(order); }, [submitted]);

// ✅ the handler knows exactly what happened
function handleSubmit() { postOrder(order); }
```

**3. Resetting state when a prop changes** → give the component a `key` (Module 21):

```tsx
<ProfileForm key={userId} userId={userId} />   // a new userId = a fresh component with fresh state
```

**4. Notifying a parent about a change** → call the parent's callback in the same event handler that changed the state.

A quick test: "would this code need to run if the component were shown because of something other than a user action?" If it's caused by an **event**, it belongs in the handler. If it's caused by the component **being on screen**, it's an effect.

<details>
<summary>You use an effect to compute fullName from firstName and lastName. What's better?</summary>

Compute it while rendering: `const fullName = firstName + " " + lastName`. The effect version adds extra state, an extra render, and a moment where the screen shows a stale value.
</details>

<!-- subtopic: f17_s6 -->
### useRef: DOM access and values that don't re-render

`useRef` gives you a box (`{ current: … }`) that **survives re-renders** but **doesn't cause one** when you change it.

**1. Reaching a DOM element** (focus, scroll, measure, play a video):

```tsx
function NewTaskInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();        // focus the input when the form appears
  }, []);

  return <input ref={inputRef} placeholder="What needs doing?" />;
}
```

**2. Remembering a value without re-rendering**: a timer id, the previous value, "has this run", a WebSocket:

```tsx
function Stopwatch() {
  const [ms, setMs] = useState(0);
  const timer = useRef<number | null>(null);

  const start = () => {
    if (timer.current !== null) return;
    timer.current = window.setInterval(() => setMs(m => m + 100), 100);
  };
  const stop = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  };

  return <>
    <p>{(ms / 1000).toFixed(1)} s</p>
    <button onClick={start}>Start</button> <button onClick={stop}>Stop</button>
  </>;
}
```

| | useState | useRef |
|---|---|---|
| Survives re-renders | yes | yes |
| Changing it re-renders | yes | **no** |
| Read the latest value immediately after setting | no (next render) | yes |
| Use for | anything shown on screen | DOM nodes, timer ids, values not shown |

Don't read or write `ref.current` **during rendering** (except to initialise it): rendering must stay pure, and the screen won't update when it changes.

<details>
<summary>Should a value that's displayed on screen be kept in a ref or in state?</summary>

State. Changing a ref doesn't trigger a re-render, so the screen wouldn't update. Refs are for values React doesn't need to render: DOM elements, timer ids, previous values.
</details>

## 📝 Module 17 Recap

1. When does an effect run? → **after the render is on screen: every render, once, or when its dependencies change**
2. What does [] as dependencies mean? → **run once after the first render**
3. What goes in the dependency array? → **every prop, state value and function from the component that the effect uses**
4. What is the cleanup for? → **undoing the effect: timers, listeners, requests, subscriptions**
5. Four states to handle when fetching? → **loading, error, empty, data**
6. How do you prevent fetch race conditions? → **abort or ignore the old request in the cleanup**
7. Why do effects run twice in development? → **StrictMode remounts to expose missing cleanups**
8. Filtering a list for display: effect or not? → **not; compute it during render**
9. A POST after a button click: effect or handler? → **the event handler**
10. useRef vs useState? → **both persist; changing a ref doesn't re-render**
