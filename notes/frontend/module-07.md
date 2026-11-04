# Frontend 7 — Arrays, Objects and Modern Syntax

> **Most frontend code is reshaping data**: take the JSON from your API, filter it, sort it, pick a few fields, show it. This module is the toolkit for that, plus the modern syntax (destructuring, spread, `?.`, `??`) that fills every React file.

<!-- subtopic: f7_s1 -->
### Arrays: the basics

```js
const tasks = ["plan", "code"];
tasks.push("test");          // add at the end        → ["plan", "code", "test"]
tasks.pop();                 // remove from the end   → returns "test"
tasks.unshift("idea");       // add at the start      → ["idea", "plan", "code"]
tasks.shift();               // remove from the start → returns "idea"

tasks.length                 // 2
tasks[0]                     // "plan"
tasks.at(-1)                 // "code": negative index counts from the end
tasks.indexOf("code")        // 1 (-1 if missing)
tasks.includes("plan")       // true
tasks.join(" → ")            // "plan → code"
```

Arrays are dynamic (like Java's `ArrayList`) and can hold mixed types.

The important split: some methods **change the array in place**, others **return a new one**:

| Change the original (mutate) | Return something new |
|---|---|
| `push`, `pop`, `shift`, `unshift` | `slice`, `concat`, `map`, `filter` |
| `splice` (insert/remove in the middle) | `toSorted`, `toReversed`, `toSpliced` (newer) |
| `sort`, `reverse`, `fill` | `[...arr]`, `Array.from(arr)` |

```js
const nums = [10, 20, 30, 40];
nums.slice(1, 3);            // [20, 30]: a copy of part; nums unchanged
nums.splice(1, 2);           // removes 2 items from index 1 → nums is now [10, 40]
```

React cares a lot about this: state must be replaced, not mutated, so in React code you'll mostly use the right-hand column (Module 16).

<details>
<summary>slice vs splice?</summary>

`slice(start, end)` returns a copy of part of the array and leaves it unchanged. `splice(start, count, ...items)` removes and/or inserts items in the original array and returns the removed ones.
</details>

<!-- subtopic: f7_s2 -->
### Array methods: map, filter, reduce and friends

These replace most loops. Each takes a callback:

```js
const tasks = [
  { id: 1, title: "Learn CSS", done: true,  minutes: 60 },
  { id: 2, title: "Learn JS",  done: false, minutes: 120 },
  { id: 3, title: "Build app", done: false, minutes: 90 },
];

tasks.map(t => t.title);                         // ["Learn CSS", "Learn JS", "Build app"]
tasks.filter(t => !t.done);                      // the two unfinished tasks
tasks.find(t => t.id === 2);                     // the first match, or undefined
tasks.findIndex(t => t.id === 2);                // 1
tasks.some(t => t.done);                         // true: at least one
tasks.every(t => t.minutes > 30);                // true: all of them
tasks.reduce((sum, t) => sum + t.minutes, 0);    // 270
tasks.forEach(t => console.log(t.title));        // just loops; returns undefined
```

They chain nicely, like Java streams:

```js
const pendingTitles = tasks
  .filter(t => !t.done)
  .map(t => t.title.toUpperCase());              // ["LEARN JS", "BUILD APP"]
```

`reduce` turns an array into anything, for example counting by a key:

```js
const words = ["to", "be", "or", "not", "to", "be"];
const counts = words.reduce((acc, w) => {
  acc[w] = (acc[w] || 0) + 1;
  return acc;
}, {});                                           // { to: 2, be: 2, or: 1, not: 1 }
```

**The sort gotcha:** with no compare function, `sort` compares items **as strings**:

```js
[10, 9, 1, 100].sort();                  // [1, 10, 100, 9] 😬
[10, 9, 1, 100].sort((a, b) => a - b);   // [1, 9, 10, 100] ✅ ascending
tasks.sort((a, b) => a.title.localeCompare(b.title));   // by text
```

And `sort` mutates the array; use `toSorted` (or sort a copy, `[...arr].sort(...)`) when you need the original.

<details>
<summary>What does [1, 2, 3].map(n => { n * 2 }) return?</summary>

`[undefined, undefined, undefined]`. The braces make a block body with no `return`. Write `n => n * 2` or `n => { return n * 2; }`.
</details>

<!-- subtopic: f7_s3 -->
### Objects

An object is a collection of key → value pairs, created directly with `{ }` (no class needed):

```js
const user = {
  name: "Asha",
  age: 24,
  "favourite-lang": "Java",       // keys with dashes need quotes
  greet() {                       // method shorthand
    return `Hi, I'm ${this.name}`;
  },
};

