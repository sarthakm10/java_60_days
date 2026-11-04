# Frontend 30 — React Patterns, TypeScript and Next.js

> **The React topics that fill the gaps between "I can build an app" and "I can work on any React codebase":** typing components properly, the patterns reusable libraries are built from, portals, the class components you'll still meet in older code, and the basics of Next.js, the framework many job listings ask for.

<!-- subtopic: f30_s1 -->
### React with TypeScript: props, children, events and state

**Props** are just an object type. Name it `ComponentNameProps`:

```tsx
type TaskCardProps = {
  title: string;
  priority?: number;                       // optional
  status: "TODO" | "IN_PROGRESS" | "DONE";  // a literal union: only these values
  onSelect: (id: number) => void;          // a callback prop
};

function TaskCard({ title, priority = 3, status, onSelect }: TaskCardProps) {
  /* … */
}
```

Write components as plain functions with typed props. You'll see `React.FC<Props>` in older code; it's fine, but it adds nothing today, and plain functions read more simply.

**Children** are typed as `React.ReactNode`, which covers everything React can render: elements, strings, numbers, arrays, `null`:

```tsx
type CardProps = { title: string; children: React.ReactNode };
function Card({ title, children }: CardProps) {
  return <section><h2>{title}</h2>{children}</section>;
}
// or: type CardProps = React.PropsWithChildren<{ title: string }>;
```

Use `React.ReactElement` only when you need exactly one element (rare).

**Events** have their own types, parameterised by the element:

| Handler | Event type |
|---|---|
| `onChange` on an input | `React.ChangeEvent<HTMLInputElement>` |
| `onChange` on a select / textarea | `React.ChangeEvent<HTMLSelectElement>` / `<HTMLTextAreaElement>` |
| `onSubmit` on a form | `React.FormEvent<HTMLFormElement>` |
| `onClick` on a button | `React.MouseEvent<HTMLButtonElement>` |
| `onKeyDown` | `React.KeyboardEvent<HTMLInputElement>` |

```tsx
function Search({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value);
  }
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearch(q);
  }
  return <form onSubmit={handleSubmit}><input value={q} onChange={handleChange} /></form>;
}
```

A shortcut: write the handler inline once (`onChange={e => …}`), hover `e` in your editor, and copy the type it shows.

**State** is inferred from the initial value; annotate it when the initial value doesn't tell the whole story:

```tsx
const [count, setCount] = useState(0);                       // number, inferred
const [user, setUser] = useState<User | null>(null);          // null now, a User later
const [tasks, setTasks] = useState<Task[]>([]);               // [] alone would be never[]
const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
```

<details>
<summary>Why does useState([]) need a type annotation?</summary>

From an empty array, TypeScript can't know what the items will be, so it infers `never[]`, and pushing anything later is a type error. `useState<Task[]>([])` says what the array will hold.
</details>

<!-- subtopic: f30_s2 -->
### React with TypeScript, further: refs, generics, context, reducers and HTML props

**Refs** to DOM elements start as `null`, until React attaches them:

```tsx
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []);    // ?. because it can be null
<input ref={inputRef} />

const timerRef = useRef<number | null>(null);            // a mutable value, not a DOM node
```

**Extending HTML props.** A `Button` that accepts everything a real `button` does, plus your own props:

```tsx
type ButtonProps = React.ComponentProps<"button"> & { variant?: "primary" | "ghost" };

function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} ${className}`} {...rest} />;
}

