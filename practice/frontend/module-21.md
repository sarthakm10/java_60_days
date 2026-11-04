Performance work starts with seeing the problem. This page counts renders for you, so you can watch the waste disappear as you fix it.

<!-- exercise: f21_e1 | Medium | Stop the wasted renders -->
**Concepts:** what triggers a re-render · `React.memo` · `useCallback` · stable props · moving state down

**Task.** The page has a "Your name" input and a list of 300 products (each row does some slow work on purpose). Typing in the name box feels sluggish, because every keystroke re-renders the whole list, even though the list has nothing to do with the name. The page shows how many times `ProductList` rendered.

Fix it so that **typing a name doesn't re-render the list at all**, while clicking a product still selects it (and re-renders the list, which is correct). Then answer: what else could you have done instead of `memo`?

**Starter code** · `renders.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Renders</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    ul { height: 300px; overflow: auto; border: 1px solid #e2e8f0; padding: 0; list-style: none; }
    li { padding: 4px 8px; cursor: pointer; }
    li.selected { background: #dbeafe; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { memo, useCallback, useState } from "react";
    import { createRoot } from "react-dom/client";

    const PRODUCTS = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` }));
    window.listRenders = 0;

    function slow() { const end = performance.now() + 0.05; while (performance.now() < end) { /* busy */ } }

    function ProductList({ products, selectedId, onSelect }) {
      window.listRenders++;
      return (
        <ul>
          {products.map(p => {
            slow();
            return (
              <li key={p.id} className={p.id === selectedId ? "selected" : ""} onClick={() => onSelect(p.id)}>{p.name}</li>
            );
          })}
        </ul>
      );
    }

    function App() {
      const [name, setName] = useState("");
      const [selectedId, setSelectedId] = useState(null);
      const [renders, setRenders] = useState(0);

      return (
        <main>
          <label>Your name <input value={name} onChange={e => setName(e.target.value)} /></label>
          <p>Hello, {name || "stranger"}! Selected: {selectedId ?? "none"}</p>
          <button onClick={() => setRenders(window.listRenders)}>Show list render count</button>
          <span data-testid="renders"> ProductList rendered {renders} times</span>
          <ProductList products={PRODUCTS} selectedId={selectedId} onSelect={id => setSelectedId(id)} />
        </main>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
Before: type "Asha" → ProductList rendered 5 times (1 + 4 keystrokes)
After:  type "Asha" → ProductList rendered 1 time; click a product → 2
```

<!-- hints -->
- When `App`'s state changes, `App` re-renders and so do all its children. `memo(ProductList)` makes React skip it when its props are the same as last time (compared with `Object.is`).
- `memo` alone won't help yet: `onSelect={id => setSelectedId(id)}` creates a **new function** every render, so the props are never "the same". Wrap it in `useCallback(…, [])`, or pass `setSelectedId` directly (setter functions are always stable).
- `PRODUCTS` is defined outside the component, so it's already the same array every render.
- The other fix needs no memo at all: move the name input and its state into its own small component, so typing re-renders only that component.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Renders</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    ul { height: 300px; overflow: auto; border: 1px solid #e2e8f0; padding: 0; list-style: none; }
    li { padding: 4px 8px; cursor: pointer; }
    li.selected { background: #dbeafe; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { memo, useCallback, useState } from "react";
    import { createRoot } from "react-dom/client";

    const PRODUCTS = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` }));
    window.listRenders = 0;

    function slow() { const end = performance.now() + 0.05; while (performance.now() < end) { /* busy */ } }

    // memo: skip re-rendering when products, selectedId and onSelect are all the same as last time
    const ProductList = memo(function ProductList({ products, selectedId, onSelect }) {
      window.listRenders++;
      return (
        <ul>
          {products.map(p => {
            slow();
            return (
              <li key={p.id} className={p.id === selectedId ? "selected" : ""} onClick={() => onSelect(p.id)}>{p.name}</li>
            );
          })}
        </ul>
      );
    });

    function App() {
      const [name, setName] = useState("");
      const [selectedId, setSelectedId] = useState(null);
      const [renders, setRenders] = useState(0);

      // The same function on every render, so memo can see the props didn't change
      const handleSelect = useCallback(id => setSelectedId(id), []);

      return (
        <main>
          <label>Your name <input value={name} onChange={e => setName(e.target.value)} /></label>
          <p>Hello, {name || "stranger"}! Selected: {selectedId ?? "none"}</p>
          <button onClick={() => setRenders(window.listRenders)}>Show list render count</button>
          <span data-testid="renders"> ProductList rendered {renders} times</span>
          <ProductList products={PRODUCTS} selectedId={selectedId} onSelect={handleSelect} />
        </main>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

Two changes were needed together: `memo` so React compares the list's props, and `useCallback` so `onSelect` is the same function each time (an inline arrow is a new object on every render, which defeats `memo`, Module 21). Typing now re-renders `App` but skips `ProductList`; selecting a product changes `selectedId`, a real prop change, so the list correctly re-renders.

The alternative, often simpler: **move state down**. Put the input, its `name` state and the greeting in a `NameGreeting` component. Typing then re-renders only `NameGreeting`, and `ProductList` never re-renders for it, with no `memo` at all. Reach for memoisation when restructuring isn't practical, and confirm the win with the React DevTools Profiler.
