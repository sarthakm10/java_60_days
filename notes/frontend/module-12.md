# Frontend 12 — JavaScript Interview Deep Dive

> **Frontend interviews test JavaScript itself, hard.** Expect "what does this print?" puzzles and "write it from scratch" tasks: debounce, throttle, deep clone, polyfills. This module collects the classics, each with a clean answer you can write on a whiteboard. Every snippet has been run, so the outputs shown are real.

<!-- subtopic: f12_s1 -->
### Type coercion puzzles

When an operator gets values of the wrong type, JavaScript converts them. The rules behind most puzzles:

- **`+` with a string** joins: the other side becomes a string.
- **Other maths operators** (`-`, `*`, `/`, `%`) convert both sides to numbers.
- **`==`** converts: `null` and `undefined` equal only each other; a boolean becomes a number; a string compared with a number becomes a number; an object is converted to a primitive first.

```js
1 + "2"            // "12"
"3" - 1            // 2
"3" * "4"          // 12
true + 1           // 2
[] + []            // ""        (both become "")
[] + {}            // "[object Object]"
"b" + "a" + +"a" + "a"   // "baNaNa"  (+"a" is NaN)

0 == false         // true   (false → 0)
"" == 0            // true   ("" → 0)
"0" == false       // true   (both → 0)
null == 0          // false  (null only equals undefined)
null == undefined  // true
NaN == NaN         // false
[1] == 1           // true   ([1] → "1" → 1)
[] == ![]          // true   (![] is false → 0; [] → "" → 0)
```

Conversions to know: `Number("")` is `0`, `Number(" 12 ")` is `12`, `Number("12px")` is `NaN`, `Number(null)` is `0`, `Number(undefined)` is `NaN`, `String([1, 2])` is `"1,2"`.

The interview takeaway: **explain the rule, then say you'd use `===`** and explicit conversions (`Number(x)`, `String(x)`) in real code.

<details>
<summary>Why is [] == ![] true?</summary>

`![]` is evaluated first: an array is truthy, so it's `false`. Now `[] == false`: the boolean becomes `0`, and the array is converted to a primitive, `""`, which becomes `0`. `0 == 0` is true.
</details>

<!-- subtopic: f12_s2 -->
### Closures in loops, var vs let, and other output questions

The most famous one:

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3, 3, 3
```

`var` makes **one** `i` for the whole function. The timers run after the loop finishes, when `i` is 3, and all three callbacks close over that same variable.

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 0, 1, 2
```

`let` creates a **new binding for each iteration**, so each callback closes over its own `i`. (The pre-ES6 fix was an IIFE: `(function (j) { setTimeout(() => console.log(j)); })(i)`.)

More classics:

```js
console.log(typeof hoisted, typeof notYet);   // function undefined
function hoisted() {}
var notYet = () => {};
```

The declaration is hoisted with its body; the `var` is hoisted too, but only as `undefined`.

```js
const obj = {
  name: "obj",
  regular() { return this.name; },
  arrow: () => this === obj,
};
console.log(obj.regular(), obj.arrow());   // obj false: the arrow's this isn't obj (it has none of its own)
```

```js
let a = { n: 1 };
let b = a;
a = { n: 2 };
console.log(b.n);   // 1: b still points to the first object; a was re-pointed, not changed
```

```js
function f() { return
  { ok: true };
}
console.log(f());   // undefined: a line break after return inserts a semicolon
```

How to approach any output question out loud: track **what is hoisted**, **which scope each variable lives in**, **what `this` is at the call**, and **which queue each callback goes in** (Module 10).

<details>
<summary>Why does the var loop print 3, 3, 3 and the let loop 0, 1, 2?</summary>

With var there's a single function-scoped i shared by all callbacks; they run after the loop ends, when it's 3. With let, each iteration gets its own block-scoped copy of i, so each callback closes over a different value.
</details>

<!-- subtopic: f12_s3 -->
### Event loop output questions

Order of execution: synchronous code → **all** microtasks (promise callbacks, code after `await`) → render → **one** task (timers, events) → microtasks again… (Module 10).

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");
// 1, 5, 3, 4, 2
```

With `async/await`: everything before the first `await` runs synchronously; the rest becomes a microtask.

```js
async function run() {
  console.log("A");
  await null;
  console.log("B");
}
console.log("start");
run();
console.log("end");
// start, A, end, B
```

A harder one:

```js
setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => {
    console.log("then 1");
    setTimeout(() => console.log("timeout in then"), 0);
  })
  .then(() => console.log("then 2"));

