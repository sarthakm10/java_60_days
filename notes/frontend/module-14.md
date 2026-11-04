# Frontend 14 — TypeScript Advanced

> **This is the TypeScript that makes code reusable and APIs safe:** generics, deriving types from other types, and unions the compiler checks exhaustively. You'll read these in every library's types, and the common ones (`Partial`, `Pick`, `Omit`, `Record`) in everyday app code.

<!-- subtopic: f14_s1 -->
### Generics

Generics are type parameters, exactly like Java's `List<T>`:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
const n = first([1, 2, 3]);         // T is inferred as number → n: number | undefined
const s = first(["a", "b"]);        // string | undefined

interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}
type TaskList = ApiResponse<Task[]>;

class Box<T> {
  constructor(public value: T) {}
  map<U>(fn: (v: T) => U): Box<U> { return new Box(fn(this.value)); }
}
```

**Constraints** (`extends`) say what a type parameter must have, like Java's bounded types:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest("abc", "de");          // works with strings
longest([1, 2], [1, 2, 3]);    // and arrays
longest(10, 20);               // ❌ Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {   // see the next section
  return obj[key];
}
```

A typed `fetch` wrapper you'll actually use:

```ts
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;     // a promise to the compiler, not a runtime check
}
const tasks = await getJson<Task[]>("/api/tasks");
```

<details>
<summary>Why write first&lt;T&gt;(items: T[]): T instead of first(items: any[]): any?</summary>

With `any`, the result loses its type: `first([1, 2])` would be `any` and nothing is checked afterwards. The generic version links the input and output types, so the result is `number` and stays checked.
</details>

<!-- subtopic: f14_s2 -->
### keyof, typeof and indexed access

These build types **from other types or values**, so you write each shape once:

```ts
type Task = { id: number; title: string; done: boolean };

type TaskKey = keyof Task;              // "id" | "title" | "done"
type TitleType = Task["title"];         // string  (indexed access)
type IdOrTitle = Task["id" | "title"];  // number | string

const defaults = { theme: "dark", pageSize: 20 };
type Settings = typeof defaults;        // { theme: string; pageSize: number }  (typeof on a value)

const ROLES = ["admin", "editor", "viewer"] as const;   // as const: readonly, literal types
type Role = typeof ROLES[number];       // "admin" | "editor" | "viewer"
```

The `as const` trick keeps **one source of truth**: the array exists at runtime (for a dropdown), and the type is derived from it.

```ts
function sortBy<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));
}
sortBy(tasks, "title");     // ✅
sortBy(tasks, "titel");     // ❌ Argument of type '"titel"' is not assignable to parameter of type 'keyof Task'.
```

<details>
<summary>How do you get a union of an array's values as a type without repeating them?</summary>

Declare the array `as const`, then index its type by number: `const SIZES = ["sm", "md", "lg"] as const; type Size = typeof SIZES[number];` gives `"sm" | "md" | "lg"`.
</details>

<!-- subtopic: f14_s3 -->
### Utility types

Built-in generic types that transform others. These five cover most needs:

```ts
interface Task { id: number; title: string; done: boolean; dueDate?: string }

type TaskUpdate = Partial<Task>;              // every property optional: for PATCH bodies
type NewTask = Omit<Task, "id">;              // everything except id: for POST bodies
type TaskSummary = Pick<Task, "id" | "title">;  // only these
type StrictTask = Required<Task>;             // every property required (dueDate too)
type FrozenTask = Readonly<Task>;             // nothing can be reassigned

type TasksByStatus = Record<"todo" | "done", Task[]>;   // an object type with these keys
const board: TasksByStatus = { todo: [], done: [] };

function update(id: number, changes: Partial<Task>) { /* … */ }
update(1, { done: true });                    // ✅ only what changed
```

More you'll see:

| Utility | Gives |
|---|---|
| `ReturnType<typeof fn>` | the return type of a function |
| `Parameters<typeof fn>` | its parameter types, as a tuple |
| `Awaited<Promise<T>>` | `T`: what a promise resolves to |
| `NonNullable<T>` | `T` without `null` and `undefined` |
| `Exclude<U, X>` / `Extract<U, X>` | remove / keep union members |

```ts
async function loadUser() { return { id: 1, name: "Asha" }; }
type LoadedUser = Awaited<ReturnType<typeof loadUser>>;   // { id: number; name: string }
type Open = Exclude<"todo" | "doing" | "done", "done">;   // "todo" | "doing"
```

<details>
<summary>Which utility type fits a PATCH request body, and which a POST body?</summary>

`Partial<Task>` for PATCH: any subset of fields can be sent. `Omit<Task, "id">` for POST: everything except the id, which the server generates.
</details>

<!-- subtopic: f14_s4 -->
### Discriminated unions and exhaustive checks

A **discriminated union** is a union of object types that share one literal field (the "tag"). Checking the tag narrows to the exact shape:

