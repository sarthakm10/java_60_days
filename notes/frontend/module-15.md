# Frontend 15 — React Fundamentals

> **React builds user interfaces from components: functions that take data and return what the screen should show.** You stop writing "find this element and change it" code (Module 9) and describe the UI for the current data instead; React works out the DOM changes. This module and the next seven take you from your first component to how React works inside.

<!-- subtopic: f15_s1 -->
### Why React, and your first project

With plain DOM code, every change means remembering which elements to update. As an app grows, the screen and the data drift apart. React flips it around:

```text
UI = f(state)
```

You write a function from **state** (your data) to **UI**. When the state changes, React calls your function again and updates only the parts of the DOM that changed.

```jsx
function Greeting() {
  const name = "Asha";
  return <h1>Hello, {name}!</h1>;
}
```

Key ideas:

- **Components**: reusable pieces (a `TaskCard`, a `Navbar`, a whole `TaskPage`), each a function.
- **Declarative**: you say *what* to show, not *how* to change the DOM.
- **One-way data flow**: data goes down from parents to children (Module 16).
- It's a **library for the view**, not a full framework. Routing, data fetching and forms come from other libraries (Modules 19–20) or a framework like Next.js (Module 22).

Create a project with Vite (Module 11), with TypeScript:

```bash
npm create vite@latest task-ui -- --template react-ts
cd task-ui && npm install && npm run dev
```

```text
task-ui/
├─ index.html            the single HTML page, with <div id="root">
├─ src/
│  ├─ main.tsx           mounts <App /> into #root
│  ├─ App.tsx            your top component
│  └─ index.css
└─ package.json
```

```tsx
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

The whole app lives in one HTML page and swaps content without reloading: a **single-page application (SPA)**.

<details>
<summary>What does "UI is a function of state" mean?</summary>

Given the same data, a component always renders the same output. You don't patch the DOM by hand; you change the state, React runs your components again with the new state, and it updates the DOM to match.
</details>

<!-- subtopic: f15_s2 -->
### JSX

JSX is HTML-like syntax inside JavaScript. The build turns it into function calls (`<h1>Hi</h1>` becomes `jsx("h1", { children: "Hi" })`), so it's just JavaScript underneath.

```tsx
function TaskHeader() {
  const count = 3;
  const user = { name: "Asha", avatar: "/asha.png" };
  return (
    <header className="task-header">
      <img src={user.avatar} alt="" />
      <h1>{user.name}'s tasks</h1>
      <p>You have {count} task{count === 1 ? "" : "s"} left.</p>
      <p>{new Date().getFullYear()}</p>
    </header>
  );
}
```

The rules that differ from HTML:

| Rule | Example |
|---|---|
| `{ }` holds any JavaScript **expression** (not statements like `if` or `for`) | `{count * 2}`, `{user.name}` |
| `class` → `className`, `for` → `htmlFor` | `<label htmlFor="email">` |
| attributes are camelCase | `onClick`, `tabIndex`, `maxLength` |
| `style` takes an object | `style={{ color: "teal", fontSize: 18 }}` |
| every tag must close | `<img />`, `<input />`, `<br />` |
| return **one** root element | wrap siblings in a fragment `<>…</>` |
| comments | `{/* like this */}` |

```tsx
function Columns() {
  return (
    <>
      <td>Day</td>
      <td>Topic</td>
    </>
  );
}
```

JSX escapes values automatically: `{userInput}` shows text, never HTML, which protects you from XSS (Module 25).

<details>
<summary>Why can't you write an if statement inside JSX braces?</summary>

Braces take expressions, things that produce a value. An `if` statement doesn't produce a value. Use a ternary (`a ? b : c`), `&&`, or compute the value in a variable before the `return`.
</details>

<!-- subtopic: f15_s3 -->
### Components and props

A component is a function whose name starts with a **capital letter** and returns JSX. **Props** are its inputs, passed like attributes:

```tsx
type TaskCardProps = {
  title: string;
  done: boolean;
  minutes?: number;
};

function TaskCard({ title, done, minutes = 30 }: TaskCardProps) {
  return (
    <article className={done ? "card done" : "card"}>
      <h3>{title}</h3>
      <span>{minutes} min</span>
    </article>
  );
}

export default function App() {
  return (
    <main>
      <TaskCard title="Learn JSX" done={true} />
      <TaskCard title="Learn props" done={false} minutes={45} />
    </main>
  );
}
```

- Strings can be passed in quotes; everything else in braces (`done={true}`, `minutes={45}`).
- **Props are read-only.** A component must never change its props.
- Lowercase tags (`<div>`) are HTML elements; capitalised ones (`<TaskCard>`) are your components.

**`children`** is whatever you put between the tags, which makes wrapper components easy:

```tsx
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

<Card title="Today">
  <p>Two tasks left.</p>
  <button>Start</button>
