# Frontend 18 — Hooks in Depth

> **Hooks are how function components get React features**: state, effects, context, memoisation. Beyond `useState` and `useEffect`, a handful more cover almost every app, and your own **custom hooks** let you reuse logic as easily as you reuse components.

<!-- subtopic: f18_s1 -->
### The rules of hooks

Two rules, enforced by the `eslint-plugin-react-hooks` linter:

1. **Only call hooks at the top level** of a component or custom hook: never inside conditions, loops, nested functions or after an early `return`.
2. **Only call hooks from React functions**: components (capitalised) and custom hooks (named `useSomething`), not from plain functions or classes.

```tsx
function Profile({ userId }: { userId?: number }) {
  if (!userId) return <p>Pick a user</p>;
  const [tab, setTab] = useState("posts");    // ❌ after an early return: called on some renders only
}

function ProfileFixed({ userId }: { userId?: number }) {
  const [tab, setTab] = useState("posts");    // ✅ always called, in the same order
  if (!userId) return <p>Pick a user</p>;
  /* … */
}
```

**Why:** React doesn't know hooks by name. It stores each component's hook data in a **list**, and matches calls to entries by **order**: the first `useState` call gets slot 1, the second gets slot 2. If a condition skips a hook on one render, every later hook reads the wrong slot.

```text
Render 1:  useState("posts") → slot 1   useEffect(...) → slot 2
Render 2:  (skipped!)                  useEffect(...) → reads slot 1 😬
```

<details>
<summary>Why can't you call useState inside an if?</summary>

React identifies hooks by the order they're called in each render. A conditional call changes that order between renders, so later hooks would read another hook's stored state.
</details>

<!-- subtopic: f18_s2 -->
### useReducer

When state has several related values and many ways to change them, gather the logic in one **reducer**: a pure function `(state, action) => newState`:

```tsx
type Task = { id: number; title: string; done: boolean };
type Action =
  | { type: "added"; title: string }
  | { type: "toggled"; id: number }
  | { type: "deleted"; id: number }
  | { type: "cleared-done" };

function tasksReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case "added":        return [...tasks, { id: Date.now(), title: action.title, done: false }];
    case "toggled":      return tasks.map(t => (t.id === action.id ? { ...t, done: !t.done } : t));
    case "deleted":      return tasks.filter(t => t.id !== action.id);
    case "cleared-done": return tasks.filter(t => !t.done);
  }
}

function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, []);
  return (
    <>
      <AddTaskForm onAdd={title => dispatch({ type: "added", title })} />
      <TaskList tasks={tasks} onToggle={id => dispatch({ type: "toggled", id })} />
      <button onClick={() => dispatch({ type: "cleared-done" })}>Clear done</button>
    </>
  );
}
```

Benefits: every state change is in one place, named by **what happened**; the reducer is a plain function you can unit-test without React; and `dispatch` never changes, so it's safe to pass down. This is the same pattern Redux is built on (Module 19).

| Use useState when | Use useReducer when |
|---|---|
| independent, simple values | several values that change together |
| few ways to update | many kinds of updates |
| | the next state depends on the previous in complex ways |

<details>
<summary>What must a reducer never do?</summary>

Mutate the state or cause side effects (fetching, timers, random ids that should be stable). It must be pure: return a new state computed only from the old state and the action.
</details>

<!-- subtopic: f18_s3 -->
### useContext: sharing data without prop drilling

Some data is needed by many components at different depths: the logged-in user, the theme, the language. Passing it through every layer is **prop drilling**. **Context** lets any descendant read it directly:

```tsx
import { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {                    // a small custom hook with a helpful error
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// main.tsx: <ThemeProvider><App /></ThemeProvider>

function ThemeButton() {                         // any depth, no props needed
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>Switch from {theme}</button>;
}
```

Things to know:

- **Every component that reads a context re-renders when its value changes.** Don't put fast-changing data in one big context; split contexts (an `AuthContext`, a `ThemeContext`).
- Passing a new object (`value={{ theme, toggle }}`) on every render re-renders all readers; wrap it in `useMemo` if that becomes a problem.
- Context is for **passing data down**, not a full state manager. For lots of shared, frequently updated app state, see Module 19.
- Context + `useReducer` is a common lightweight pattern: put `state` and `dispatch` in context.

<details>
<summary>What problem does context solve, and what's its main performance cost?</summary>

It removes prop drilling: deeply nested components can read shared data without every layer in between passing it along. The cost is that every consumer re-renders whenever the context value changes, so put stable or rarely changing data in it, or split it into several contexts.
</details>

<!-- subtopic: f18_s4 -->
### useMemo and useCallback

On every render, everything inside the component runs again: calculations are redone, and new functions and objects are created. Usually that's fine. These two hooks **cache** a result between renders, while their dependencies stay the same:

