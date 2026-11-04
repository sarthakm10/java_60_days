Functions are values in JavaScript: you can store them, pass them and return them, and they remember the variables around them. These three exercises make closures and higher-order functions click.

<!-- exercise: f6_e1 | Easy | A counter with closures -->
**Concepts:** closures · private state · returning an object of functions · default parameters

**Task.** Write `makeCounter(start = 0, step = 1)`. It returns an object with three functions: `next()` adds `step` and returns the new value, `reset()` goes back to `start`, and `value()` returns the current value. The count must be **private**: there must be no way to change it except through those functions. Two counters must not share their count.

**Starter code** · `counter.mjs`

```js
function makeCounter(start = 0, step = 1) {
  // TODO: keep the count in a variable here, and return { next, reset, value }
  return { next() { return 0; }, reset() {}, value() { return 0; } };
}

const a = makeCounter();
const b = makeCounter(100, 10);

console.log(a.next(), a.next(), a.next());
console.log(b.next(), b.next());
console.log("a is", a.value(), "and b is", b.value());
a.reset();
console.log("after reset, a is", a.value());
console.log("count is private:", a.count === undefined);
```

**Expected output**

```text
1 2 3
110 120
a is 3 and b is 120
after reset, a is 0
count is private: true
```

<!-- hints -->
- Declare `let count = start;` inside `makeCounter`, before the `return`.
- The returned functions can read and change `count` because they were created in the same scope: that's the closure.
- Each call to `makeCounter` runs the function again, so each counter gets its own `count`.
<!-- solution -->
```js
function makeCounter(start = 0, step = 1) {
  let count = start;
  return {
    next() { count += step; return count; },
    reset() { count = start; },
    value() { return count; },
  };
}

const a = makeCounter();
const b = makeCounter(100, 10);

console.log(a.next(), a.next(), a.next());
console.log(b.next(), b.next());
console.log("a is", a.value(), "and b is", b.value());
a.reset();
console.log("after reset, a is", a.value());
console.log("count is private:", a.count === undefined);
```

`count` lives in `makeCounter`'s scope. The three methods close over it, so they keep it alive after `makeCounter` returns, and nothing outside can reach it: `a.count` is `undefined` because `count` is a variable, not a property. This is how JavaScript did private state before `#private` class fields, and how React hooks keep values between renders.

<!-- exercise: f6_e2 | Medium | once and a call limiter -->
**Concepts:** higher-order functions · closures · rest parameters · `fn(...args)`

**Task.** Write two functions that wrap other functions:

1. `once(fn)` returns a function that calls `fn` the first time and returns its result; later calls don't call `fn` again and return that same first result.
2. `limit(fn, n)` returns a function that calls `fn` at most `n` times; after that it returns `undefined` and logs `"limit reached"`.

Both must pass through any arguments.

**Starter code** · `wrappers.mjs`

```js
function once(fn) {
  return fn; // TODO
}

function limit(fn, n) {
  return fn; // TODO
}

const init = once((name) => { console.log(`initialising for ${name}`); return 42; });
console.log(init("Asha"));
console.log(init("Ben"));

const add = limit((a, b) => a + b, 2);
console.log(add(1, 2));
console.log(add(3, 4));
console.log(add(5, 6));
```

**Expected output**

```text
initialising for Asha
42
42
3
7
limit reached
undefined
```

<!-- hints -->
- Both return a new function: `return function (...args) { … }` (or an arrow function).
- `once` needs two variables in the closure: a flag for "already called" and the saved result.
- `limit` needs a counter in the closure; call `fn(...args)` while it's below `n`.
<!-- solution -->
```js
function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

function limit(fn, n) {
  let calls = 0;
  return (...args) => {
    if (calls >= n) {
      console.log("limit reached");
      return undefined;
    }
    calls++;
    return fn(...args);
  };
}

const init = once((name) => { console.log(`initialising for ${name}`); return 42; });
console.log(init("Asha"));
console.log(init("Ben"));

const add = limit((a, b) => a + b, 2);
console.log(add(1, 2));
console.log(add(3, 4));
console.log(add(5, 6));
```

The rest parameter `...args` collects whatever arguments the caller passes, and the spread `fn(...args)` passes them on unchanged, so the wrappers work for any function. `once` is used in real code for setup that must happen a single time, for example creating one shared connection.

<!-- exercise: f6_e3 | Medium | compose and pipe -->
**Concepts:** functions as values · rest parameters · `reduce` · arrow functions returning functions

**Task.** Write `pipe(...fns)` and `compose(...fns)`. Both take any number of one-argument functions and return a new function. `pipe` applies them **left to right**; `compose` applies them **right to left**. Then build `slugify` with `pipe` so that it turns a title into a URL slug.

**Starter code** · `pipe.mjs`

```js
const pipe = (...fns) => (x) => x;      // TODO
const compose = (...fns) => (x) => x;   // TODO

const double = (n) => n * 2;
const inc = (n) => n + 1;
console.log(pipe(double, inc)(5));      // double first, then inc
console.log(compose(double, inc)(5));   // inc first, then double

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const dashes = (s) => s.replace(/\s+/g, "-");
const stripSymbols = (s) => s.replace(/[^a-z0-9-]/g, "");

const slugify = (s) => s;               // TODO: use pipe with the four functions above
console.log(slugify("  Learn React in 30 Days!  "));
console.log(slugify("Spring Boot + JWT: Login"));
```

**Expected output**

```text
11
12
learn-react-in-30-days
spring-boot--jwt-login
```

<!-- hints -->
- `pipe` can use `fns.reduce((value, fn) => fn(value), x)`: start with `x` and feed each result into the next function.
- `compose` is the same with `reduceRight`.
- Order matters for `slugify`: trim and lowercase before turning spaces into dashes, and strip symbols last.
<!-- solution -->
```js
const pipe = (...fns) => (x) => fns.reduce((value, fn) => fn(value), x);
const compose = (...fns) => (x) => fns.reduceRight((value, fn) => fn(value), x);

const double = (n) => n * 2;
const inc = (n) => n + 1;
console.log(pipe(double, inc)(5));
console.log(compose(double, inc)(5));

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const dashes = (s) => s.replace(/\s+/g, "-");
const stripSymbols = (s) => s.replace(/[^a-z0-9-]/g, "");

const slugify = pipe(trim, lower, dashes, stripSymbols);
console.log(slugify("  Learn React in 30 Days!  "));
console.log(slugify("Spring Boot + JWT: Login"));
```

`pipe(double, inc)(5)` is `inc(double(5))` = 11; `compose(double, inc)(5)` is `double(inc(5))` = 12. Note the second slug has a double dash: `" + "` became `"-+-"`, and stripping the `+` left `"--"`. Fixing that (collapse repeated dashes with one more small function) is a nice extra step, and it shows why small composable functions are easy to extend.
