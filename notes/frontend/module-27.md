# Frontend 27 — Machine Coding Round

> **In a machine coding round you build a small working UI in 60–90 minutes**, usually in React (sometimes plain JavaScript), while someone watches. It tests whether you can turn requirements into clean, working, accessible code under time pressure. This module is a game plan plus the problems that come up most, each with a solid core solution to practise from.

<!-- subtopic: f27_s1 -->
### What the round looks like, and how to plan your time

You get a prompt ("build a todo app with filters", "build a star rating component"), a blank project (or CodeSandbox / StackBlitz), and 60–90 minutes. They judge:

1. **It works**: the core requirements, completely.
2. **Code quality**: small components, clear names, sensible state, no duplicated logic.
3. **Edge cases**: empty input, long text, double clicks, no results, errors.
4. **UX and accessibility**: keyboard support, labels, focus, sensible states.
5. **Communication**: you explain decisions and trade-offs as you go.

A time plan for 75 minutes:

| Minutes | Do |
|---|---|
| 0–8 | Read twice, **ask questions**, write a short checklist of requirements and what's out of scope |
| 8–15 | Sketch the component tree and the **state shape** (out loud or as a comment) |
| 15–55 | Build the **core flow end to end** first, unstyled; then the next requirement |
| 55–65 | Edge cases, keyboard, labels, error and empty states |
| 65–75 | Light styling, cleanup, and a walkthrough of what you'd improve with more time |

Tips:

- **Working beats pretty.** Get a basic version working early, then improve it. An unfinished, beautifully styled app scores worse.
- **Practise your setup**: `npm create vite@latest`, plain CSS or a few utility classes; don't fight tooling in the interview.
- **Keep state minimal and derived values computed** (Module 16). Interviewers notice duplicated state.
- **Say what you'd add**: tests, persistence, virtualization, better errors.

<details>
<summary>You're at minute 40 and only half the requirements work. What should you prioritise?</summary>

Getting the core flow fully working end to end, even unstyled, then the next most important requirement. Skip polish and stretch goals, and say out loud what you'd do with more time. A complete basic solution beats a partial fancy one.
</details>

<!-- subtopic: f27_s2 -->
### Build: a todo app with filters and localStorage

The most common prompt. Requirements: add, toggle, delete, edit; filter all/active/done; count of items left; clear completed; persist across reloads.

```tsx
import { useEffect, useMemo, useState } from "react";

type Todo = { id: string; text: string; done: boolean };
type Filter = "all" | "active" | "done";

function load(): Todo[] {
  try { return JSON.parse(localStorage.getItem("todos") ?? "[]"); } catch { return []; }
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(load);
  const [filter, setFilter] = useState<Filter>("all");
  const [text, setText] = useState("");

  useEffect(() => { localStorage.setItem("todos", JSON.stringify(todos)); }, [todos]);

  const visible = useMemo(
    () => todos.filter(t => (filter === "all" ? true : filter === "done" ? t.done : !t.done)),
    [todos, filter]
  );
  const left = todos.filter(t => !t.done).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTodos(ts => [...ts, { id: crypto.randomUUID(), text: value, done: false }]);
    setText("");
  }
  const toggle = (id: string) => setTodos(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTodos(ts => ts.filter(t => t.id !== id));
  const rename = (id: string, text: string) => setTodos(ts => ts.map(t => (t.id === id ? { ...t, text } : t)));

  return (
    <section>
      <form onSubmit={add}>
        <label htmlFor="new-todo" className="sr-only">New todo</label>
        <input id="new-todo" value={text} onChange={e => setText(e.target.value)} placeholder="What needs doing?" />
        <button disabled={!text.trim()}>Add</button>
      </form>

      <ul>
        {visible.map(t => (
          <TodoItem key={t.id} todo={t} onToggle={toggle} onDelete={remove} onRename={rename} />
        ))}
      </ul>
      {todos.length === 0 && <p>Nothing to do. 🎉</p>}

      <footer>
        <span>{left} item{left === 1 ? "" : "s"} left</span>
        {(["all", "active", "done"] as const).map(f => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button onClick={() => setTodos(ts => ts.filter(t => !t.done))} disabled={left === todos.length}>
          Clear completed
        </button>
      </footer>
    </section>
  );
}

function TodoItem({ todo, onToggle, onDelete, onRename }: {
  todo: Todo; onToggle: (id: string) => void; onDelete: (id: string) => void; onRename: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  function save() {
    const value = draft.trim();
    if (value) onRename(todo.id, value); else setDraft(todo.text);
    setEditing(false);
  }

  return (
    <li>
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} aria-label={`Mark "${todo.text}" done`} />
      {editing ? (
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={save}
               onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(todo.text); setEditing(false); } }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} style={{ textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
      )}
      <button onClick={() => setEditing(true)} aria-label={`Edit "${todo.text}"`}>✎</button>
      <button onClick={() => onDelete(todo.id)} aria-label={`Delete "${todo.text}"`}>✕</button>
    </li>
  );
}
```