user.name                 // "Asha"        dot notation
user["favourite-lang"]    // "Java"        bracket notation: any string, or a variable
const key = "age";
user[key]                 // 24
user.city = "Pune";       // add a property
delete user.age;          // remove one
"name" in user            // true
```

Shorthands you'll see everywhere:

```js
const name = "Ben", role = "admin";
const u = { name, role };                    // same as { name: name, role: role }
const field = "email";
const form = { [field]: "ben@x.com" };       // computed key → { email: "ben@x.com" }
```

Looping over an object:

```js
const scores = { asha: 90, ben: 75 };
Object.keys(scores)       // ["asha", "ben"]
Object.values(scores)     // [90, 75]
Object.entries(scores)    // [["asha", 90], ["ben", 75]]
for (const [name, score] of Object.entries(scores)) console.log(name, score);
Object.fromEntries([["a", 1]])   // { a: 1 }
```

`JSON` from your Spring Boot API arrives as exactly these plain objects and arrays.

<details>
<summary>When must you use bracket notation instead of the dot?</summary>

When the key isn't a valid identifier (it has a dash or space, or starts with a digit), and when the key is in a variable: `obj[key]`. `obj.key` always means the property literally named "key".
</details>

<!-- subtopic: f7_s4 -->
### Destructuring, spread and rest

**Destructuring** pulls values out of arrays and objects into variables:

```js
const user = { name: "Asha", role: "admin", address: { city: "Pune" } };

const { name, role } = user;                  // name = "Asha", role = "admin"
const { name: userName } = user;              // rename: userName = "Asha"
const { active = true } = user;               // default when missing
const { address: { city } } = user;           // nested: city = "Pune"

const [first, second] = ["a", "b", "c"];      // first = "a", second = "b"
const [, , third] = ["a", "b", "c"];          // skip: third = "c"
let x = 1, y = 2;
[x, y] = [y, x];                              // swap
```

It works in function parameters too, which is how every React component reads its props:

```js
function TaskCard({ title, done = false }) { /* … */ }
```

**Spread (`...`)** expands an array or object into another:

```js
const a = [1, 2], b = [3, 4];
const all = [...a, ...b, 5];                  // [1, 2, 3, 4, 5]
const copy = [...a];                          // a new array

const base = { theme: "dark", size: "md" };
const settings = { ...base, size: "lg" };     // { theme: "dark", size: "lg" }: later keys win
Math.max(...[3, 9, 2]);                       // 9: spread into arguments
```

**Rest (`...`)** is the opposite: it collects what's left:

```js
const { password, ...safeUser } = userFromDb;   // everything except password
const [head, ...tail] = [1, 2, 3];              // head = 1, tail = [2, 3]
```

Same three dots: **spread** on the right of `=` or in a call (expanding), **rest** on the left or in parameters (collecting).

<details>
<summary>How do you update one field of an object without changing the original?</summary>

Spread it into a new object and override the field: `const updated = { ...task, done: true }`. This is the standard way to update state in React.
</details>

<!-- subtopic: f7_s5 -->
### Optional chaining and nullish coalescing

API data is often incomplete. Reading a property of `undefined` crashes:

```js
const user = { name: "Asha" };
user.address.city;          // TypeError: Cannot read properties of undefined (reading 'city')
```

**Optional chaining `?.`** stops and returns `undefined` if the left side is `null` or `undefined`:

```js
user.address?.city          // undefined, no crash
user.getAvatar?.()          // calls only if the method exists
tasks?.[0]?.title           // safe array access
```

**Nullish coalescing `??`** gives a fallback only for `null` and `undefined`:

```js
const pageSize = settings.pageSize ?? 20;
```

Compare it with the older `||`, which falls back on **any** falsy value:

```js
const count = 0;
count || 10        // 10 😬: 0 is falsy, so it's replaced
count ?? 10        // 0  ✅: 0 is a real value
""    ?? "none"    // "": an empty string is kept too
```

Use `??` for defaults when `0`, `""` or `false` are valid values. Together:

```js
const city = user.address?.city ?? "Unknown city";
```

There are also assignment forms: `x ??= 5` (set if nullish), `x ||= 5`, `x &&= 5`.

<details>
<summary>volume = settings.volume || 50. What goes wrong when the user set volume to 0?</summary>

`0` is falsy, so `||` replaces it with 50 and the user's mute setting is ignored. `settings.volume ?? 50` keeps the 0 and only falls back when the value is null or undefined.
</details>

<!-- subtopic: f7_s6 -->
### Map, Set and JSON

`Map` and `Set` work like Java's `HashMap` and `HashSet`:

```js
const visits = new Map();
visits.set("home", 3);
visits.set("roadmap", 1);
visits.get("home");                     // 3
visits.has("sets");                     // false
visits.size;                            // 2
for (const [page, n] of visits) console.log(page, n);   // keeps insertion order

