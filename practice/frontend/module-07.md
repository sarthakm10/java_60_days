Reshaping data is most of frontend work: the JSON from your API arrives, and you filter, sort, group and update it before showing it. These exercises use the array methods and modern syntax from Module 7 on realistic data.

<!-- exercise: f7_e1 | Easy | Shopping cart totals -->
**Concepts:** `map` · `filter` · `reduce` · `sort` with a compare function · `toLocaleString`

**Task.** Using only array methods (no `for` loops), print:

1. the cart total (price × quantity for each item);
2. the names of items whose line total is more than 500, in upper case;
3. the item names sorted by price, cheapest first;
4. whether every item is in stock, and whether some item costs over 1000.

**Starter code** · `cart.mjs`

```js
const cart = [
  { name: "Notebook", price: 120, qty: 3, inStock: true },
  { name: "Headphones", price: 1499, qty: 1, inStock: true },
  { name: "Pen", price: 25, qty: 10, inStock: true },
  { name: "Backpack", price: 899, qty: 1, inStock: false },
];

const total = 0;           // TODO: reduce
const bigItems = [];       // TODO: filter + map
const byPrice = [];        // TODO: sort a copy + map
const allInStock = false;  // TODO: every
const anyOver1000 = false; // TODO: some

console.log(`Total: ₹${total.toLocaleString("en-IN")}`);
console.log(`Over ₹500: ${bigItems.join(", ")}`);
console.log(`Cheapest first: ${byPrice.join(" < ")}`);
console.log(`All in stock: ${allInStock}, any over ₹1000: ${anyOver1000}`);
```

**Expected output**

```text
Total: ₹3,008
Over ₹500: HEADPHONES, BACKPACK
Cheapest first: Pen < Notebook < Backpack < Headphones
All in stock: false, any over ₹1000: true
```

<!-- hints -->
- `reduce((sum, item) => sum + item.price * item.qty, 0)` adds up the line totals; don't forget the `0` start value.
- For the big items, `filter` on `item.price * item.qty > 500`, then `map` to `item.name.toUpperCase()`.
- `sort` changes the array, so sort a copy: `[...cart].sort((a, b) => a.price - b.price)`.
- `every` is true only if the test passes for all items; `some` if it passes for at least one.
<!-- solution -->
```js
const cart = [
  { name: "Notebook", price: 120, qty: 3, inStock: true },
  { name: "Headphones", price: 1499, qty: 1, inStock: true },
  { name: "Pen", price: 25, qty: 10, inStock: true },
  { name: "Backpack", price: 899, qty: 1, inStock: false },
];

const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
const bigItems = cart.filter(item => item.price * item.qty > 500).map(item => item.name.toUpperCase());
const byPrice = [...cart].sort((a, b) => a.price - b.price).map(item => item.name);
const allInStock = cart.every(item => item.inStock);
const anyOver1000 = cart.some(item => item.price > 1000);

console.log(`Total: ₹${total.toLocaleString("en-IN")}`);
console.log(`Over ₹500: ${bigItems.join(", ")}`);
console.log(`Cheapest first: ${byPrice.join(" < ")}`);
console.log(`All in stock: ${allInStock}, any over ₹1000: ${anyOver1000}`);
```

Each line is one chain of array methods, with no mutable counters or loops. Sorting a copy (`[...cart]`) keeps `cart` in its original order, which matters when the same array is shown elsewhere on the page.

<!-- exercise: f7_e2 | Medium | Group tasks by status -->
**Concepts:** `reduce` into an object · computed keys · `Object.entries` · destructuring · `??`

**Task.** Write `groupBy(items, key)` that returns an object mapping each value of `key` to the array of items with that value. Use it to group the tasks by `status`, then print each group with its count and titles. Then print each assignee's number of open (not `"done"`) tasks; tasks with no assignee count as `"unassigned"`.

**Starter code** · `group.mjs`

```js
const tasks = [
  { id: 1, title: "Login page", status: "done", assignee: "asha" },
  { id: 2, title: "Task API", status: "in-progress", assignee: "ben" },
  { id: 3, title: "Unit tests", status: "todo", assignee: "asha" },
  { id: 4, title: "Deploy", status: "todo" },
  { id: 5, title: "Dark mode", status: "in-progress", assignee: "asha" },
];

function groupBy(items, key) {
  return {}; // TODO
}

const byStatus = groupBy(tasks, "status");
// TODO: print "status (count): title, title" for each status

// TODO: open tasks per assignee, "unassigned" when missing
```

**Expected output**

```text
done (1): Login page
in-progress (2): Task API, Dark mode
todo (2): Unit tests, Deploy
Open tasks: ben 1, asha 2, unassigned 1
```

