Hooks let you package logic and share data without passing props through every layer. The first exercise builds two custom hooks; the second moves an app's state into a reducer shared through context.

<!-- exercise: f18_e1 | Medium | Notes with useLocalStorage and useDebounce -->
**Concepts:** custom hooks · lazy initial state · `useEffect` for syncing · debouncing a value · derived filtering

**Task.** Write two custom hooks and use them in a small notes app:

1. `useLocalStorage(key, initialValue)` works like `useState` but saves the value to `localStorage` (as JSON) whenever it changes, and reads it back on first render, so notes survive a reload. If storage is empty or broken, use `initialValue`.
2. `useDebounce(value, delay)` returns `value` only after it has stopped changing for `delay` ms.

The app adds notes, deletes them, and filters them by a search box using the **debounced** search text (the page shows how many times the filter actually ran, so you can see debouncing work).

**Starter code** · `notes.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Notes</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 460px; }
    input { padding: 6px; font-size: 15px; }
    li { margin: 6px 0; }
    .muted { color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useMemo, useState } from "react";
    import { createRoot } from "react-dom/client";

    function useLocalStorage(key, initialValue) {
      // TODO
      return useState(initialValue);
    }

    function useDebounce(value, delay) {
      // TODO
      return value;
    }

    let filterRuns = 0;

    function NotesApp() {
      const [notes, setNotes] = useLocalStorage("practice-notes", []);
      const [draft, setDraft] = useState("");
      const [search, setSearch] = useState("");
      const debouncedSearch = useDebounce(search, 300);

      const visible = useMemo(() => {
        filterRuns++;
        return notes.filter(n => n.text.toLowerCase().includes(debouncedSearch.toLowerCase()));
      }, [notes, debouncedSearch]);

      // TODO: add (trimmed, ignore empty) and delete
      return (
        <div>
          <p>TODO: the add form, the search box, the list</p>
          <p className="muted">Filter ran {filterRuns} times</p>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<NotesApp />);
  </script>
</body>
</html>
```

**Sample output**

```text
Add "Buy milk" and "Book flights", reload → both still there.
Type "boo" quickly → the list filters once, after you stop typing ("Filter ran" goes up by 1, not 3).
```