<Button type="submit" disabled={saving} onClick={save}>Save</Button>   // all fully typed
```

`React.ComponentProps<typeof SomeComponent>` also gets the props type of any existing component, handy for wrappers.

**Generic components** keep the types of the data you pass in, like generic functions (Module 14):

```tsx
type ListProps<T> = {
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map(item => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>;
}

<List items={tasks} getKey={t => t.id} renderItem={t => t.title} />   // t is a Task, inferred
```

(In a `.tsx` file, a generic **arrow** function needs a comma so `<T>` isn't read as JSX: `const List = <T,>(props: ListProps<T>) => …`.)

**Context**: give it a type that includes `null`, and a hook that checks for the provider:

```tsx
type AuthContextValue = { user: User | null; logout: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;                              // no null checks needed in components
}
```

**Reducers**: a discriminated union of actions (Module 14) makes every `dispatch` checked:

```tsx
type Action = { type: "added"; task: Task } | { type: "deleted"; id: number };
function reducer(state: Task[], action: Action): Task[] { /* switch on action.type */ }

const [tasks, dispatch] = useReducer(reducer, []);
dispatch({ type: "deleted", id: 3 });     // ✅
dispatch({ type: "deleted" });            // ❌ Property 'id' is missing
```

<details>
<summary>How do you make a component accept every attribute a normal button accepts?</summary>

Type its props as `React.ComponentProps<"button">` (intersected with your own props), and spread the rest onto the real button: `function Button({ variant, ...rest }: Props) { return <button {...rest} /> }`.
</details>

<!-- subtopic: f30_s3 -->
### Component patterns: composition, compound components, render props, HOCs

**1. Composition with children and slots.** Before adding a prop for every variation, let the parent pass the content in:

```tsx
function Dialog({ title, footer, children }: { title: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="dialog">
      <header>{title}</header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

<Dialog title="Delete task?" footer={<><Button variant="ghost">Cancel</Button><Button>Delete</Button></>}>
  This can't be undone.
</Dialog>
```

Composition also helps performance: `children` created by the parent don't re-render when the wrapper's own state changes (Module 21).

**2. Compound components.** Several components that work together and share state through context, giving a flexible, readable API (this is how libraries like Radix and Headless UI are built):

```tsx
const TabsContext = createContext<{ active: string; setActive: (id: string) => void } | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be inside <Tabs>");
  return ctx;
};

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
}
function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const { active, setActive } = useTabs();
  return <button role="tab" aria-selected={active === id} onClick={() => setActive(id)}>{children}</button>;
}
function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  return useTabs().active === id ? <div role="tabpanel">{children}</div> : null;
}
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

<Tabs defaultTab="open">
  <Tabs.List>
    <Tabs.Tab id="open">Open</Tabs.Tab>
    <Tabs.Tab id="done">Done</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="open"><TaskList status="TODO" /></Tabs.Panel>
  <Tabs.Panel id="done"><TaskList status="DONE" /></Tabs.Panel>
</Tabs>
```

The user of `Tabs` decides the layout and order; `Tabs` handles the state.

**3. Render props.** A component takes a **function** that returns what to render, and calls it with its data:

```tsx
function MousePosition({ children }: { children: (pos: { x: number; y: number }) => React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>{children(pos)}</div>;
}

<MousePosition>{({ x, y }) => <p>{x}, {y}</p>}</MousePosition>
```

**4. Higher-order components (HOCs).** A function that takes a component and returns a new one with extra behaviour:

```tsx
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function Protected(props: P) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
}
const SettingsPage = withAuth(Settings);
```

Render props and HOCs were the main ways to **share logic** before hooks (2019). Today a **custom hook** usually does it more simply (`useMousePosition()`, `useAuth()`), with no extra components and no "wrapper hell" in DevTools. You still meet them in older code and in some libraries (Redux's `connect`, React Router v5's `withRouter`), and interviewers ask you to compare them:

| Pattern | Shares | Today |
|---|---|---|
| composition / children | layout | everywhere |
| compound components | state among related parts | UI libraries, design systems |
| render props | logic, letting the caller render | mostly replaced by hooks |
| HOCs | logic, by wrapping | mostly replaced by hooks; route guards as wrapper components |
| custom hooks | logic | the default |

<details>
<summary>Why did custom hooks mostly replace HOCs and render props?</summary>

Hooks share stateful logic without adding components to the tree, so there's no wrapper nesting, no prop name collisions between HOCs, and the data flow is visible right where you call the hook. They also compose easily: one hook can call several others.
</details>

<!-- subtopic: f30_s4 -->
### Portals, and passing refs to your components

**Portals** render a component's output into a **different DOM node**, usually `document.body`, while it stays in the same place in the **React** tree:

```tsx
import { createPortal } from "react-dom";

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

Why: a modal, tooltip or dropdown rendered deep inside a card can be clipped by the card's `overflow: hidden`, or hidden under other content because of a parent's stacking context (`z-index`, `transform`). Rendering it at the end of `body` escapes all of that.

Two things to know:

- **Events bubble through the React tree, not the DOM tree.** A click inside the portal still reaches `onClick` handlers on the component's React parents, even though in the DOM it's under `body`.
- A portal doesn't add accessibility for free: focus the dialog when it opens, trap Tab inside, close on Escape, and restore focus afterwards (Module 24), or use the native `dialog` element.

**Passing a ref to your own component.** A parent sometimes needs the DOM node inside a child (to focus an input inside your `TextField`). In **React 19**, `ref` is simply a prop of function components:

```tsx
function TextField({ label, ref, ...rest }: React.ComponentProps<"input"> & { label: string }) {   // includes ref
  return <label>{label} <input ref={ref} {...rest} /></label>;
}

const emailRef = useRef<HTMLInputElement>(null);
<TextField label="Email" ref={emailRef} />
// later: emailRef.current?.focus();
```

