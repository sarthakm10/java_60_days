# Frontend 5 — JavaScript Basics

> **You already know how to program.** Variables, conditions, loops and functions all carry over from Java. This module is about what's *different* in JavaScript: dynamic types, two kinds of equality, truthy values and a few famous surprises.

<!-- subtopic: f5_s1 -->
### What JavaScript is, and how it differs from Java

JavaScript is the only language browsers run natively. Since Node.js (2009) it also runs on servers and in build tools, so frontend tooling (npm, Vite, ESLint) is JavaScript too. Despite the name, it has almost nothing to do with Java.

| | Java | JavaScript |
|---|---|---|
| Types | static: checked at compile time (`int x`) | dynamic: a variable can hold anything (`let x`) |
| Runs | compiled to bytecode, runs on the JVM | interpreted and JIT-compiled by the browser's engine (V8 in Chrome) |
| Structure | everything inside classes | functions and objects are enough; classes are optional |
| Functions | methods belong to classes | functions are values: store them, pass them, return them |
| Threads | many threads | one main thread plus an event loop (Module 10) |
| Semicolons | required | optional (inserted automatically), but most style guides keep them |

Three ways to run JavaScript right now:

1. **The browser console**: F12 → Console, type `2 + 2`, press Enter.
2. **A script in a page**: `<script src="app.js"></script>` (Module 1).
3. **Node.js**: save `hello.js` and run `node hello.js` in a terminal.

```js
console.log("Hello from JavaScript");   // System.out.println's cousin
console.log("Sum:", 2 + 3);             // several values, separated by spaces
console.table([{ day: 1, done: true }, { day: 2, done: false }]);   // pretty tables in DevTools
```

<details>
<summary>Is JavaScript compiled or interpreted?</summary>

Both, in practice. Modern engines like V8 parse the code, start running it with an interpreter, and compile the hot parts to machine code just in time (JIT). There's no separate compile step you run yourself, unlike `javac`.
</details>

<!-- subtopic: f5_s2 -->
### Variables: let, const and var

```js
const name = "Asha";      // can't be reassigned
let score = 0;            // can be reassigned
score = score + 10;

name = "Ben";             // TypeError: Assignment to constant variable.
```

**Use `const` by default, `let` when the value must change, and never `var`.**

`const` stops you from reassigning the *variable*, not from changing the object it points to (just like `final` in Java):

```js
const user = { name: "Asha" };
user.name = "Ben";        // fine: the object changed, the variable still points to it
user = {};                // TypeError: the variable can't point somewhere else
```

Why not `var`? It's function-scoped instead of block-scoped and gets hoisted (Module 6), which causes bugs:

```js
if (true) { var leaky = 1; let safe = 2; }
console.log(leaky);       // 1: var ignores the block
console.log(safe);        // ReferenceError: safe is not defined
```

**Template literals** use backticks and `${}` for values, and can span lines:

```js
const day = 5;
console.log(`Day ${day} of ${100}: ${day * 2}% done`);
```

Naming follows camelCase like Java (`totalScore`), with `UPPER_SNAKE_CASE` for true constants (`MAX_RETRIES`).

<details>
<summary>const items = []; items.push(1); Is this an error?</summary>

No. `const` only stops reassigning `items` to a new value. Pushing changes the array the variable points to, which is allowed.
</details>

<!-- subtopic: f5_s3 -->
### Types

JavaScript has **7 primitive types** and **objects**:

| Type | Examples | Note |
|---|---|---|
| `number` | `42`, `3.14`, `-0`, `NaN`, `Infinity` | one type for integers and decimals (64-bit floating point) |
| `bigint` | `9007199254740993n` | whole numbers beyond `Number.MAX_SAFE_INTEGER` |
| `string` | `"hi"`, `'hi'`, `` `hi ${x}` `` | immutable, like in Java |
| `boolean` | `true`, `false` | |
| `undefined` | `undefined` | "no value assigned yet": a declared but empty variable |
| `null` | `null` | "intentionally empty": you set it on purpose |
| `symbol` | `Symbol("id")` | unique keys (Module 12) |
| `object` | `{}`, `[]`, functions, dates, maps | everything that isn't a primitive |

`typeof` tells you the type at runtime:

```js
typeof 42            // "number"
typeof "hi"          // "string"
typeof undefined     // "undefined"
typeof {}            // "object"
typeof []            // "object"   (use Array.isArray([]) to check for arrays)
typeof null          // "object"   (a famous bug from 1995, kept for compatibility)
typeof function(){}  // "function"
```

Variables don't have types; **values** do:

```js
let x = 5;      // number
x = "five";     // now a string: allowed in JavaScript, a compile error in Java
```

That flexibility is exactly why TypeScript (Modules 13–14) exists.

Primitives are copied **by value**; objects are shared **by reference**, the same as Java's primitives and objects:

```js
let a = 1, b = a; b++;            // a is still 1
const p = { n: 1 }, q = p; q.n++; // p.n is now 2: same object
```

<details>
<summary>undefined vs null?</summary>

`undefined` means a value was never assigned (an unset variable, a missing property, a function with no return). `null` is a value you assign on purpose to mean "nothing here". Both are falsy, and `null == undefined` is true, but `null === undefined` is false.
</details>

<!-- subtopic: f5_s4 -->
### Operators, == vs ===, truthy and falsy

Arithmetic and comparison operators work as in Java, with a few twists:

```js
7 / 2          // 3.5: no integer division (use Math.floor(7 / 2) for 3)
7 % 2          // 1
2 ** 10        // 1024: exponent
"5" + 1        // "51": + with a string joins text
"5" - 1        // 4: - converts the string to a number
```