```ts
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function render(state: RequestState<Task[]>): string {
  switch (state.status) {
    case "idle":    return "Press load";
    case "loading": return "Loading…";
    case "success": return `${state.data.length} tasks`;   // data exists only here
    case "error":   return `Failed: ${state.error}`;       // error exists only here
  }
}
```

This beats separate `isLoading`, `data` and `error` variables, where impossible combinations (loading *and* error) can sneak in. You'll use exactly this shape for fetching in React.

**Exhaustive checks** make the compiler tell you when you forget a case:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

function icon(status: "todo" | "doing" | "done"): string {
  switch (status) {
    case "todo":  return "⬜";
    case "doing": return "🔄";
    case "done":  return "✅";
    default:      return assertNever(status);   // if someone adds "blocked", this line errors
  }
}
```

If a new member is added to the union and not handled, `status` in the `default` branch is no longer `never`, and the build fails, pointing at every switch that needs updating.

<details>
<summary>Why model loading state as a discriminated union instead of three booleans?</summary>

Booleans allow impossible states (loading and error both true, or success with no data). A discriminated union allows only the valid states, and narrowing on `status` gives you `data` or `error` exactly where they exist.
</details>

<!-- subtopic: f14_s5 -->
### Mapped and conditional types, and infer

These are how the utility types are built. You'll read them more than you write them.

**Mapped types** loop over keys:

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };              // how Partial works
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type Flags<T> = { [K in keyof T]: boolean };                // same keys, boolean values
type FormErrors<T> = { [K in keyof T]?: string };           // an error message per field

type TaskErrors = FormErrors<NewTask>;   // { title?: string; done?: string; dueDate?: string }
```

**Conditional types** choose a type with a condition, `T extends U ? X : Y`:

```ts
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<"hi">;         // "yes"
type B = IsString<42>;           // "no"

type MyNonNullable<T> = T extends null | undefined ? never : T;
```

**`infer`** pulls a type out of another inside a condition:

```ts
type ElementOf<T> = T extends (infer E)[] ? E : never;
type X = ElementOf<string[]>;                     // string

type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;
type MyAwaited<P> = P extends Promise<infer V> ? V : P;
```

Template literal types build string types:

```ts
type EventName = `on${Capitalize<"click" | "focus">}`;   // "onClick" | "onFocus"
```

<details>
<summary>What does infer do in a conditional type?</summary>

It declares a type variable to be captured from the matched pattern. In `T extends Promise<infer V> ? V : T`, if T is a promise, V becomes whatever it resolves to, and the type evaluates to V.
</details>

<!-- subtopic: f14_s6 -->
### Enums vs unions, declaration files, and tsconfig

**Enums** exist in TypeScript, but most teams prefer literal unions:

```ts
enum Priority { Low, Medium, High }              // a real runtime object; Low = 0, Medium = 1…
enum Color { Red = "RED", Green = "GREEN" }      // string enum

type PriorityU = "low" | "medium" | "high";      // types only: nothing in the output JavaScript
const PRIORITIES = ["low", "medium", "high"] as const;   // when you also need the list at runtime
```

Unions are simpler, match the strings your API sends, and leave nothing behind in the bundle. (Some setups, like Node's type stripping, don't support enums at all.)

**Declaration files** (`.d.ts`) describe the types of JavaScript code. Most npm packages ship their own; for the rest, the community **DefinitelyTyped** project publishes them as `@types/…`:

```bash
npm install lodash
npm install -D @types/lodash      # types for a package that doesn't include them
```

You can declare types for globals or untyped modules yourself:

```ts
// globals.d.ts
declare module "some-untyped-lib";
interface Window { appConfig: { apiUrl: string } }
```

**tsconfig.json** essentials:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`strict` is the one that matters most; `noUncheckedIndexedAccess` makes `arr[i]` and `record[key]` possibly `undefined` (which they are); `paths` gives you `import x from "@/components/x"` instead of `../../../`.

<details>
<summary>Why do many teams prefer string unions over enums?</summary>

Unions are pure types: they add no runtime code, match JSON values directly, and are easy to derive from arrays with `as const`. Numeric enums in particular allow any number to be assigned and add a runtime object to the bundle.
</details>

## 📝 Module 14 Recap

1. What are generics? → **type parameters, like List&lt;T&gt; in Java, that keep input and output types linked**
2. What does T extends { length: number } mean? → **a constraint: T must have a numeric length**
3. keyof Task gives? → **a union of Task's property names**
4. How do you derive a union from an array? → **as const, then typeof ARR[number]**
5. Partial vs Omit vs Pick? → **all optional / everything except / only these**
6. What is Record&lt;K, V&gt;? → **an object type with keys K and values V**
7. What is a discriminated union? → **object types sharing a literal tag field that narrows to one shape**
8. How do you force a switch to handle every case? → **call assertNever(x: never) in the default branch**
9. What does infer do? → **captures a type from a pattern inside a conditional type**
10. Where do types for untyped npm packages come from? → **@types packages from DefinitelyTyped**