Before React 19 you had to wrap the component in **`forwardRef`**, and you'll see it in most existing code:

```tsx
const TextField = forwardRef<HTMLInputElement, Props>(function TextField({ label, ...rest }, ref) {
  return <label>{label} <input ref={ref} {...rest} /></label>;
});
```

To expose specific methods instead of the whole node (say, `open()` and `close()` on a custom dialog), `useImperativeHandle` lets the child decide what the ref gives the parent. Use refs sparingly: props and state should drive most behaviour.

<details>
<summary>Why render a modal in a portal instead of where it's used?</summary>

So it isn't clipped by an ancestor's overflow or trapped under other content by an ancestor's stacking context; at the end of body it can always appear on top. It keeps its place in the React tree, so it still gets context and its events still bubble to its React parents.
</details>

<!-- subtopic: f30_s5 -->
### Class components and lifecycle methods

Before hooks (React 16.8, 2019), components with state were **classes**. Plenty of production code still uses them, and interviews ask how they map to hooks.

```tsx
type Props = { userId: number };
type State = { user: User | null; error: string | null };

class UserProfile extends React.Component<Props, State> {
  state: State = { user: null, error: null };

  componentDidMount() {                         // after the first render: like useEffect(…, [])
    this.load();
  }

  componentDidUpdate(prevProps: Props) {        // after every update: compare to react to changes
    if (prevProps.userId !== this.props.userId) this.load();
  }

  componentWillUnmount() {                      // before removal: cleanup
    this.controller?.abort();
  }

  controller?: AbortController;

  async load() {
    this.controller?.abort();
    this.controller = new AbortController();
    try {
      const res = await fetch(`/api/users/${this.props.userId}`, { signal: this.controller.signal });
      this.setState({ user: await res.json() });
    } catch (e) {
      if ((e as Error).name !== "AbortError") this.setState({ error: "Couldn't load" });
    }
  }

  handleRefresh = () => this.load();            // an arrow class field: `this` stays bound

  render() {
    const { user, error } = this.state;
    if (error) return <p>{error}</p>;
    if (!user) return <p>Loading…</p>;
    return <div><h2>{user.name}</h2><button onClick={this.handleRefresh}>Refresh</button></div>;
  }
}
```

Things that differ from hooks:

- **`this.setState` merges** the object into state (`useState` replaces), and it's asynchronous; use the function form, `this.setState(prev => ({ count: prev.count + 1 }))`, when the new state depends on the old.
- **`this` binding**: methods passed as event handlers lose `this` (Module 8), which is why handlers are arrow class fields or bound in the constructor.
- **Related logic is split across lifecycle methods** (start in `componentDidMount`, update in `componentDidUpdate`, stop in `componentWillUnmount`). A single `useEffect` with a cleanup keeps it together, which is the main reason hooks won.

| Class component | Hooks equivalent |
|---|---|
| `this.state` / `this.setState` | `useState` / `useReducer` |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate` (checking props) | `useEffect(fn, [dep])` |
| `componentWillUnmount` | the cleanup function returned from `useEffect` |
| `shouldComponentUpdate` / `PureComponent` | `React.memo` |
| instance fields (`this.timer`) | `useRef` |
| `static contextType` | `useContext` |
| `getDerivedStateFromError` / `componentDidCatch` | **no hook equivalent**: error boundaries must still be classes (Module 22) |

Methods named `UNSAFE_componentWillMount`, `UNSAFE_componentWillReceiveProps` and `UNSAFE_componentWillUpdate` are legacy; if you see them in a codebase, they're candidates for refactoring.

<details>
<summary>Which feature still requires a class component?</summary>

Error boundaries: catching render errors needs `static getDerivedStateFromError` and/or `componentDidCatch`, which have no hook equivalent. Most apps use the small react-error-boundary library, which is a class component under the hood.
</details>

<!-- subtopic: f30_s6 -->
### Next.js basics: App Router, layouts, server and client components, data and actions

**Next.js** is a React framework: routing from folders, server rendering, data loading on the server, and production defaults. Module 22 explained the ideas (SSR, Server Components); this is how a project actually looks.

```bash
npx create-next-app@latest tasks-next     # TypeScript, ESLint, Tailwind, App Router: accept the defaults
cd tasks-next && npm run dev              # http://localhost:3000
```

**Routing is the `app/` folder.** Each folder is a URL segment; special file names have special jobs:

```text
app/
├─ layout.tsx              wraps every page (html, body, nav): stays mounted between pages
├─ page.tsx                "/"
├─ loading.tsx             shown while a page in this folder loads (a Suspense fallback)
├─ error.tsx               shown if a page in this folder throws (an error boundary; must be "use client")
├─ not-found.tsx           the 404 page
└─ projects/
   ├─ page.tsx             "/projects"
   └─ [projectId]/
      └─ page.tsx          "/projects/42": [projectId] is a dynamic segment