Points to call out: lazy initial state from localStorage (`useState(load)`), functional updates, the filter as **derived** data, stable ids (`crypto.randomUUID()`), trimming and empty-input handling, labelled icon buttons, and keyboard editing (Enter/Escape). Extensions they may ask for: drag-to-reorder, due dates, syncing with an API.

<details>
<summary>Why useState(load) instead of useState(load())?</summary>

Passing the function makes it a lazy initialiser: React calls it only on the first render. Writing `load()` would read and parse localStorage on every render, even though the result is ignored after the first.
</details>

<!-- subtopic: f27_s3 -->
### Build: a search box with debounce and keyboard navigation

Requirements: search an API as you type; debounce; show results in a dropdown; ↑/↓/Enter/Escape; handle loading, empty and error; no stale results.

```tsx
function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

export function SearchBox({ onPick }: { onPick: (item: Item) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) { setResults([]); setStatus("idle"); return; }
    const controller = new AbortController();
    setStatus("loading");
    fetch(`/api/items?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Item[]) => { setResults(data); setStatus("done"); setActive(-1); setOpen(true); })
      .catch(err => { if (err.name !== "AbortError") setStatus("error"); });
    return () => controller.abort();                       // stale requests never land
  }, [debounced]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(results[active]); }
    else if (e.key === "Escape") setOpen(false);
  }

  function pick(item: Item) { onPick(item); setQuery(item.name); setOpen(false); }

  return (
    <div className="search">
      <input role="combobox" aria-expanded={open} aria-controls="search-list" aria-autocomplete="list"
             aria-activedescendant={active >= 0 ? `opt-${results[active].id}` : undefined}
             value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onKeyDown={onKeyDown}
             placeholder="Search…" aria-label="Search" />
      {open && debounced.length >= 2 && (
        <ul id="search-list" role="listbox">
          {status === "loading" && <li aria-live="polite">Searching…</li>}
          {status === "error" && <li role="alert">Something went wrong</li>}
          {status === "done" && results.length === 0 && <li>No results for "{debounced}"</li>}
          {results.map((r, i) => (
            <li key={r.id} id={`opt-${r.id}`} role="option" aria-selected={i === active}
                onMouseDown={e => e.preventDefault()} onClick={() => pick(r)}>
              <Highlight text={r.name} query={debounced} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>;
}
```

Points to call out: debounce + abort (no race conditions), a minimum length, all four states, the combobox ARIA pattern with `aria-activedescendant`, `onMouseDown` + `preventDefault` so clicking an option doesn't blur the input first, and highlighting **without** `innerHTML`. Extension: cache results per query in a `Map`.

<details>
<summary>Why call preventDefault on the option's mousedown?</summary>

Clicking an option would first blur the input, and if blur closes the list, the option disappears before its click fires. Preventing the mousedown default keeps focus in the input, so the click lands.
</details>

<!-- subtopic: f27_s4 -->
### Build: tabs, accordion, modal and star rating

Small components, but they test API design, state and accessibility. The cores:

**Tabs** (arrow keys move between tabs):

```tsx
function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  }
  return (
    <div>
      <div role="tablist">
        {tabs.map((t, i) => (
          <button key={t.id} ref={el => { refs.current[t.id] = el; }} role="tab" id={`tab-${t.id}`}
                  aria-selected={active === t.id} aria-controls={`panel-${t.id}`} tabIndex={active === t.id ? 0 : -1}
                  onClick={() => setActive(t.id)} onKeyDown={e => onKeyDown(e, i)}>{t.label}</button>
        ))}
      </div>
      {tabs.map(t => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
```

**Accordion**: each header is a `button` with `aria-expanded`; ask whether one or many panels may be open (`openId: string | null` vs `open: Set<string>`). The native `details`/`summary` elements give a no-JavaScript accordion.

**Modal**: use the native `dialog` element; it handles the focus trap, Escape and the backdrop:

```tsx
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal(); else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title"
            onClick={e => { if (e.target === ref.current) onClose(); }}>   {/* click on the backdrop */}
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}
```

**Star rating** (hover preview, click to set, keyboard accessible):

```tsx
function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)} onClick={() => onChange(n === value ? 0 : n)}>
          {n <= shown ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
```

Mention the controlled API (`value` + `onChange`), so the parent owns the state and the component is reusable.

<details>
<summary>Why build a reusable component as controlled (value + onChange) rather than keeping its own state?</summary>

The parent owns the value, so it can set it initially, reset it, validate it, or keep it in a form or store, and the component stays a simple, predictable view. An uncontrolled version can be offered too, with a defaultValue.
</details>

<!-- subtopic: f27_s5 -->
### Build: pagination and infinite scroll over an API

**Numbered pagination** with the page in the URL:

```tsx
function UserTable() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? 1);
  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ["users", page],
    queryFn: () => api.get<{ items: User[]; total: number; pageSize: number }>(`/users?page=${page}`),
    placeholderData: keepPreviousData,                // keep showing the old page while the next loads
  });
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const go = (p: number) => setParams({ page: String(p) });

  return (
    <>
      <table style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>{/* rows */}</table>
      <nav aria-label="Pagination">
        <button onClick={() => go(page - 1)} disabled={page <= 1}>Previous</button>
        <span aria-current="page">Page {page} of {pages}</span>
        <button onClick={() => go(page + 1)} disabled={page >= pages || isPending}>Next</button>
      </nav>
    </>
  );
}
```

(`keepPreviousData` is imported from TanStack Query.) For Spring Data's `Page` responses, map `content`, `totalElements`, `size` and `number` (0-based!).

**Infinite scroll** without libraries: an IntersectionObserver on a sentinel element (the full version is in Module 26):

```tsx
const [items, setItems] = useState<Post[]>([]);
const [cursor, setCursor] = useState<string | null>(null);
const [hasMore, setHasMore] = useState(true);
const loading = useRef(false);

const loadMore = useCallback(async () => {
  if (loading.current || !hasMore) return;          // a ref guards against double-loading
  loading.current = true;
  const page = await api.get<{ items: Post[]; nextCursor: string | null }>(`/posts?cursor=${cursor ?? ""}`);
  setItems(prev => [...prev, ...page.items]);
  setCursor(page.nextCursor);
  setHasMore(page.nextCursor !== null);
  loading.current = false;
}, [cursor, hasMore]);
```

Points to call out: no duplicate requests (the guard), the end of the list, errors with a retry button, keeping the page in the URL for numbered pagination, and a "Load more" button as the accessible fallback.

<details>
<summary>Why guard loadMore with a ref instead of a loading state variable?</summary>

The observer can fire several times before React re-renders with the new state, and every one of those callbacks would see the old `false`. A ref updates immediately and is shared across calls, so only one request starts.
</details>

<!-- subtopic: f27_s6 -->
### Build: a form with validation, and a progress bar or timer

**A sign-up form** without libraries (they often want to see you do it by hand):

```tsx
type Fields = { email: string; password: string; confirm: string };
const rules: Record<keyof Fields, (v: string, all: Fields) => string> = {
  email: v => (/^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email"),
  password: v => (v.length >= 8 ? "" : "At least 8 characters"),
  confirm: (v, all) => (v === all.password ? "" : "Passwords don't match"),
};

function SignUp({ onSubmit }: { onSubmit: (f: Fields) => Promise<void> }) {
  const [values, setValues] = useState<Fields>({ email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors = Object.fromEntries(
    (Object.keys(rules) as (keyof Fields)[]).map(k => [k, rules[k](values[k], values)])
  ) as Record<keyof Fields, string>;                       // derived, never stored
  const valid = Object.values(errors).every(e => !e);

  const field = (name: keyof Fields, label: string, type = "text") => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type={type} value={values[name]}
             onChange={e => setValues(v => ({ ...v, [name]: e.target.value }))}
             onBlur={() => setTouched(t => ({ ...t, [name]: true }))}
             aria-invalid={!!(touched[name] && errors[name])} aria-describedby={`${name}-err`} />
      <p id={`${name}-err`} role="alert">{touched[name] ? errors[name] : ""}</p>
    </div>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!valid) return;
    setSubmitting(true);
    try { await onSubmit(values); } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      {field("email", "Email", "email")}
      {field("password", "Password", "password")}
      {field("confirm", "Confirm password", "password")}
      <button disabled={submitting}>{submitting ? "Creating…" : "Sign up"}</button>
    </form>
  );
}
```

Show errors **after a field is touched** (not while typing the first character), and all of them on submit.

**A countdown timer** (start, pause, reset), a test of timers and cleanup:

```tsx
function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  const ticking = running && left > 0;                 // derived: stops by itself at zero

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setLeft(l => Math.max(l - 1, 0)), 1000);
    return () => clearInterval(id);                    // pause, reset, reaching zero and unmount all stop it
  }, [ticking]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div>
      <p role="timer" aria-live="off">{mm}:{ss}</p>
      <progress max={seconds} value={seconds - left} />
      <button onClick={() => setRunning(r => !r)} disabled={left === 0}>{ticking ? "Pause" : "Start"}</button>
      <button onClick={() => { setRunning(false); setLeft(seconds); }}>Reset</button>
    </div>
  );
}
```

Points to call out: the functional update (the interval's closure would otherwise see a stale `left`), the cleanup, and that `setInterval` drifts. For precise timers, store the end time and compute `left = Math.ceil((end - Date.now()) / 1000)` on each tick.

<details>
<summary>Why does a countdown written as setLeft(left - 1) inside setInterval get stuck?</summary>

The interval's callback closes over the `left` from the render when the effect ran, so it keeps setting the same value (stale closure). Use the functional update `setLeft(l => l - 1)`, which always receives the latest value.
</details>

## 📝 Module 27 Recap

1. What matters most in a machine coding round? → **a complete, working core flow, then edge cases, accessibility and clean code**
2. First 5–8 minutes? → **clarify requirements and scope, list them**
3. How should a todo filter be stored? → **only the filter value; the visible list is derived**
4. Why useState(load)? → **a lazy initialiser runs only on the first render**
5. Search box essentials? → **debounce, abort stale requests, all states, keyboard and combobox ARIA**
6. Easiest accessible modal? → **the native dialog element with showModal()**
7. Reusable components should be? → **controlled: value + onChange**
8. Why keep the page number in the URL? → **refresh, sharing and the back button work**
9. How do you prevent double-loading on infinite scroll? → **a ref guard (and an end-of-list check)**
10. Countdown bug with setLeft(left - 1)? → **stale closure; use setLeft(l => l - 1)**
