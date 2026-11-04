The interview classics, written from scratch. Each one comes up again and again in frontend interviews, and each test harness here prints the same output every run, so you know when you've got it right.

<!-- exercise: f12_e1 | Medium | Debounce, with cancel -->
**Concepts:** closures · `setTimeout` / `clearTimeout` · `fn.apply(this, args)` · returning a function with a method

**Task.** Write `debounce(fn, wait)`. The returned function delays calling `fn` until `wait` ms have passed **since the last call**, then calls it once with the **last** arguments. It also has a `cancel()` method that drops a pending call. The harness simulates fast typing.

**Starter code** · `debounce.mjs`

```js
function debounce(fn, wait) {
  // TODO: return a debounced function with a .cancel() method
  return fn;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const search = debounce((q) => console.log(`search: ${q}`), 50);

search("r"); search("re"); search("rea"); search("react");   // typing fast
await sleep(100);                                             // a pause → one search

search("react h"); await sleep(20); search("react hooks");    // a gap shorter than 50 ms
await sleep(100);

search("vue");
search.cancel();                                              // the user cleared the box
await sleep(100);
console.log("done");
```

**Expected output**

```text
search: react
search: react hooks
done
```

<!-- hints -->
- Keep `let timer;` in the closure. Each call does `clearTimeout(timer)` and starts a new `setTimeout`.
- Use a regular `function (...args)` (not an arrow) for the returned function so `this` is the caller's, and call `fn.apply(this, args)` inside the timer callback (an arrow there keeps that `this`).
- Functions are objects, so you can attach a method: `debounced.cancel = () => clearTimeout(timer);`.
<!-- solution -->
```js
function debounce(fn, wait) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  }
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const search = debounce((q) => console.log(`search: ${q}`), 50);

search("r"); search("re"); search("rea"); search("react");
await sleep(100);

search("react h"); await sleep(20); search("react hooks");
await sleep(100);

search("vue");
search.cancel();
await sleep(100);
console.log("done");
```

Every call resets the timer, so `fn` runs only after a 50 ms quiet period, with the latest query. The 20 ms gap wasn't long enough, so `"react h"` never searched. `cancel` matters in real apps: when a component unmounts, cancel its pending debounced calls so they don't run against a page that's gone (in React, from an effect cleanup).

<!-- exercise: f12_e2 | Medium | Polyfills for map, filter and reduce -->
**Concepts:** `Array.prototype` · `this` inside a method · callbacks with `(item, index, array)` · the reduce initial-value rule

**Task.** Add `myMap`, `myFilter` and `myReduce` to `Array.prototype`, behaving like the built-ins:

- callbacks receive `(item, index, array)`;
- `myReduce` without an initial value starts from the first element, and on an empty array without an initial value throws `TypeError("Reduce of empty array with no initial value")`.

Don't call the built-in `map`, `filter` or `reduce` inside them.

**Starter code** · `polyfills.mjs`

```js
Array.prototype.myMap = function (callback) {
  // TODO
};
Array.prototype.myFilter = function (callback) {
  // TODO
};
Array.prototype.myReduce = function (callback, initial) {
  // TODO
};

const nums = [1, 2, 3, 4];
console.log(nums.myMap((n, i) => n * 10 + i));
console.log(nums.myFilter(n => n % 2 === 0));
console.log(nums.myReduce((sum, n) => sum + n));
console.log(nums.myReduce((sum, n) => sum + n, 100));
console.log(["a", "b"].myMap((x, i, arr) => `${x}${i}/${arr.length}`));
console.log([[1, 2], [3]].myReduce((flat, part) => [...flat, ...part], []));
try {
  [].myReduce((a, b) => a + b);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
console.log("same as built-ins:", JSON.stringify(nums.myMap(n => n * 2)) === JSON.stringify(nums.map(n => n * 2)));
```

**Expected output**

```text
[ 10, 21, 32, 43 ]
[ 2, 4 ]
10
110
[ 'a0/2', 'b1/2' ]
[ 1, 2, 3 ]
TypeError: Reduce of empty array with no initial value
same as built-ins: true
```