<!-- hints -->
- In `groupBy`, start `reduce` with `{}`; for each item read `const k = item[key]`, create `groups[k] = groups[k] ?? []` if needed, push the item, and return `groups`.
- `Object.entries(byStatus)` gives `[status, list]` pairs you can destructure in a `for...of`.
- For the assignee counts, filter out done tasks first, then count with `reduce` into an object, using `task.assignee ?? "unassigned"` as the key.
<!-- solution -->
```js
const tasks = [
  { id: 1, title: "Login page", status: "done", assignee: "asha" },
  { id: 2, title: "Task API", status: "in-progress", assignee: "ben" },
  { id: 3, title: "Unit tests", status: "todo", assignee: "asha" },
  { id: 4, title: "Deploy", status: "todo" },
  { id: 5, title: "Dark mode", status: "in-progress", assignee: "asha" },
];

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const k = item[key];
    (groups[k] ??= []).push(item);
    return groups;
  }, {});
}

const byStatus = groupBy(tasks, "status");
for (const [status, list] of Object.entries(byStatus)) {
  console.log(`${status} (${list.length}): ${list.map(t => t.title).join(", ")}`);
}

const open = tasks
  .filter(t => t.status !== "done")
  .reduce((counts, t) => {
    const who = t.assignee ?? "unassigned";
    counts[who] = (counts[who] ?? 0) + 1;
    return counts;
  }, {});
console.log(`Open tasks: ${Object.entries(open).map(([who, n]) => `${who} ${n}`).join(", ")}`);
```

`(groups[k] ??= [])` creates the array the first time a key is seen and returns it every time, so `push` always has an array to work with. Objects keep string keys in insertion order, which is why the groups print in the order their first task appears. (Newer runtimes also have `Object.groupBy(tasks, t => t.status)` built in.)

<!-- exercise: f7_e3 | Medium | Immutable task updates -->
**Concepts:** spread for arrays and objects · `map` / `filter` to update · shallow vs deep copies · `structuredClone`

**Task.** Write four functions that **never change their input** and return new data: `addTask(tasks, title)`, `toggleTask(tasks, id)`, `renameTask(tasks, id, title)` and `addTag(tasks, id, tag)` (tags are an array inside each task). The new task's id is one more than the largest id. The final lines prove the original array and its objects were not changed.

**Starter code** · `immutable.mjs`

```js
const original = [
  { id: 1, title: "Learn spread", done: false, tags: ["js"] },
  { id: 2, title: "Learn map", done: true, tags: [] },
];

const addTask = (tasks, title) => tasks;             // TODO
const toggleTask = (tasks, id) => tasks;             // TODO
const renameTask = (tasks, id, title) => tasks;      // TODO
const addTag = (tasks, id, tag) => tasks;            // TODO: copy the tags array too!

let next = addTask(original, "Learn filter");
next = toggleTask(next, 1);
next = renameTask(next, 2, "Master map");
next = addTag(next, 1, "react");

for (const t of next) console.log(`${t.id}. ${t.title} [${t.done ? "x" : " "}] ${t.tags.join(",")}`);
console.log("original length:", original.length);
console.log("original[0] untouched:", original[0].done === false && original[0].tags.length === 1);
console.log("same object reused for unchanged task 2? ", next[1] === original[1]);
```

**Expected output**

```text
1. Learn spread [x] js,react
2. Master map [x] 
3. Learn filter [ ] 
original length: 2
original[0] untouched: true
same object reused for unchanged task 2?  false
```

<!-- hints -->
- Add: `[...tasks, { id: Math.max(0, ...tasks.map(t => t.id)) + 1, title, done: false, tags: [] }]`.
- Toggle and rename: `tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)` copies only the task that changes.
- `addTag` must copy the inner array as well: `{ ...t, tags: [...t.tags, tag] }`. Spreading the task alone would still share its `tags` array with the original.
- Task 2 was renamed, so it's a new object: that's why the last line prints `false`.
<!-- solution -->
```js
const original = [
  { id: 1, title: "Learn spread", done: false, tags: ["js"] },
  { id: 2, title: "Learn map", done: true, tags: [] },
];

const addTask = (tasks, title) =>
  [...tasks, { id: Math.max(0, ...tasks.map(t => t.id)) + 1, title, done: false, tags: [] }];
const toggleTask = (tasks, id) => tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t));
const renameTask = (tasks, id, title) => tasks.map(t => (t.id === id ? { ...t, title } : t));
const addTag = (tasks, id, tag) => tasks.map(t => (t.id === id ? { ...t, tags: [...t.tags, tag] } : t));

let next = addTask(original, "Learn filter");
next = toggleTask(next, 1);
next = renameTask(next, 2, "Master map");
next = addTag(next, 1, "react");

for (const t of next) console.log(`${t.id}. ${t.title} [${t.done ? "x" : " "}] ${t.tags.join(",")}`);
console.log("original length:", original.length);
console.log("original[0] untouched:", original[0].done === false && original[0].tags.length === 1);
console.log("same object reused for unchanged task 2? ", next[1] === original[1]);
```

These are exactly the updates you write for React state (Module 16): `map` returns a new array, and only the changed task becomes a new object; unchanged tasks are reused, which keeps memoised components fast. The trap is nested data: `{ ...t }` is a **shallow** copy, so `t.tags.push(tag)` on it would also change the original task's tags. Copy every level you change, or use `structuredClone` when you really need a full deep copy.