```tsx
// useMemo caches a VALUE
const visible = useMemo(
  () => tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())),
  [tasks, query]
);

// useCallback caches a FUNCTION (useCallback(fn, deps) = useMemo(() => fn, deps))
const handleToggle = useCallback(
  (id: number) => setTasks(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t))),
  []
);
```

When they actually help:

1. **An expensive calculation**: filtering or sorting thousands of items, heavy maths. (Measure first: most calculations take microseconds.)
2. **Keeping a reference stable** for a child wrapped in `React.memo`, which skips re-rendering only if its props are the same references (Module 21).
3. **A value used as an effect dependency**, so the effect doesn't re-run on every render.

When they don't: wrapping every small calculation and every handler. Each one costs memory and a dependency comparison, and adds noise.

The **React Compiler** (Module 22) can add this memoisation automatically, so newer projects write fewer of these by hand.

<details>
<summary>useMemo vs useCallback?</summary>

useMemo caches the result of calling a function (a value). useCallback caches the function itself. useCallback(fn, deps) is the same as useMemo(() => fn, deps).
</details>

<!-- subtopic: f18_s5 -->
### Custom hooks

A **custom hook** is a function starting with `use` that calls other hooks. It shares **logic**, not state: each component that calls it gets its own copy.

```tsx
// useLocalStorage: state that survives reloads
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {           // lazy initial value: read storage once
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
  }, [key, value]);

  return [value, setValue] as const;
}

// useDebounce: a value that updates only after it stops changing
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// useFetch: loading / error / data in one place
function useFetch<T>(url: string) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    fetch(url, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => setState({ data, loading: false }))
      .catch(err => { if (err.name !== "AbortError") setState({ error: err.message, loading: false }); });
    return () => controller.abort();
  }, [url]);
  return state;
}
```

Using them reads like plain English:

```tsx
function TaskSearch() {
  const [query, setQuery] = useLocalStorage("last-search", "");
  const debounced = useDebounce(query, 300);
  const { data, loading, error } = useFetch<Task[]>(`/api/tasks/search?q=${encodeURIComponent(debounced)}`);
  /* … */
}
```

Extract a custom hook when the same stateful logic appears in two components, or when a component's logic hides what it renders.

<details>
<summary>Two components call the same custom hook. Do they share its state?</summary>

No. A custom hook shares logic only; each call creates its own state and effects. To share state itself, lift it up, or put it in context or a store.
</details>

<!-- subtopic: f18_s6 -->
### useLayoutEffect, useId, useTransition and useDeferredValue

**`useLayoutEffect`**: like `useEffect`, but runs **before the browser paints**. Use it only to measure the DOM and adjust before the user sees anything (tooltip positions), to avoid a flicker. It blocks painting, so prefer `useEffect`.

**`useId`**: a unique, stable id for linking labels and inputs, safe with server rendering:

```tsx
function Field({ label }: { label: string }) {
  const id = useId();
  return <><label htmlFor={id}>{label}</label><input id={id} /></>;
}
```

**`useTransition`**: mark a state update as **non-urgent**, so typing and clicking stay responsive while React renders the slow part in the background:

```tsx
const [isPending, startTransition] = useTransition();
function handleTab(next: string) {
  startTransition(() => setTab(next));     // switching to a heavy tab won't freeze the buttons
}
{isPending && <Spinner />}
```

**`useDeferredValue`**: let a slow part of the screen lag behind a fast input:

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);   // updates after urgent renders finish
<input value={query} onChange={e => setQuery(e.target.value)} />
<SlowResults query={deferredQuery} />             // (with React.memo, it skips re-renders during typing)
```

Both rely on **concurrent rendering** (Module 22). They don't make work faster; they let React do urgent updates first.

Also in React 19: `useOptimistic`, `useActionState` and `use` (Module 22).

<details>
<summary>useEffect vs useLayoutEffect?</summary>

useEffect runs after the browser has painted, without blocking it: right for almost everything. useLayoutEffect runs after DOM changes but before painting, blocking it: only for measuring layout and adjusting it before the user sees a flicker.
</details>

## 📝 Module 18 Recap

1. The two rules of hooks? → **call them only at the top level, and only from components or custom hooks**
2. Why the top-level rule? → **React matches hook calls to stored state by their order**
3. What is a reducer? → **a pure function (state, action) → new state**
4. When useReducer over useState? → **related values with many kinds of updates**
5. What does context solve? → **prop drilling**
6. Context's main cost? → **every consumer re-renders when the value changes**
7. useMemo vs useCallback? → **cache a value vs cache a function**
8. When does memoisation help? → **expensive calculations, stable props for memo children, effect dependencies**
9. Do two components using a custom hook share state? → **no, only the logic**
10. What does useTransition do? → **marks an update as non-urgent so the UI stays responsive**