const tags = new Set(["java", "react", "java"]);
tags.size;                              // 2: duplicates are dropped
tags.has("react");                      // true
const unique = [...new Set([1, 2, 2, 3])];   // [1, 2, 3]: the classic dedupe
```

Map or plain object? A `Map` takes **any key type** (objects too), keeps insertion order, has `.size`, and is better for frequent adds and removes. A plain object is simpler for fixed, string-keyed records and is what JSON produces.

**JSON** is text. Convert in both directions:

```js
const task = { id: 1, title: "Learn JS", tags: ["js"] };
const text = JSON.stringify(task);        // '{"id":1,"title":"Learn JS","tags":["js"]}'
JSON.stringify(task, null, 2);            // pretty-printed with 2-space indents
const back = JSON.parse(text);            // an object again
```

JSON can't hold functions, `undefined`, `Map`, `Set` or `Date` objects (dates become strings). `JSON.parse` throws on invalid text, so wrap untrusted input in `try/catch`.

<details>
<summary>How do you remove duplicates from an array in one line?</summary>

`[...new Set(arr)]`. A Set keeps only unique values, and spreading it gives an array back, in the original order.
</details>

<!-- subtopic: f7_s7 -->
### References and copies

Objects and arrays are shared **by reference**: assigning one doesn't copy it.

```js
const a = { name: "Asha", skills: ["java"] };
const b = a;            // same object
b.name = "Ben";
a.name;                 // "Ben" 😬
```

A **shallow copy** creates a new outer object, but nested objects are still shared:

```js
const c = { ...a };     // or Object.assign({}, a)
c.name = "Chen";        // a.name unaffected ✅
c.skills.push("react"); // a.skills changed too 😬: same inner array
```

A **deep copy** copies every level:

```js
const d = structuredClone(a);   // built in: handles nested objects, arrays, Maps, Sets, Dates
d.skills.push("ts");            // a.skills unaffected ✅
```

(`JSON.parse(JSON.stringify(a))` is the old trick; it loses functions, `undefined` and `Date`s.)

**Comparing objects:** `===` compares references, not contents:

```js
{ x: 1 } === { x: 1 }   // false: two different objects
```

**Immutability** means never changing data in place, and creating updated copies instead:

```js
const done = { ...task, done: true };                         // update a field
const added = [...tasks, newTask];                            // add
const removed = tasks.filter(t => t.id !== id);               // remove
const edited = tasks.map(t => (t.id === id ? { ...t, title } : t));   // replace one
```

React relies on this: it compares references to see what changed, so a mutated array looks "the same" and the screen doesn't update. `Object.freeze(obj)` makes an object read-only (shallowly), but most code just follows the copy-don't-mutate habit.

<details>
<summary>Why does the spread copy { ...user } not fully protect user.address?</summary>

Spread is shallow: it copies the top-level properties, but `address` is a reference to the same nested object. Changing `copy.address.city` changes the original's too. Use `structuredClone` for a deep copy, or spread each level you change: `{ ...user, address: { ...user.address, city } }`.
</details>

## 📝 Module 7 Recap

1. Which array methods mutate? → **push, pop, shift, unshift, splice, sort, reverse, fill**
2. map vs forEach? → **map returns a new array; forEach returns undefined**
3. Why does [10, 9, 1].sort() go wrong? → **it compares as strings; pass (a, b) => a - b**
4. find vs filter? → **find returns the first match (or undefined); filter returns all matches as an array**
5. Spread vs rest? → **spread expands; rest collects what's left**
6. Copy an object with one field changed? → **{ ...obj, field: value }**
7. a?.b?.c does what? → **returns undefined instead of crashing when a or b is null or undefined**
8. ?? vs ||? → **?? falls back only on null and undefined; || on any falsy value**
9. Dedupe an array? → **[...new Set(arr)]**
10. Shallow vs deep copy? → **shallow shares nested objects; deep copies every level (structuredClone)**
11. Does { x: 1 } === { x: 1 }? → **false: different objects**