<!-- hints -->
- `useLocalStorage`: initialise lazily so storage is read only once: `useState(() => { try { const saved = localStorage.getItem(key); return saved !== null ? JSON.parse(saved) : initialValue; } catch { return initialValue; } })`.
- Then sync with an effect: `useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value])`, and return `[value, setValue]`.
- `useDebounce`: keep a `debounced` state; in an effect on `[value, delay]`, start a `setTimeout` that sets it, and clear the timeout in the cleanup.
- New notes need a stable id for their `key`: `crypto.randomUUID()` or `Date.now()`.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Notes</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 460px; }
    input { padding: 6px; font-size: 15px; }
    li { margin: 6px 0; }
    .muted { color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useMemo, useState } from "react";
    import { createRoot } from "react-dom/client";

    function useLocalStorage(key, initialValue) {
      const [value, setValue] = useState(() => {
        try {
          const saved = localStorage.getItem(key);
          return saved !== null ? JSON.parse(saved) : initialValue;
        } catch {
          return initialValue;
        }
      });
      useEffect(() => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
      }, [key, value]);
      return [value, setValue];
    }

    function useDebounce(value, delay) {
      const [debounced, setDebounced] = useState(value);
      useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
      }, [value, delay]);
      return debounced;
    }

    let filterRuns = 0;

    function NotesApp() {
      const [notes, setNotes] = useLocalStorage("practice-notes", []);
      const [draft, setDraft] = useState("");
      const [search, setSearch] = useState("");
      const debouncedSearch = useDebounce(search, 300);

      const visible = useMemo(() => {
        filterRuns++;
        return notes.filter(n => n.text.toLowerCase().includes(debouncedSearch.toLowerCase()));
      }, [notes, debouncedSearch]);

      function add(e) {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;
        setNotes(ns => [{ id: crypto.randomUUID(), text }, ...ns]);
        setDraft("");
      }

      return (
        <div>
          <form onSubmit={add}>
            <input aria-label="New note" value={draft} onChange={e => setDraft(e.target.value)} placeholder="New note" />
            <button>Add</button>
          </form>
          <p><input type="search" aria-label="Search notes" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" /></p>
          {visible.length === 0
            ? <p className="muted">{notes.length ? "No matching notes" : "No notes yet"}</p>
            : <ul data-testid="notes">{visible.map(n => (
                <li key={n.id}>{n.text} <button onClick={() => setNotes(ns => ns.filter(x => x.id !== n.id))} aria-label={`Delete ${n.text}`}>✕</button></li>
              ))}</ul>}
          <p className="muted">Filter ran {filterRuns} times</p>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<NotesApp />);
  </script>
</body>
</html>
```

Each hook hides one concern behind a familiar API: `useLocalStorage` looks exactly like `useState` to the component, and `useDebounce` turns a fast-changing value into a calm one. The lazy initialiser (`useState(() => …)`) reads and parses storage only on the first render, not on every keystroke. The filter's `useMemo` depends on the **debounced** text, so typing "boo" quickly runs it once, after the pause. (The `filterRuns` counter is a module variable purely so you can watch it; in real components, never change outside variables during render.)

<!-- exercise: f18_e2 | Medium | A task board with useReducer and context -->
**Concepts:** `useReducer` · actions as a discriminated union · context for state and dispatch · a custom hook with a provider check

**Task.** Three components at different depths all need the tasks: `AddTask`, `TaskList` (with `TaskRow` inside) and `Stats`. Instead of passing props through every layer:

1. Write a `tasksReducer(tasks, action)` handling `added`, `toggled`, `deleted` and `cleared-done`.
2. Create a `TasksProvider` that holds `useReducer(tasksReducer, initialTasks)` and provides `{ tasks, dispatch }` through context.
3. Write `useTasks()`, which reads the context and throws a helpful error when used outside the provider.
4. Make each component call `useTasks()` itself. `Stats` shows "2 of 4 done" and the Clear done button.

**Starter code** · `board.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Board</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 460px; }
    .done span { text-decoration: line-through; color: #64748b; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { createContext, useContext, useReducer, useState } from "react";
    import { createRoot } from "react-dom/client";

    const initialTasks = [
      { id: 1, title: "Read Module 18", done: true },
      { id: 2, title: "Write a reducer", done: false },
    ];

    // TODO: tasksReducer, TasksContext, TasksProvider, useTasks

    function AddTask() { return <p>TODO</p>; }
    function TaskRow({ task }) { return <li>{task.title}</li>; }
    function TaskList() { return <ul>TODO</ul>; }
    function Stats() { return <p>TODO</p>; }

    function App() {
      return (
        <main>
          <h1>Board</h1>
          <AddTask />
          <TaskList />
          <Stats />
        </main>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
Add "Use context" and "Test it", tick "Write a reducer" → "2 of 4 done"; Clear done → the two new tasks are left, "0 of 2 done"
Rendering <Stats /> outside the provider throws: "useTasks must be used inside <TasksProvider>"
```

<!-- hints -->
- The reducer is a `switch (action.type)` returning new arrays: `[...tasks, { id: Date.now(), title: action.title, done: false }]`, `map` for toggled, `filter` for deleted and cleared-done. Throw on an unknown type.
- `const TasksContext = createContext(null);` and the provider renders `<TasksContext.Provider value={{ tasks, dispatch }}>{children}</TasksContext.Provider>`.
- `useTasks` calls `useContext(TasksContext)`; if the result is `null`, throw an `Error`.
- Wrap the app: `<TasksProvider><App /></TasksProvider>`. Components call `const { tasks, dispatch } = useTasks()` and dispatch actions like `{ type: "toggled", id }`.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Board</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 460px; }
    .done span { text-decoration: line-through; color: #64748b; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { createContext, useContext, useReducer, useState } from "react";
    import { createRoot } from "react-dom/client";

    const initialTasks = [
      { id: 1, title: "Read Module 18", done: true },
      { id: 2, title: "Write a reducer", done: false },
    ];

    function tasksReducer(tasks, action) {
      switch (action.type) {
        case "added":        return [...tasks, { id: Date.now() + Math.random(), title: action.title, done: false }];
        case "toggled":      return tasks.map(t => (t.id === action.id ? { ...t, done: !t.done } : t));
        case "deleted":      return tasks.filter(t => t.id !== action.id);
        case "cleared-done": return tasks.filter(t => !t.done);
        default:             throw new Error(`Unknown action: ${action.type}`);
      }
    }

    const TasksContext = createContext(null);

    function TasksProvider({ children }) {
      const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
      return <TasksContext.Provider value={{ tasks, dispatch }}>{children}</TasksContext.Provider>;
    }

    function useTasks() {
      const ctx = useContext(TasksContext);
      if (!ctx) throw new Error("useTasks must be used inside <TasksProvider>");
      return ctx;
    }

    function AddTask() {
      const { dispatch } = useTasks();
      const [title, setTitle] = useState("");
      return (
        <form onSubmit={e => {
          e.preventDefault();
          if (!title.trim()) return;
          dispatch({ type: "added", title: title.trim() });
          setTitle("");
        }}>
          <input aria-label="New task" value={title} onChange={e => setTitle(e.target.value)} />
          <button>Add</button>
        </form>
      );
    }

    function TaskRow({ task }) {
      const { dispatch } = useTasks();
      return (
        <li className={task.done ? "done" : ""}>
          <label>
            <input type="checkbox" checked={task.done} onChange={() => dispatch({ type: "toggled", id: task.id })} />
            <span>{task.title}</span>
          </label>
          <button onClick={() => dispatch({ type: "deleted", id: task.id })} aria-label={`Delete ${task.title}`}>✕</button>
        </li>
      );
    }

    function TaskList() {
      const { tasks } = useTasks();
      return <ul>{tasks.map(t => <TaskRow key={t.id} task={t} />)}</ul>;
    }

    function Stats() {
      const { tasks, dispatch } = useTasks();
      const done = tasks.filter(t => t.done).length;
      return (
        <p>
          <span data-testid="stats">{done} of {tasks.length} done</span>{" "}
          <button onClick={() => dispatch({ type: "cleared-done" })} disabled={done === 0}>Clear done</button>
        </p>
      );
    }

    function App() {
      return (
        <main>
          <h1>Board</h1>
          <AddTask />
          <TaskList />
          <Stats />
        </main>
      );
    }

    createRoot(document.getElementById("root")).render(<TasksProvider><App /></TasksProvider>);
  </script>
</body>
</html>
```

`App` no longer passes anything down: each component asks `useTasks()` for exactly what it needs. All the ways tasks can change are listed in one pure function, `tasksReducer`, which you could test without React. `dispatch` never changes between renders, so components that only dispatch are cheap to keep stable. The throwing `useTasks` turns a confusing "cannot read properties of null" into a clear message the moment someone forgets the provider. Redux Toolkit (Module 19) is this same pattern, with extra tooling.
