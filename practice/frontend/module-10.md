Async code is where frontend bugs hide. These exercises use small timers instead of a real server, so they run anywhere and always give the same output, but the patterns are exactly what you'd use around `fetch`.

<!-- exercise: f10_e1 | Easy | Sequential vs parallel -->
**Concepts:** `new Promise` · `setTimeout` · `async` / `await` · `Promise.all` · measuring time

**Task.** Write `sleep(ms)` returning a promise that resolves after `ms` milliseconds, and `load(name, ms)` that waits `ms` and returns `` `${name} loaded` ``. Load three things **one after another**, then the same three **in parallel**, printing the results in order. Finally print whether parallel was faster (it should take about the longest single wait, not the sum).

**Starter code** · `parallel.mjs`

```js
function sleep(ms) {
  // TODO: return a promise that resolves after ms
}

async function load(name, ms) {
  // TODO: wait ms, then return `${name} loaded`
}

let start = Date.now();
// TODO: await each load one by one: user (60 ms), tasks (60 ms), settings (60 ms)
const sequential = [];
const seqTime = Date.now() - start;

start = Date.now();
// TODO: the same three with Promise.all
const parallel = [];
const parTime = Date.now() - start;

console.log("one by one:", sequential.join(", "));
console.log("in parallel:", parallel.join(", "));
console.log("parallel faster:", parTime < seqTime);
console.log("parallel under 150 ms:", parTime < 150);
```

**Expected output**

```text
one by one: user loaded, tasks loaded, settings loaded
in parallel: user loaded, tasks loaded, settings loaded
parallel faster: true
parallel under 150 ms: true
```

<!-- hints -->
- `sleep`: `return new Promise(resolve => setTimeout(resolve, ms));`
- `load`: ``await sleep(ms); return `${name} loaded`;``
- Sequential: three separate `await load(...)` lines, pushing each result.
- Parallel: start all three first, then `await Promise.all([load(...), load(...), load(...)])`. The results come back in the order you passed them, whichever finishes first.
<!-- solution -->
```js
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function load(name, ms) {
  await sleep(ms);
  return `${name} loaded`;
}

let start = Date.now();
const sequential = [];
sequential.push(await load("user", 60));
sequential.push(await load("tasks", 60));
sequential.push(await load("settings", 60));
const seqTime = Date.now() - start;

start = Date.now();
const parallel = await Promise.all([load("user", 60), load("tasks", 60), load("settings", 60)]);
const parTime = Date.now() - start;

console.log("one by one:", sequential.join(", "));
console.log("in parallel:", parallel.join(", "));
console.log("parallel faster:", parTime < seqTime);
console.log("parallel under 150 ms:", parTime < 150);
```

One by one takes about 180 ms (60 + 60 + 60); in parallel about 60 ms, because all three timers run at the same time. The same applies to API calls: if a page needs the user, their tasks and their settings and none depends on another, `Promise.all` makes the page load as fast as the slowest request instead of all three added up. (Top-level `await` works because the file is an ES module, hence the `.mjs`.)

<!-- exercise: f10_e2 | Medium | Retry with backoff -->
**Concepts:** `async` loops · `try` / `catch` with `await` · rethrowing · exponential backoff

**Task.** Write `retry(fn, { attempts = 3, delay = 20 } = {})`. It calls the async function `fn`; if it throws, it waits and tries again, doubling the wait each time (20, 40, 80…), up to `attempts` tries in total. It logs each failure as shown, returns the first successful result, and if every try fails, throws an `Error` whose message is `` `Failed after ${attempts} attempts: ${lastError.message}` ``.

**Starter code** · `retry.mjs`

```js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retry(fn, { attempts = 3, delay = 20 } = {}) {
  // TODO
  return fn();
}

// A flaky "request" that fails the first `failures` times
function flaky(failures) {
  let calls = 0;
  return async () => {
    calls++;
    if (calls <= failures) throw new Error(`503 on call ${calls}`);
    return `ok on call ${calls}`;
  };
}

console.log(await retry(flaky(2)));
try {
  await retry(flaky(5), { attempts: 3 });
} catch (e) {
  console.log("Gave up:", e.message);
}
```

**Expected output**

```text
  attempt 1 failed (503 on call 1), retrying in 20 ms
  attempt 2 failed (503 on call 2), retrying in 40 ms
ok on call 3
  attempt 1 failed (503 on call 1), retrying in 20 ms
  attempt 2 failed (503 on call 2), retrying in 40 ms
Gave up: Failed after 3 attempts: 503 on call 3
```

