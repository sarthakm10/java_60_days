State is what makes a page interactive. Both exercises are single HTML pages with React from a CDN: save, open with Live Server, and click around. Watch the rule that matters most: replace state, never mutate it.

<!-- exercise: f16_e1 | Easy | Counter with a step and undo -->
**Concepts:** `useState` · event handlers · functional updates · derived values · disabling buttons

**Task.** Build a counter with:

1. **−** and **+** buttons that change the count by the current **step**, chosen from a select (1, 5 or 10).
2. A **+3 clicks** button that adds the step three times by calling the setter three times in a row (it must really add 3 × step).
3. **Undo**, which goes back one change at a time, and **Reset**, which goes back to 0 and clears the history. Undo is disabled when there's nothing to undo.
4. The text "even" or "odd" next to the count, computed, not stored in state.

**Starter code** · `counter.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Counter</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .count { font-size: 48px; font-weight: 800; margin: 12px 0; }
    button, select { font-size: 16px; margin-right: 6px; padding: 6px 12px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";

    function Counter() {
      // TODO: state for the count, the step and the history of previous counts
      return (
        <div>
          <div className="count" data-testid="count">0 <small>(even)</small></div>
          <label>Step <select>{[1, 5, 10].map(s => <option key={s} value={s}>{s}</option>)}</select></label>
          <p>
            <button>−</button>
            <button>+</button>
            <button>+3 clicks</button>
            <button>Undo</button>
            <button>Reset</button>
          </p>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<Counter />);
  </script>
</body>
</html>
```

**Sample output**

```text
Step 5, click + twice → 10 (even); click "+3 clicks" → 25 (odd); Undo → 10; Undo → 5; Reset → 0, Undo disabled
```

