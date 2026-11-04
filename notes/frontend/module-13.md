# Frontend 13 — TypeScript Basics

> **TypeScript is JavaScript with types.** After Java, it will feel familiar: the compiler tells you about mistakes before the code runs. Most React jobs today use TypeScript, and adding types to everything you learned in Modules 5–12 takes surprisingly little.

<!-- subtopic: f13_s1 -->
### Why TypeScript, and setting it up

JavaScript only finds type mistakes when the code runs, often in front of a user:

```js
function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
total([{ name: "Book", prise: 12 }]);   // NaN: a typo nobody noticed
```

TypeScript checks it **while you type**:

```ts
type Item = { name: string; price: number };

function total(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
total([{ name: "Book", prise: 12 }]);
// ❌ Object literal may only specify known properties, and 'prise' does not exist in type 'Item'.
```

What you get:

- **Errors before running**: typos, wrong arguments, possibly-undefined values.
- **Autocomplete everywhere**: your editor knows every property of every object.
- **Safe refactoring**: rename a field and the compiler lists every place that breaks.
- **Types as documentation**: a function's signature says what it needs and returns.

How it works: you write `.ts` (or `.tsx` for React) files, and the TypeScript compiler (`tsc`) **checks** them and **strips the types**, producing plain JavaScript. Types never exist at runtime, so there's no speed cost, and also no runtime checking (more on that in Module 14).

Setting up:

```bash
npm create vite@latest my-app -- --template react-ts   # the usual way: React + TS, ready to go
# or, for plain TypeScript:
npm install -D typescript
npx tsc --init          # creates tsconfig.json
npx tsc                 # type-check and compile
npx tsc --noEmit        # only check (Vite projects do this; Vite itself just strips types)
```

<details>
<summary>Do TypeScript types check data at runtime, for example a JSON response from your API?</summary>

No. Types are erased when compiling, so at runtime it's plain JavaScript. If the server sends a different shape than your type says, TypeScript can't notice. Validate untrusted data at runtime with a library like Zod (Module 20).
</details>

<!-- subtopic: f13_s2 -->
### Basic types and inference

```ts
let title: string = "Learn TypeScript";
let day: number = 47;               // number covers integers and decimals
let done: boolean = false;
let tags: string[] = ["ts", "types"];          // or Array<string>
let scores: number[] = [90, 75];
let point: [number, number] = [3, 4];          // a tuple: fixed length, a type per position
let entry: [string, number] = ["asha", 90];
let nothing: null = null;
let notSet: undefined = undefined;
```

**Most of the time you don't write types: TypeScript infers them.**

```ts
let count = 0;              // inferred: number
count = "zero";             // ❌ Type 'string' is not assignable to type 'number'.

const names = ["asha", "ben"];   // string[]
const first = names[0];          // string
const doubled = [1, 2].map(n => n * 2);   // number[]
```

A good habit: **annotate function parameters and the shapes of your data; let inference handle local variables.**

`const` gives an even narrower type: `const lang = "ts"` has the type `"ts"` (a literal type, see below), while `let lang = "ts"` is `string`, because it could change.

<details>
<summary>let x = 5 with no annotation. What is x's type, and can you later assign "five"?</summary>

TypeScript infers `number`, and assigning a string is a compile error. Inference gives you the same safety as writing `let x: number = 5`.
</details>

<!-- subtopic: f13_s3 -->
### Typing functions

```ts
function add(a: number, b: number): number {
  return a + b;
}

const greet = (name: string, greeting = "Hello"): string => `${greeting}, ${name}`;   // default: type inferred
function log(message: string, level?: "info" | "warn"): void { /* level may be undefined */ }
function sum(...nums: number[]): number { return nums.reduce((s, n) => s + n, 0); }

add(1, "2");     // ❌ Argument of type 'string' is not assignable to parameter of type 'number'.
add(1);          // ❌ Expected 2 arguments, but got 1.
```