<!-- hints -->
- Inside a method added to `Array.prototype`, `this` is the array it's called on. Use a regular `function`, not an arrow function, or you lose that `this`.
- `myMap`: loop with `for (let i = 0; i < this.length; i++)` and push `callback(this[i], i, this)`.
- `myReduce` needs to know whether an initial value was passed at all, even if it's `undefined`: check `arguments.length < 2`.
<!-- solution -->
```js
Array.prototype.myMap = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) result.push(callback(this[i], i, this));
  return result;
};

Array.prototype.myFilter = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i, this)) result.push(this[i]);
  }
  return result;
};

Array.prototype.myReduce = function (callback, initial) {
  let i = 0;
  let acc = initial;
  if (arguments.length < 2) {
    if (this.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[0];
    i = 1;
  }
  for (; i < this.length; i++) acc = callback(acc, this[i], i, this);
  return acc;
};

const nums = [1, 2, 3, 4];
console.log(nums.myMap((n, i) => n * 10 + i));
console.log(nums.myFilter(n => n % 2 === 0));
console.log(nums.myReduce((sum, n) => sum + n));
console.log(nums.myReduce((sum, n) => sum + n, 100));
console.log(["a", "b"].myMap((x, i, arr) => `${x}${i}/${arr.length}`));
console.log([[1, 2], [3]].myReduce((flat, part) => [...flat, ...part], []));
try {
  [].myReduce((a, b) => a + b);
} catch (e) {
  console.log(e.name + ": " + e.message);
}
console.log("same as built-ins:", JSON.stringify(nums.myMap(n => n * 2)) === JSON.stringify(nums.map(n => n * 2)));
```

The details interviewers look for: a regular `function` so `this` is the array; the three callback arguments; and `arguments.length` to tell "no initial value" from "an initial value of `undefined`". (The real built-ins also skip holes in sparse arrays, `if (i in this)`, and take a `thisArg`; mention them as follow-ups.) In real code, never add methods to built-in prototypes: it can clash with future JavaScript features.

<!-- exercise: f12_e3 | Hard | Promise.all from scratch -->
**Concepts:** `new Promise` · settling once · keeping input order · `Promise.resolve` for plain values · the empty case

**Task.** Write `promiseAll(items)` that behaves like `Promise.all`:

- resolves with an array of results **in the input order**, not the finishing order;
- accepts plain values as well as promises;
- resolves immediately with `[]` for an empty array;
- rejects as soon as any item rejects, with that error.

**Starter code** · `promise-all.mjs`

```js
function promiseAll(items) {
  // TODO
  return Promise.resolve([]);
}

const delay = (value, ms, fail = false) =>
  new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(value)) : res(value)), ms));

console.log(await promiseAll([delay("slow", 30), delay("fast", 5), 42]));
console.log(await promiseAll([]));
try {
  await promiseAll([delay("a", 20), delay("boom", 5, true), delay("c", 10)]);
} catch (e) {
  console.log("rejected with:", e.message);
}
const same = JSON.stringify(await promiseAll([3, delay(1, 5), delay(2, 1)])) === JSON.stringify(await Promise.all([3, delay(1, 5), delay(2, 1)]));
console.log("matches Promise.all:", same);
```

**Expected output**

```text
[ 'slow', 'fast', 42 ]
[]
rejected with: boom
matches Promise.all: true
```

<!-- hints -->
- Return `new Promise((resolve, reject) => { … })`, and handle `items.length === 0` first.
- Wrap each item with `Promise.resolve(item)` so plain values work like resolved promises.
- Store each result at its own index, `results[i] = value`, and count how many have finished; resolve when the count reaches `items.length`.
- Pass `reject` as the second argument of each `then`: the first rejection wins, and later calls are ignored because a promise settles only once.
<!-- solution -->
```js
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let done = 0;
    if (items.length === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then(value => {
        results[i] = value;
        done++;
        if (done === items.length) resolve(results);
      }, reject);
    });
  });
}

const delay = (value, ms, fail = false) =>
  new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(value)) : res(value)), ms));

console.log(await promiseAll([delay("slow", 30), delay("fast", 5), 42]));
console.log(await promiseAll([]));
try {
  await promiseAll([delay("a", 20), delay("boom", 5, true), delay("c", 10)]);
} catch (e) {
  console.log("rejected with:", e.message);
}
const same = JSON.stringify(await promiseAll([3, delay(1, 5), delay(2, 1)])) === JSON.stringify(await Promise.all([3, delay(1, 5), delay(2, 1)]));
console.log("matches Promise.all:", same);
```