new Promise(resolve => {
  console.log("executor");            // the executor runs synchronously!
  resolve();
}).then(() => console.log("then 3"));

console.log("sync");
// executor, sync, then 1, then 3, then 2, timeout, timeout in then
```

Walk-through: `executor` and `sync` run synchronously. Microtasks: `then 1` (it queues a second timer), `then 3`, and then `then 2` (it was only queued when `then 1` finished). Then the tasks, in the order they were queued: `timeout`, `timeout in then`.

<details>
<summary>Does the function passed to new Promise run synchronously or later?</summary>

Synchronously, immediately when the promise is created. Only the `.then`/`.catch` callbacks are deferred, as microtasks.
</details>

<!-- subtopic: f12_s4 -->
### Debounce and throttle from scratch

Both limit how often a function runs when an event fires rapidly (typing, scrolling, resizing).

**Debounce:** run only after the calls **stop** for `wait` ms. Use it for a search box: query the API once the user pauses typing.

```js
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);                              // cancel the previous pending call
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

const search = debounce((q) => console.log("searching", q), 300);
search("j"); search("ja"); search("jav"); search("java");
// after 300 ms of quiet: searching java   (once)
```

**Throttle:** run **at most once every `wait` ms**, however often it's called. Use it for scroll or resize handlers, or a "save" button that mustn't fire 10 times.

```js
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}

const onScroll = throttle(() => console.log("scroll handled"), 200);
window.addEventListener("scroll", onScroll);
```

| | Debounce | Throttle |
|---|---|---|
| Runs | once, after the burst ends | regularly during the burst |
| Typical use | search-as-you-type, auto-save, resize end | scroll position, infinite scroll, rate-limiting clicks |

Both rely on **closures** (`timer` and `last` live on between calls) and `fn.apply(this, args)` keeps the caller's `this` and arguments. Follow-ups interviewers ask: add a `cancel()` method, or "leading edge" debounce (fire on the first call, then ignore until quiet).

<details>
<summary>Search box: debounce or throttle?</summary>

Debounce. You want one request after the user stops typing, not one every 300 ms while they type. Throttle fits continuous events where you need regular updates, like scroll position.
</details>

<!-- subtopic: f12_s5 -->
### Deep clone, flatten, curry and memoize

**Deep clone** (without `structuredClone`):

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;   // primitives and functions
  if (seen.has(value)) return seen.get(value);                     // handles circular references
  if (value instanceof Date) return new Date(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) copy[key] = deepClone(value[key], seen);
  return copy;
}
```

**Flatten** a nested array (`arr.flat(Infinity)` exists, but write it yourself):

```js
function flatten(arr, depth = Infinity) {
  return arr.reduce((out, item) =>
    Array.isArray(item) && depth > 0
      ? out.concat(flatten(item, depth - 1))
      : out.concat([item]), []);
}
flatten([1, [2, [3, [4]]]]);       // [1, 2, 3, 4]
flatten([1, [2, [3, [4]]]], 1);    // [1, 2, [3, [4]]]
```

**Curry**: turn `f(a, b, c)` into `f(a)(b)(c)`, also allowing `f(a, b)(c)`:

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);   // fn.length = number of parameters
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
const add3 = curry((a, b, c) => a + b + c);
add3(1)(2)(3);   // 6
add3(1, 2)(3);   // 6
```

**Memoize**: cache results by argument:

```js
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args));
    return cache.get(key);
  };
}
const slowSquare = (n) => { for (let i = 0; i < 1e8; i++); return n * n; };
const fastSquare = memoize(slowSquare);
fastSquare(9);   // slow the first time
fastSquare(9);   // instant: from the cache
```

That's also the idea behind React's `useMemo` (Module 18) and dynamic programming (the DSA days).

<details>
<summary>What does the WeakMap in deepClone protect against?</summary>

Circular references, like an object that contains itself. Without remembering already-copied objects, the recursion would never end. A WeakMap is used so the bookkeeping doesn't keep objects alive after the clone.
</details>

<!-- subtopic: f12_s6 -->
### Polyfills: map, filter, reduce, bind and Promise.all

A **polyfill** adds a missing built-in feature to old environments. Interviewers use them to check you really understand the feature. Name them `myMap` and so on so you don't overwrite the real ones.

```js
Array.prototype.myMap = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) result[i] = callback.call(thisArg, this[i], i, this);   // skip holes
  }
  return result;
};