- `name?: type` makes a parameter **optional** (it's `type | undefined` inside).
- `void` means "returns nothing useful".
- The return type can usually be inferred, but writing it on exported functions documents them and catches mistakes inside.

Function types, for callbacks:

```ts
type Comparator = (a: number, b: number) => number;
const ascending: Comparator = (a, b) => a - b;     // a and b are inferred as number

function onEach(items: string[], callback: (item: string, index: number) => void) {
  items.forEach(callback);
}
```

Async functions return a `Promise` of something:

```ts
async function getTask(id: number): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();        // res.json() is any, so this trusts the server (see Module 14)
}
```

<details>
<summary>What's the difference between (x?: number) and (x: number | undefined)?</summary>

With `x?: number` callers may leave the argument out entirely. With `x: number | undefined` they must pass something, even if it's `undefined`. Inside the function both are `number | undefined`.
</details>

<!-- subtopic: f13_s4 -->
### Object types: interface vs type

Describe the shape of an object with an **interface** or a **type alias**:

```ts
interface Task {
  readonly id: number;        // can't be reassigned after creation
  title: string;
  done: boolean;
  dueDate?: string;           // optional
  tags: string[];
}

type User = {
  id: number;
  name: string;
  email: string;
};

const t: Task = { id: 1, title: "Learn TS", done: false, tags: [] };
t.id = 2;            // ❌ Cannot assign to 'id' because it is a read-only property.
```

Extending:

```ts
interface Admin extends User { permissions: string[] }      // interface style
type Manager = User & { teamSize: number };                 // type style: an intersection
```

| | `interface` | `type` |
|---|---|---|
| Object shapes | ✅ | ✅ |
| Extending | `extends` | `&` (intersection) |
| Unions, tuples, primitives | ❌ | ✅ `type Status = "open" \| "done"` |
| Declaration merging (two declarations combine) | ✅ | ❌ |

Rule of thumb: **use `type` by default** (it can express everything), or `interface` for object shapes if your team prefers it. Both are fine; be consistent.

TypeScript is **structural**: any object with the right shape fits, whatever it's called or wherever it came from. Unlike Java, a class doesn't need to declare `implements Task` for its objects to be accepted as a `Task`.

<details>
<summary>Name one thing a type alias can do that an interface can't.</summary>

Describe a union (`type Status = "open" | "done"`), a tuple, a primitive alias or a mapped/conditional type. Interfaces only describe object (and function) shapes.
</details>

<!-- subtopic: f13_s5 -->
### Union and literal types, and narrowing

A **union** says "one of these types"; a **literal type** is one exact value:

```ts
type Id = number | string;
type Status = "todo" | "in-progress" | "done";     // only these three strings
type Size = "sm" | "md" | "lg";

let s: Status = "done";
s = "finished";    // ❌ Type '"finished"' is not assignable to type 'Status'.
```

Literal unions replace many Java enums, and your editor autocompletes them.

To use a union safely, **narrow** it: check which member you have, and TypeScript follows your logic:

```ts
function formatId(id: number | string): string {
  if (typeof id === "number") {
    return id.toFixed(0);          // here id is number
  }
  return id.toUpperCase();         // here id is string
}

function label(user: User | null): string {
  if (!user) return "Guest";       // after this, user is User
  return user.name;
}

type Cat = { meow(): void };
type Dog = { bark(): void };
function speak(pet: Cat | Dog) {
  if ("meow" in pet) pet.meow();   // the in operator narrows
  else pet.bark();
}

function show(value: Date | string) {
  if (value instanceof Date) return value.toISOString();   // instanceof narrows
  return value;
}
```

**Strict null checks** (on in strict mode) are the biggest win: TypeScript won't let you use a value that might be `null` or `undefined` until you've handled it, which removes the "Cannot read properties of undefined" crash class.

```ts
const el = document.querySelector("#title");   // Element | null
el.textContent = "Hi";        // ❌ 'el' is possibly 'null'.
el?.classList.add("big");     // ✅
if (el) el.textContent = "Hi";   // ✅ narrowed
```

<details>
<summary>What is narrowing?</summary>

Narrowing is TypeScript working out a more specific type inside a branch from your checks (`typeof`, `instanceof`, `in`, `===`, truthiness), so a `number | string` is treated as `number` inside `if (typeof x === "number")`.
</details>

<!-- subtopic: f13_s6 -->
### any, unknown, never and strict mode

| Type | Meaning | Use it |
|---|---|---|
| `any` | turns type checking off for that value | almost never: it spreads and hides bugs |
| `unknown` | "could be anything, check before using" | for untrusted input: JSON, `catch` errors |
| `never` | a value that can't exist | functions that always throw; exhaustive checks (Module 14) |
| `void` | no useful return value | functions with no return |

```ts
let a: any = JSON.parse(text);
a.foo.bar.baz();              // compiles fine, crashes at runtime 😬

let u: unknown = JSON.parse(text);
u.foo;                        // ❌ 'u' is of type 'unknown'.
if (typeof u === "object" && u !== null && "foo" in u) {
  // now it's allowed
}

try { risky(); }
catch (err: unknown) {        // in strict mode, catch variables are unknown
  const message = err instanceof Error ? err.message : String(err);
}

function fail(message: string): never { throw new Error(message); }
```

**Turn on `"strict": true`** in `tsconfig.json` (Vite's templates already do). It enables strict null checks, no implicit `any`, and more. Without it, TypeScript lets through many of the bugs you adopted it to catch.

Sometimes you know more than the compiler. A **type assertion** tells it so, and it's your responsibility if you're wrong:

```ts
const input = document.querySelector("#email") as HTMLInputElement;   // trust me, it's an input
const canvas = document.getElementById("c")!;    // ! = "not null": use sparingly
```

<details>
<summary>any vs unknown?</summary>

Both accept any value. `any` also lets you do anything with it, switching type checking off. `unknown` makes you narrow or check the type before using it, so it's the safe choice for data you don't control.
</details>

## 📝 Module 13 Recap

1. What does TypeScript add to JavaScript? → **static types checked before the code runs**
2. Do types exist at runtime? → **no, they're erased; validate untrusted data separately**
3. Should you annotate every variable? → **no; annotate parameters and data shapes, let inference do the rest**
4. What is a tuple? → **a fixed-length array with a type per position, like [number, number]**
5. Optional parameter syntax? → **name?: type**
6. interface vs type? → **both describe objects; type can also do unions and tuples**
7. Is TypeScript nominal or structural? → **structural: the shape matters, not the name**
8. What is a literal union? → **a type allowing only exact values, like "todo" | "done"**
9. How does TypeScript narrow a union? → **from checks like typeof, instanceof, in and null checks**
10. any vs unknown? → **any disables checking; unknown forces you to check first**
11. Which tsconfig option matters most? → **"strict": true**
