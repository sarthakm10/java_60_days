`this` and classes work differently from Java, and the differences cause real bugs. The first exercise is a bug hunt; the second builds a class hierarchy the JavaScript way.

<!-- exercise: f8_e1 | Medium | Fix the lost this -->
**Concepts:** how `this` is decided · methods passed as callbacks · `bind` · arrow functions · `call`

**Task.** The starter has three bugs, all caused by `this`. Run it first and read the errors. Fix each one **without changing the `scoreboard` object's method bodies**: change only the marked lines (the calls). Then print the final summary.

**Starter code** · `this-bugs.mjs`

```js
const scoreboard = {
  team: "Frontend Ninjas",
  points: 0,
  add(n) {
    this.points += n;
  },
  summary(prefix) {
    return `${prefix}: ${this.team} has ${this.points} points`;
  },
};

const results = [3, 5, 2];

try {
  results.forEach(scoreboard.add);                       // BUG 1: fix this line
} catch (e) { console.log("Bug 1:", e.message); }

let later;
try {
  const report = scoreboard.summary;                     // BUG 2: fix this line
  later = () => report("Final");
  console.log(later());
} catch (e) { console.log("Bug 2:", e.message); }

const other = { team: "Backend Wizards", points: 7 };
// BUG 3: print the summary of `other` using scoreboard.summary (other has no summary method)
console.log("Bug 3: ?");
```

**Expected output**

```text
Final: Frontend Ninjas has 10 points
Other: Backend Wizards has 7 points
```

<!-- hints -->
- `results.forEach(scoreboard.add)` passes the method as a plain function, so `this` is `undefined` inside it (modules are strict). Wrap it: `results.forEach(n => scoreboard.add(n))`, or pass `scoreboard.add.bind(scoreboard)`.
- `const report = scoreboard.summary` also loses the object. `bind` creates a copy of the function with `this` fixed.
- To run a method with a different object as `this`, use `call`: `scoreboard.summary.call(other, "Other")`.
<!-- solution -->
```js
const scoreboard = {
  team: "Frontend Ninjas",
  points: 0,
  add(n) {
    this.points += n;
  },
  summary(prefix) {
    return `${prefix}: ${this.team} has ${this.points} points`;
  },
};

const results = [3, 5, 2];

try {
  results.forEach(n => scoreboard.add(n));               // called as a method: this = scoreboard
} catch (e) { console.log("Bug 1:", e.message); }

let later;
try {
  const report = scoreboard.summary.bind(scoreboard);    // this fixed to scoreboard
  later = () => report("Final");
  console.log(later());
} catch (e) { console.log("Bug 2:", e.message); }

const other = { team: "Backend Wizards", points: 7 };
console.log(scoreboard.summary.call(other, "Other"));   // borrow the method, this = other
```

All three bugs are the same rule: a regular function's `this` is decided **by how it's called**. `obj.method()` sets it to `obj`; a bare `fn()` leaves it `undefined` in strict mode (and ES modules are always strict). An arrow callback calls the method properly, `bind` returns a version with `this` locked in, and `call` runs a function once with any `this` you choose.

<!-- exercise: f8_e2 | Medium | Accounts with classes and private fields -->
**Concepts:** `class` · `#private` fields · getters · `static` · `extends` and `super` · overriding `toString`

**Task.** Complete the two classes:

- `Account`: a private `#balance`; a read-only `balance` getter; `deposit(amount)` and `withdraw(amount)` that throw an `Error` for amounts of 0 or less, and `withdraw` also throws `"Insufficient funds"` if the balance is too low. Both return `this`, so calls can be chained. A `static count` tracks how many accounts were created. `toString()` returns `"owner: ₹balance"`.
- `SavingsAccount extends Account`: adds a `rate`, and `addInterest()` deposits `balance × rate` (rounded to whole rupees).

**Starter code** · `accounts.mjs`

```js
class Account {
  // TODO: private #balance, static count

  constructor(owner) {
    this.owner = owner;
  }

  // TODO: get balance(), deposit(amount), withdraw(amount), toString()
}

class SavingsAccount extends Account {
  // TODO: constructor(owner, rate), addInterest()
}

const a = new Account("Asha").deposit(1000).withdraw(300);
console.log(String(a));

const s = new SavingsAccount("Ben", 0.05);
s.deposit(2000).addInterest();
console.log(String(s));

for (const action of [() => a.withdraw(5000), () => s.deposit(-10)]) {
  try { action(); } catch (e) { console.log("Error:", e.message); }
}

try { a.balance = 1_000_000; } catch { /* a getter with no setter: assigning throws in strict mode */ }
console.log("Still", a.balance);
console.log("Accounts created:", Account.count);
console.log(s instanceof Account, Object.keys(a));
```

**Expected output**

```text
Asha: ₹700
Ben: ₹2100
Error: Insufficient funds
Error: Amount must be positive
Still 700
Accounts created: 2
true [ 'owner' ]
```

<!-- hints -->
- Declare `#balance = 0;` and `static count = 0;` at the top of the class body, and do `Account.count++` in the constructor.
- `get balance() { return this.#balance; }` makes `a.balance` readable but not writable: the starter's attempt to assign it throws (modules are strict), which is why it's wrapped in `try`.
- In `SavingsAccount`, call `super(owner)` first, then set `this.rate`. `addInterest` can call `this.deposit(...)` and must `return this`.
- `Object.keys` lists only own, public, enumerable properties, so `#balance` never shows up.
<!-- solution -->
```js
class Account {
  #balance = 0;
  static count = 0;

  constructor(owner) {
    this.owner = owner;
    Account.count++;
  }

  get balance() {
    return this.#balance;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.#balance += amount;
    return this;
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (amount > this.#balance) throw new Error("Insufficient funds");
    this.#balance -= amount;
    return this;
  }

  toString() {
    return `${this.owner}: ₹${this.#balance}`;
  }
}

class SavingsAccount extends Account {
  constructor(owner, rate) {
    super(owner);
    this.rate = rate;
  }

  addInterest() {
    return this.deposit(Math.round(this.balance * this.rate));
  }
}

const a = new Account("Asha").deposit(1000).withdraw(300);
console.log(String(a));

const s = new SavingsAccount("Ben", 0.05);
s.deposit(2000).addInterest();
console.log(String(s));

for (const action of [() => a.withdraw(5000), () => s.deposit(-10)]) {
  try { action(); } catch (e) { console.log("Error:", e.message); }
}

try { a.balance = 1_000_000; } catch { /* no setter: assignment throws in strict mode */ }
console.log("Still", a.balance);
console.log("Accounts created:", Account.count);
console.log(s instanceof Account, Object.keys(a));
```

`#balance` is enforced by the language: code outside the class can't read or write it at all, unlike Java's `private`, which reflection can bypass, or the old `_balance` naming convention. A getter without a setter makes `balance` read-only. In strict mode (every ES module) assigning to it throws a `TypeError`, which is why the solution wraps that line. The subclass uses the public `balance` getter and `deposit`, never the parent's private field: private fields aren't visible to subclasses either.