**Always use `===` and `!==`** (strict equality: same type and same value). The loose `==` converts types first, with confusing rules:

```js
0 == ""          // true   😬
"1" == 1         // true
null == undefined // true
0 === ""         // false  ✅
"1" === 1        // false
```

The one accepted use of `==` is `x == null`, which checks for both `null` and `undefined` at once.

**Truthy and falsy:** in an `if`, any value is converted to a boolean. Exactly these are **falsy**:

`false`, `0`, `-0`, `0n`, `""` (empty string), `null`, `undefined`, `NaN`

Everything else is **truthy**, including `"0"`, `"false"`, `[]` and `{}`.

```js
const name = "";
if (name) { console.log("has a name"); }       // doesn't run: "" is falsy
if ([]) { console.log("empty array is truthy"); }   // runs!
```

Logical operators return one of their operands, not just `true`/`false`:

```js
const title = userTitle || "Untitled";   // first truthy value: fallback when userTitle is falsy
const city = user && user.address;       // stops at the first falsy value
```

Careful: the `||` fallback also replaces `0` and `""`. Module 7's `??` only replaces `null` and `undefined`.

<details>
<summary>Is the empty array [] truthy or falsy? How do you check whether an array is empty?</summary>

Truthy: every object is truthy, even an empty one. Check emptiness with `arr.length === 0`.
</details>

<!-- subtopic: f5_s5 -->
### Control flow

`if`, `else`, `switch`, `while`, `do…while`, `for`, `break` and `continue` look exactly like Java:

```js
for (let i = 0; i < 3; i++) {
  if (i === 1) continue;
  console.log(i);          // 0, 2
}

switch (role) {
  case "admin": showAdmin(); break;
  case "user":  showUser();  break;
  default:      showGuest();
}
```

(JavaScript's `switch` compares with `===`.)

Two loops are new. Remember them by their last letters: **for…of** for values, **for…in** for keys.

```js
const days = ["Mon", "Tue", "Wed"];

for (const day of days) console.log(day);      // Mon, Tue, Wed   (values: use this for arrays)
for (const i in days) console.log(i);          // "0", "1", "2"   (keys, as strings)

const scores = { asha: 90, ben: 75 };
for (const name in scores) console.log(name, scores[name]);   // keys of an object
```

Don't use `for…in` on arrays: it gives string indexes and also walks inherited properties. For arrays, use `for…of` or the array methods in Module 7 (`forEach`, `map`, `filter`).

<details>
<summary>for...of or for...in to loop over an array's values?</summary>

`for...of`. `for...in` gives the keys (indexes as strings) and is meant for objects.
</details>

<!-- subtopic: f5_s6 -->
### Strings and numbers

Strings have the methods you'd expect; they never change the original string:

```js
const s = "  Learn React  ";
s.trim()                    // "Learn React"
s.toUpperCase()             // "  LEARN REACT  "
s.includes("React")         // true
s.startsWith("  Le")        // true
"a,b,c".split(",")          // ["a", "b", "c"]
"hello".slice(1, 3)         // "el"
"ha".repeat(3)              // "hahaha"
"Day 7".replace("7", "8")   // "Day 8"
"x".padStart(3, "0")        // "00x"
s.length                    // 15 (a property, not a method)
```

Numbers:

```js
Number("42")          // 42
Number("42px")        // NaN
parseInt("42px", 10)  // 42 (reads digits until it can't)
parseFloat("3.5kg")   // 3.5
(3.14159).toFixed(2)  // "3.14" (a string)
Math.round(2.5)       // 3       Math.max(1, 5, 3) // 5
Math.floor(Math.random() * 6) + 1   // a dice roll, 1 to 6
```

**NaN** ("not a number") is the result of failed maths, and it's not equal to anything, not even itself:

```js
NaN === NaN           // false
Number.isNaN(Number("abc"))   // true: the right way to check
```

**The 0.1 + 0.2 surprise:**

```js
0.1 + 0.2             // 0.30000000000000004
0.1 + 0.2 === 0.3     // false
```

It's not a JavaScript bug: every language using IEEE 754 floating point (Java's `double` too) does this, because 0.1 can't be stored exactly in binary. For money, work in whole cents (`1999` instead of `19.99`), or format with `toFixed` only when displaying.

<details>
<summary>Why does 0.1 + 0.2 not equal 0.3, and how do you handle money?</summary>

Numbers are binary floating point, and 0.1 and 0.2 have no exact binary form, so tiny rounding errors appear. Store money as integers in the smallest unit (cents or paise) and only format it for display, or compare with a small tolerance such as `Math.abs(a - b) < Number.EPSILON`.
</details>

## 📝 Module 5 Recap

1. Where does JavaScript run? → **in browsers, and on servers and tools through Node.js**
2. let, const or var? → **const by default, let when reassigning, never var**
3. Does const make an object unchangeable? → **no, only the variable can't be reassigned**
4. How many primitive types? → **7: number, bigint, string, boolean, undefined, null, symbol**
5. typeof null? → **"object", a historical bug**
6. == or ===? → **=== (strict, no type conversion)**
7. The falsy values? → **false, 0, -0, 0n, "", null, undefined, NaN**
8. Is "0" truthy? → **yes, every non-empty string is truthy**
9. for...of vs for...in? → **of: values of arrays; in: keys of objects**
10. How do you check for NaN? → **Number.isNaN(x), because NaN !== NaN**
11. "5" + 1 vs "5" - 1? → **"51" and 4**