<!-- hints -->
- A select gives a string: `onChange={e => setStep(Number(e.target.value))}`.
- For "+3 clicks", `setCount(count + step)` three times only adds once (all three read the same `count`). Use the function form: `setCount(c => c + step)`.
- Keep the history as an array of previous counts. Every change pushes the old count onto a **new** array: `setHistory(h => [...h, count])`. Undo restores the last item and removes it with `slice(0, -1)`.
- `const parity = count % 2 === 0 ? "even" : "odd"` is computed during render: no state needed.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Counter</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; }
    .count { font-size: 48px; font-weight: 800; margin: 12px 0; }
    button, select { font-size: 16px; margin-right: 6px; padding: 6px 12px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";

    function Counter() {
      const [count, setCount] = useState(0);
      const [step, setStep] = useState(1);
      const [history, setHistory] = useState([]);

      const parity = count % 2 === 0 ? "even" : "odd";     // derived, not state

      function change(delta) {
        setHistory(h => [...h, count]);
        setCount(c => c + delta);
      }

      function addThreeTimes() {
        setHistory(h => [...h, count]);
        setCount(c => c + step);                             // the function form sees the latest value
        setCount(c => c + step);
        setCount(c => c + step);
      }

      function undo() {
        setCount(history[history.length - 1]);
        setHistory(h => h.slice(0, -1));
      }

      function reset() {
        setCount(0);
        setHistory([]);
      }

      return (
        <div>
          <div className="count" data-testid="count">{count} <small>({parity})</small></div>
          <label>Step <select value={step} onChange={e => setStep(Number(e.target.value))}>
            {[1, 5, 10].map(s => <option key={s} value={s}>{s}</option>)}
          </select></label>
          <p>
            <button onClick={() => change(-step)}>−</button>
            <button onClick={() => change(step)}>+</button>
            <button onClick={addThreeTimes}>+3 clicks</button>
            <button onClick={undo} disabled={history.length === 0}>Undo</button>
            <button onClick={reset}>Reset</button>
          </p>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<Counter />);
  </script>
</body>
</html>
```

Try changing `addThreeTimes` to `setCount(count + step)` three times: it only adds one step, because all three calls read the same `count` from this render. The function form receives the result of the previous queued update. The history is replaced with a new array on every change (`[...h, count]`, `slice`), never `push`ed, so React always sees a new reference.

<!-- exercise: f16_e2 | Medium | A shopping cart with lifted state -->
**Concepts:** lifting state up · passing callbacks down · immutable array and object updates · derived totals

**Task.** The page has a `ProductList` and a `Cart`, side by side. Make them work together:

1. "Add to cart" on a product adds it with quantity 1, or increases its quantity if it's already there.
2. In the cart, **−** and **+** change the quantity; going below 1 removes the line. **Remove** removes it.
3. The cart shows each line's total, the item count and the grand total. Orders of ₹1,000 or more get 10% off, shown as its own line.
4. A product already in the cart shows "In cart (2)" on its button.

The cart's state must live in `App` (the common parent) and be updated without mutation.

**Starter code** · `cart.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cart</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 820px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    button { margin-left: 4px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";

    const PRODUCTS = [
      { id: 1, name: "Notebook", price: 120 },
      { id: 2, name: "Headphones", price: 1499 },
      { id: 3, name: "Pen pack", price: 90 },
    ];
    const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

    function ProductList() {
      return <p>TODO: products with "Add to cart"</p>;
    }

    function Cart() {
      return <p>TODO: cart lines, totals, discount</p>;
    }

    function App() {
      // TODO: the cart state lives here: [{ id, name, price, qty }]
      return (
        <div className="layout">
          <section><h2>Products</h2><ProductList /></section>
          <section><h2>Cart</h2><Cart /></section>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
Add Headphones, Notebook, Notebook →
  Headphones   1 × ₹1,499 = ₹1,499
  Notebook     2 × ₹120   = ₹240
  3 items · Subtotal ₹1,739 · Discount −₹174 · Total ₹1,565
```

<!-- hints -->
- In `App`: `const [cart, setCart] = useState([])`, and functions `add(product)`, `changeQty(id, delta)`, `remove(id)`. Pass the data and the functions down as props.
- `add`: if the product is in the cart, `map` it to `{ ...line, qty: line.qty + 1 }`; otherwise `[...cart, { ...product, qty: 1 }]`.
- `changeQty`: `map` to the new qty, then `filter(line => line.qty > 0)` to drop empty lines, all in one updater function.
- Everything else (counts, subtotal, discount, total) is computed from `cart` during render. Round the discount with `Math.round`.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cart</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 820px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    button { margin-left: 4px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useState } from "react";
    import { createRoot } from "react-dom/client";

    const PRODUCTS = [
      { id: 1, name: "Notebook", price: 120 },
      { id: 2, name: "Headphones", price: 1499 },
      { id: 3, name: "Pen pack", price: 90 },
    ];
    const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

    function ProductList({ cart, onAdd }) {
      return PRODUCTS.map(p => {
        const inCart = cart.find(line => line.id === p.id);
        return (
          <div className="row" key={p.id}>
            <span>{p.name} · {rupees(p.price)}</span>
            <button onClick={() => onAdd(p)}>{inCart ? `In cart (${inCart.qty})` : "Add to cart"}</button>
          </div>
        );
      });
    }

    function Cart({ cart, onChangeQty, onRemove }) {
      if (cart.length === 0) return <p>Your cart is empty.</p>;
      const items = cart.reduce((n, line) => n + line.qty, 0);
      const subtotal = cart.reduce((sum, line) => sum + line.qty * line.price, 0);
      const discount = subtotal >= 1000 ? Math.round(subtotal * 0.1) : 0;
      return (
        <>
          {cart.map(line => (
            <div className="row" key={line.id}>
              <span>{line.name} · {line.qty} × {rupees(line.price)} = {rupees(line.qty * line.price)}</span>
              <span>
                <button onClick={() => onChangeQty(line.id, -1)} aria-label={`One less ${line.name}`}>−</button>
                <button onClick={() => onChangeQty(line.id, 1)} aria-label={`One more ${line.name}`}>+</button>
                <button onClick={() => onRemove(line.id)}>Remove</button>
              </span>
            </div>
          ))}
          <p>{items} item{items === 1 ? "" : "s"} · Subtotal {rupees(subtotal)}</p>
          {discount > 0 && <p>Discount (10% over ₹1,000): −{rupees(discount)}</p>}
          <p><strong data-testid="total">Total {rupees(subtotal - discount)}</strong></p>
        </>
      );
    }

    function App() {
      const [cart, setCart] = useState([]);

      function add(product) {
        setCart(lines => lines.some(l => l.id === product.id)
          ? lines.map(l => (l.id === product.id ? { ...l, qty: l.qty + 1 } : l))
          : [...lines, { ...product, qty: 1 }]);
      }

      function changeQty(id, delta) {
        setCart(lines => lines
          .map(l => (l.id === id ? { ...l, qty: l.qty + delta } : l))
          .filter(l => l.qty > 0));
      }

      function remove(id) {
        setCart(lines => lines.filter(l => l.id !== id));
      }

      return (
        <div className="layout">
          <section><h2>Products</h2><ProductList cart={cart} onAdd={add} /></section>
          <section><h2>Cart</h2><Cart cart={cart} onChangeQty={changeQty} onRemove={remove} /></section>
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

Both panels need the cart, so it lives in their common parent and flows down as props; changes flow back up through `onAdd`, `onChangeQty` and `onRemove` (one-way data flow, Module 16). Only `cart` is state: the item count, subtotal, discount, total and the "In cart (2)" labels are all derived from it, so they can never disagree. Every update returns a new array, and only the changed line becomes a new object.