```

**Pages are Server Components by default** (Module 22): they can be `async` and fetch data directly, and their code never ships to the browser.

```tsx
// app/projects/[projectId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddTaskForm } from "./AddTaskForm";

type Task = { id: number; title: string; status: string };

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;                  // in Next.js 15, params is a promise
  const res = await fetch(`${process.env.API_URL}/projects/${projectId}/tasks`, { cache: "no-store" });
  if (res.status === 404) notFound();
  const page: { content: Task[] } = await res.json();

  return (
    <main>
      <Link href="/projects">← Projects</Link>
      <AddTaskForm projectId={Number(projectId)} />
      <ul>{page.content.map(t => <li key={t.id}>{t.title}</li>)}</ul>
    </main>
  );
}
```

`process.env.API_URL` is read **on the server**, so it can point at your Spring API and stay out of the browser. (Variables prefixed `NEXT_PUBLIC_` are the ones exposed to the browser, the equivalent of Vite's `VITE_`.)

**Client Components** (`"use client"` at the top) are needed for state, effects, event handlers and browser APIs. Keep them small, at the leaves:

```tsx
// app/projects/[projectId]/AddTaskForm.tsx
"use client";
import { useActionState } from "react";
import { addTask } from "./actions";

export function AddTaskForm({ projectId }: { projectId: number }) {
  const [error, formAction, pending] = useActionState(addTask, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input name="title" aria-label="New task" required />
      <button disabled={pending}>{pending ? "Adding…" : "Add"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

**Server Actions** (`"use server"`) are functions that run **on the server** but can be called from a form, with no API route to write:

```ts
// app/projects/[projectId]/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function addTask(_prev: string | null, formData: FormData): Promise<string | null> {
  const projectId = formData.get("projectId");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return "Title is required";
  const res = await fetch(`${process.env.API_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, priority: 3 }),
  });
  if (!res.ok) return "Couldn't add the task";
  revalidatePath(`/projects/${projectId}`);          // re-render the page with fresh data
  return null;
}
```

Other building blocks: `next/link` for navigation, `next/image` for optimised images, `export const metadata = { title: "…" }` for the page's `title` and meta tags, `route.ts` files for API endpoints, and `middleware.ts` for things like redirecting logged-out users. With JWT auth, the token usually lives in an HttpOnly cookie that server code reads (Module 25).

**When to choose Next.js over a Vite SPA** (Module 22): public pages that need SEO and fast first loads (marketing sites, e-commerce, blogs), or when you want server-side data loading. For an app entirely behind a login that talks to a Spring API, like the project in Module 29, a Vite SPA is simpler and just as good. Deploying Next.js is easiest on **Vercel** (the company behind it), though it runs anywhere Node runs.

<details>
<summary>In the Next.js App Router, how do you decide between a Server Component and a Client Component?</summary>

Server by default: fetching data, reading secrets, rendering static content. Switch a component to a Client Component with "use client" only when it needs state, effects, event handlers or browser APIs, and keep those as small leaves so most of the page ships no JavaScript.
</details>

## 📝 Module 30 Recap

1. Type for children? → **React.ReactNode**
2. Type of an input's onChange event? → **React.ChangeEvent&lt;HTMLInputElement&gt;**
3. Why useState&lt;Task[]&gt;([]) instead of useState([])? → **an empty array would be inferred as never[]**
4. Props of a real button, plus your own? → **React.ComponentProps&lt;"button"&gt; & YourProps**
5. What are compound components? → **related components sharing state through context, like Tabs.List and Tabs.Panel**
6. What replaced most HOCs and render props? → **custom hooks**
7. What does createPortal do? → **renders children into another DOM node while keeping their place in the React tree**
8. How do you pass a ref to your own component in React 19? → **as a normal ref prop (forwardRef before 19)**
9. componentWillUnmount in hooks? → **the cleanup function returned from useEffect**
10. What still needs a class component? → **error boundaries**
11. Next.js App Router file for a URL like /projects/42? → **app/projects/[projectId]/page.tsx**
12. What does "use server" mark? → **a Server Action: a function that runs on the server, callable from a form**