Array.prototype.myFilter = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) result.push(this[i]);
  }
  return result;
};

Array.prototype.myReduce = function (callback, initial) {
  let i = 0, acc = initial;
  if (arguments.length < 2) {                       // no initial value: start from the first element
    if (this.length === 0) throw new TypeError("Reduce of empty array with no initial value");
    acc = this[0];
    i = 1;
  }
  for (; i < this.length; i++) acc = callback(acc, this[i], i, this);
  return acc;
};
```

```js
Function.prototype.myBind = function (thisArg, ...preset) {
  const fn = this;
  return function (...later) {
    return fn.apply(thisArg, [...preset, ...later]);
  };
};
```

```js
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = [];
    let done = 0;
    if (items.length === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then(value => {        // plain values count as resolved
        results[i] = value;                         // keep the original order
        if (++done === items.length) resolve(results);
      }, reject);                                   // the first failure rejects everything
    });
  });
}

promiseAll([1, Promise.resolve(2), new Promise(r => setTimeout(() => r(3), 10))]).then(console.log);
// [1, 2, 3]
```

Points interviewers look for: results **in input order** (not finish order), handling **plain values**, the **empty array** case, and rejecting on the **first** failure.

<details>
<summary>Why store results[i] = value instead of results.push(value) in promiseAll?</summary>

Promises finish in any order, but Promise.all must return results in the order the inputs were given. Writing by index keeps that order; push would order them by finish time.
</details>

<!-- subtopic: f12_s7 -->
### Iterators, generators, Symbol, WeakMap and garbage collection

**Iterators** power `for…of` and spread. Any object with a `[Symbol.iterator]` method that returns `{ next() }` can be looped over:

```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let current = this.from, last = this.to;
    return { next: () => (current <= last ? { value: current++, done: false } : { value: undefined, done: true }) };
  },
};
[...range];   // [1, 2, 3]
```

**Generators** make that much easier. `function*` returns an iterator, and `yield` pauses the function between values:

```js
function* idGenerator() {
  let id = 1;
  while (true) yield id++;      // an infinite sequence, computed lazily
}
const ids = idGenerator();
ids.next().value;   // 1
ids.next().value;   // 2
```

**Symbol** creates unique, non-clashing keys; built-in ones like `Symbol.iterator` hook into the language.

**WeakMap and WeakSet** hold their keys **weakly**: an entry doesn't stop its key object from being garbage-collected. They're perfect for attaching data to objects you don't own (like DOM nodes) without leaking memory. Keys must be objects, and you can't loop over them.

**Garbage collection:** JavaScript frees memory automatically using **mark-and-sweep**: starting from the roots (global variables, the current call stack), everything reachable is kept and the rest is freed. Memory leaks happen when something stays *reachable* by accident:

- event listeners never removed (they keep their closures alive);
- timers (`setInterval`) never cleared;
- growing caches or global arrays;
- references to removed DOM nodes.

Find leaks with the Memory tab in DevTools (heap snapshots). In React, effect cleanups exist largely for this (Module 17).

<details>
<summary>When would you use a WeakMap instead of a Map?</summary>

When the keys are objects whose lifetime you don't control (DOM nodes, other code's objects) and you only want to attach extra data while they exist. A WeakMap entry disappears when its key is garbage-collected; a Map would keep the object alive forever.
</details>

## 📝 Module 12 Recap

1. 1 + "2" and "3" - 1? → **"12" and 2**
2. null == 0? → **false; null only loosely equals undefined**
3. var loop with setTimeout prints? → **the final value every time; let prints each value**
4. Is the Promise executor synchronous? → **yes; only then/catch callbacks are deferred**
5. Code before the first await runs when? → **synchronously, when the function is called**
6. Debounce vs throttle? → **debounce: once after calls stop; throttle: at most once per interval**
7. Which concept do debounce and memoize rely on? → **closures**
8. What must promiseAll preserve? → **input order, and reject on the first failure**
9. What does a generator return? → **an iterator; yield pauses between values**
10. Why WeakMap? → **it doesn't keep its keys alive, so attached data can't leak**
11. Common memory leaks? → **listeners and timers never removed, growing caches, detached DOM nodes**