"slow" finishes last but stays first, because each result is written to its own index. Counting finished items matters: checking `results.length` instead wouldn't work, because writing `results[2]` first makes an array's length 3 straight away (and `new Array(n)` has length `n` from the start). And there's no need to guard against resolving twice: once a promise is settled, extra `resolve`/`reject` calls do nothing.

<!-- exercise: f12_e4 | Hard | Deep clone with circular references -->
**Concepts:** recursion · `Array.isArray` · `instanceof Date` / `Map` · `WeakMap` to remember visited objects

**Task.** Write `deepClone(value)` that copies every level of nested objects and arrays, also supporting `Date` and `Map`, and objects that refer to themselves (circular references), without using `structuredClone` or `JSON`. Functions and primitives are returned as they are.

**Starter code** · `deep-clone.mjs`

```js
function deepClone(value) {
  // TODO
  return value;
}

const original = {
  name: "Asha",
  joined: new Date("2026-01-15T00:00:00Z"),
  skills: ["java", { name: "react", level: 2 }],
  scores: new Map([["dsa", 80]]),
  greet() { return `Hi, ${this.name}`; },
};
original.self = original;                  // a circular reference

const copy = deepClone(original);
copy.skills[1].level = 5;
copy.scores.set("dsa", 95);
copy.joined.setUTCFullYear(2030);

console.log("new object:", copy !== original);
console.log("nested copied:", original.skills[1].level, copy.skills[1].level);
console.log("map copied:", original.scores.get("dsa"), copy.scores.get("dsa"));
console.log("date copied:", original.joined.getUTCFullYear(), copy.joined.getUTCFullYear());
console.log("cycle kept:", copy.self === copy, copy.self !== original);
console.log("method works:", copy.greet());
```

**Expected output**

```text
new object: true
nested copied: 2 5
map copied: 80 95
date copied: 2026 2030
cycle kept: true true
method works: Hi, Asha
```

<!-- hints -->
- Base case: `if (value === null || typeof value !== "object") return value;` covers primitives and functions.
- Pass a `WeakMap` of already-cloned objects through the recursion: if `seen.has(value)`, return `seen.get(value)`. That's what stops infinite recursion on `original.self`.
- Register the new copy in `seen` **before** cloning its children, so a child pointing back to the parent finds it.
- Special cases first: `new Date(value)`, and for a `Map`, a new Map with each key and value cloned.
<!-- solution -->
```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof Date) return new Date(value);

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    for (const [k, v] of value) copy.set(deepClone(k, seen), deepClone(v, seen));
    return copy;
  }

  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);                         // before recursing: children may point back here
  for (const key of Object.keys(value)) copy[key] = deepClone(value[key], seen);
  return copy;
}

const original = {
  name: "Asha",
  joined: new Date("2026-01-15T00:00:00Z"),
  skills: ["java", { name: "react", level: 2 }],
  scores: new Map([["dsa", 80]]),
  greet() { return `Hi, ${this.name}`; },
};
original.self = original;

const copy = deepClone(original);
copy.skills[1].level = 5;
copy.scores.set("dsa", 95);
copy.joined.setUTCFullYear(2030);

console.log("new object:", copy !== original);
console.log("nested copied:", original.skills[1].level, copy.skills[1].level);
console.log("map copied:", original.scores.get("dsa"), copy.scores.get("dsa"));
console.log("date copied:", original.joined.getUTCFullYear(), copy.joined.getUTCFullYear());
console.log("cycle kept:", copy.self === copy, copy.self !== original);
console.log("method works:", copy.greet());
```

The `WeakMap` is the key idea: it maps each original object to its copy, so a second visit (a cycle, or the same object referenced twice) reuses the copy instead of recursing forever. It's a WeakMap so the bookkeeping never keeps objects alive. Functions are shared, not copied, which is fine because `greet` uses `this`. Follow-ups an interviewer may ask: `Set`, class instances (keep the prototype with `Object.create(Object.getPrototypeOf(value))`), and symbol keys.