</Card>
```

**Keep components pure**: same props in, same JSX out, with no side effects during rendering (no changing outside variables, no fetching). React may render a component more than once, and purity keeps that safe. Side effects belong in event handlers and effects (Module 17).

<details>
<summary>Can a child component change the props it received?</summary>

No. Props are read-only inputs owned by the parent. To change something, the parent passes down a function (like `onToggle`) that the child calls, and the parent updates its own state (Module 16).
</details>

<!-- subtopic: f15_s4 -->
### Rendering lists and keys

Turn an array into elements with `map`:

```tsx
type Task = { id: number; title: string; done: boolean };

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

Every item in a list needs a **`key`**: a value that is **unique among its siblings** and **stable** across renders. React uses keys to match items between renders: which were added, removed or moved.

- ✅ A database id (`task.id`) is perfect.
- ❌ `Math.random()`: a new key every render, so React rebuilds every item and loses its state.
- ⚠️ The array **index** only works if the list never reorders, filters or gets items inserted. Otherwise state and input values end up attached to the wrong items.

```tsx
{tasks.map((task, i) => <TaskRow key={i} task={task} />)}   // ⚠️ breaks when a task is inserted at the top
```

Keys go on the outermost element returned by the `map`, and they aren't passed to the component as a prop. Module 21 shows how keys can also deliberately *reset* a component.

<details>
<summary>Why is the array index a risky key?</summary>

The index describes a position, not an item. If an item is inserted, removed or the list is sorted, items move to different indexes, so React matches the wrong old item to each new one, and any state (checkbox, input text, animation) stays at the old position.
</details>

<!-- subtopic: f15_s5 -->
### Conditional rendering

```tsx
function TaskStatus({ tasks, loading, error }: { tasks: Task[]; loading: boolean; error?: string }) {
  if (loading) return <p>Loading…</p>;                 // early return
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      {tasks.length === 0 ? (                          // ternary: either/or
        <p>No tasks yet. Add one!</p>
      ) : (
        <TaskList tasks={tasks} />
      )}
      {tasks.some(t => !t.done) && <span className="badge">Pending</span>}   // && : show or nothing
    </div>
  );
}
```

| Pattern | Use for |
|---|---|
| early `return` | whole-component states: loading, error, not found |
| `cond ? <A /> : <B />` | one of two things |
| `cond && <A />` | something or nothing |
| a variable before `return` | complex logic you don't want inline |
| return `null` | render nothing |

**The `&&` trap:** if the left side is the number `0`, React renders `0`:

```tsx
{tasks.length && <TaskList tasks={tasks} />}        // shows "0" when the list is empty 😬
{tasks.length > 0 && <TaskList tasks={tasks} />}    // ✅ a real boolean
```

<details>
<summary>Why does {count && &lt;Badge /&gt;} sometimes show a 0 on the page?</summary>

`&&` returns its left side when that side is falsy. When count is 0, the expression is `0`, and React renders numbers (it only skips false, null and undefined). Use `count > 0 && <Badge />`.
</details>

<!-- subtopic: f15_s6 -->
### Styling React components

The CSS from Modules 3–4 still does the work; the question is how you attach it.

**1. Plain CSS files**, imported by a component (global class names):

```tsx
import "./TaskCard.css";
<article className="task-card">…</article>
```

**2. CSS Modules**: `Name.module.css`, with class names local to the component:

```css
/* TaskCard.module.css */
.card { padding: 16px; border-radius: 12px; }
.done { opacity: 0.6; }
```

```tsx
import styles from "./TaskCard.module.css";
<article className={`${styles.card} ${done ? styles.done : ""}`}>…</article>
```

**3. Tailwind CSS**: utility classes in the JSX:

```tsx
<article className={`p-4 rounded-xl border ${done ? "opacity-60" : ""}`}>…</article>
```

**4. Inline styles** for dynamic values only: `style={{ width: `${percent}%` }}`.

Joining classes conditionally gets messy, so most projects use the tiny `clsx` helper:

```tsx
import clsx from "clsx";
<article className={clsx("card", done && "done", urgent && "urgent")}>…</article>
```

Pick one main approach per project. Tailwind and CSS Modules are the most common in React jobs today; component libraries (MUI, shadcn/ui) sit on top of them.

<details>
<summary>What problem does a CSS Module solve compared with a plain imported CSS file?</summary>

Plain imported CSS is global: a `.card` class in one component's file affects every `.card` in the app. A CSS Module scopes each class to its component by giving it a unique generated name.
</details>

## 📝 Module 15 Recap

1. What is a React component? → **a capitalised function that takes props and returns JSX**
2. What does JSX compile to? → **JavaScript function calls that create elements**
3. class in JSX? → **className (and for becomes htmlFor)**
4. How many root elements can JSX return? → **one; wrap siblings in a fragment &lt;&gt;…&lt;/&gt;**
5. Can a component change its props? → **no, props are read-only**
6. What is children? → **whatever is placed between a component's opening and closing tags**
7. What makes a good key? → **a stable, unique id from the data, not Math.random() or usually the index**
8. Three ways to render conditionally? → **early return, ternary, &&**
9. Why can && render a 0? → **React renders numbers, and 0 && x evaluates to 0**
10. Two common ways to style React apps? → **CSS Modules and Tailwind**