<!-- hints -->
- Use a normal `for (let i = 1; i <= attempts; i++)` loop with `try { return await fn(); } catch (err) { … }` inside. The `await` matters: without it, the rejection escapes the `try`.
- Keep the last error in a variable declared before the loop.
- Only wait (and log) when there's another attempt left; the wait for try `i` is `delay * 2 ** (i - 1)`.
- After the loop, `throw new Error(...)` with the last error's message.
<!-- solution -->
```js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retry(fn, { attempts = 3, delay = 20 } = {}) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts) {
        const wait = delay * 2 ** (i - 1);
        console.log(`  attempt ${i} failed (${err.message}), retrying in ${wait} ms`);
        await sleep(wait);
      }
    }
  }
  throw new Error(`Failed after ${attempts} attempts: ${lastError.message}`);
}

function flaky(failures) {
  let calls = 0;
  return async () => {
    calls++;
    if (calls <= failures) throw new Error(`503 on call ${calls}`);
    return `ok on call ${calls}`;
  };
}

console.log(await retry(flaky(2)));
try {
  await retry(flaky(5), { attempts: 3 });
} catch (e) {
  console.log("Gave up:", e.message);
}
```

`return await fn()` inside `try` is the important line: `return fn()` without `await` would hand the promise back to the caller before it settles, so a rejection would skip this `catch` entirely. Doubling the delay (exponential backoff) gives a struggling server room to recover. Only retry requests that are safe to repeat (GET, or idempotent PUTs): retrying a failed "pay now" POST could charge twice.

<!-- exercise: f10_e3 | Medium | Timeouts and allSettled -->
**Concepts:** `Promise.race` · `Promise.allSettled` · rejecting with an `Error` · clearing timers

**Task.** Write `withTimeout(promise, ms)`: it resolves or rejects like `promise`, unless `ms` passes first, in which case it rejects with `` new Error(`Timed out after ${ms} ms`) ``. Clear the timer when the promise wins, so it doesn't keep the program alive. Then load three "widgets" with `Promise.allSettled` and print one line per widget, as shown.

**Starter code** · `timeout.mjs`

```js
const fakeRequest = (value, ms, fail = false) =>
  new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error(`${value} failed`)) : resolve(value)), ms));

function withTimeout(promise, ms) {
  return promise; // TODO: race it against a timer
}

console.log(await withTimeout(fakeRequest("fast data", 10), 100));
try {
  await withTimeout(fakeRequest("slow data", 300), 50);
} catch (e) {
  console.log("Error:", e.message);
}

const widgets = ["news", "weather", "stocks"];
const results = await Promise.allSettled([
  withTimeout(fakeRequest("news: 3 headlines", 10), 100),
  withTimeout(fakeRequest("weather", 20, true), 100),
  withTimeout(fakeRequest("stocks: ▲ 1.2%", 300), 100),
]);
// TODO: print "✓ news → …" for fulfilled and "✗ weather → …" for rejected
```

**Expected output**

```text
fast data
Error: Timed out after 50 ms
✓ news → news: 3 headlines
✗ weather → weather failed
✗ stocks → Timed out after 100 ms
```

<!-- hints -->
- Make a timeout promise: `new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(...)), ms); })`, with `let timer` declared outside it.
- `Promise.race([promise, timeout])` settles like whichever settles first. Add `.finally(() => clearTimeout(timer))`.
- Each `allSettled` result has `status` (`"fulfilled"` or `"rejected"`) and either `value` or `reason`; use the index to find the widget's name.
<!-- solution -->
```js
const fakeRequest = (value, ms, fail = false) =>
  new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error(`${value} failed`)) : resolve(value)), ms));

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

console.log(await withTimeout(fakeRequest("fast data", 10), 100));
try {
  await withTimeout(fakeRequest("slow data", 300), 50);
} catch (e) {
  console.log("Error:", e.message);
}

const widgets = ["news", "weather", "stocks"];
const results = await Promise.allSettled([
  withTimeout(fakeRequest("news: 3 headlines", 10), 100),
  withTimeout(fakeRequest("weather", 20, true), 100),
  withTimeout(fakeRequest("stocks: ▲ 1.2%", 300), 100),
]);
results.forEach((r, i) => {
  console.log(r.status === "fulfilled" ? `✓ ${widgets[i]} → ${r.value}` : `✗ ${widgets[i]} → ${r.reason.message}`);
});
```

`Promise.race` doesn't cancel the slow request: it only stops *waiting* for it. With `fetch`, you'd also pass an `AbortController` signal and call `abort()` on timeout (or use `AbortSignal.timeout(ms)`), so the browser actually drops the request. `allSettled` is the right tool for a dashboard: one failing widget shows an error, and the others still render.
