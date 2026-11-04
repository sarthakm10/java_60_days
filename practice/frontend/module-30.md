Two patterns that UI libraries are built on: compound components that share state through context, and a modal rendered through a portal with proper focus handling.

<!-- exercise: f30_e1 | Medium | A compound Accordion component -->
**Concepts:** compound components · context shared by related components · controlled open state · `aria-expanded` · `useId`

**Task.** Build an `Accordion` with this API:

```text
<Accordion allowMultiple={false}>
  <Accordion.Item id="what">
    <Accordion.Header>What is React?</Accordion.Header>
    <Accordion.Panel>A library for building user interfaces.</Accordion.Panel>
  </Accordion.Item>
  …
</Accordion>
```

- Clicking a header opens its panel; clicking it again closes it.
- With `allowMultiple={false}`, opening one item closes the others; with `allowMultiple`, several can be open.
- Each header is a `button` with `aria-expanded` and `aria-controls` pointing at its panel; each panel has `role="region"` and is labelled by its header.
- Using `Accordion.Header` outside an `Accordion.Item` throws a clear error.

The page renders one accordion of each kind.

**Starter code** · `accordion.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accordion</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; max-width: 520px; }
    .accordion { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; }
    .accordion button { display: block; width: 100%; text-align: left; padding: 12px; background: none; border: 0; border-top: 1px solid #e2e8f0; font-size: 16px; cursor: pointer; }
    .accordion [role="region"] { padding: 0 12px 12px; color: #334155; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { createContext, useContext, useId, useState } from "react";
    import { createRoot } from "react-dom/client";

    // TODO: Accordion (owns which ids are open), Item, Header, Panel, and the contexts they share

    function App() {
      return <p>TODO: render a single-open accordion and an allowMultiple one</p>;
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

**Sample output**

```text
Single: open "What is React?" then "What is JSX?" → only "What is JSX?" is open
Multiple: open both → both stay open; click one again → it closes
```

<!-- hints -->
- Two contexts keep it tidy: an `AccordionContext` with `{ isOpen(id), toggle(id) }` from `Accordion`, and an `ItemContext` with the item's `id` and generated element ids from `Item`.
- Keep the open ids in a `Set` in state. `toggle` builds a **new** Set: if `allowMultiple`, add or remove the id; otherwise the new set is either empty or just that id.
- `useId()` in `Item` gives unique ids for `aria-controls` and `aria-labelledby`.
- Attach the parts as properties: `Accordion.Item = Item;` and so on.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accordion</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; max-width: 520px; }
    .accordion { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; }
    .accordion button { display: block; width: 100%; text-align: left; padding: 12px; background: none; border: 0; border-top: 1px solid #e2e8f0; font-size: 16px; cursor: pointer; }
    .accordion [role="region"] { padding: 0 12px 12px; color: #334155; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { createContext, useContext, useId, useState } from "react";
    import { createRoot } from "react-dom/client";

    const AccordionContext = createContext(null);
    const ItemContext = createContext(null);

    function useRequired(context, name) {
      const value = useContext(context);
      if (!value) throw new Error(`${name} must be used inside its parent component`);
      return value;
    }

    function Accordion({ allowMultiple = false, children, label }) {
      const [open, setOpen] = useState(() => new Set());
      const toggle = (id) => setOpen(prev => {
        const next = new Set(allowMultiple ? prev : []);
        if (prev.has(id)) next.delete(id); else next.add(id);
        return next;
      });
      return (
        <AccordionContext.Provider value={{ isOpen: (id) => open.has(id), toggle }}>
          <div className="accordion" aria-label={label}>{children}</div>
        </AccordionContext.Provider>
      );
    }

    function Item({ id, children }) {
      const uid = useId();
      return (
        <ItemContext.Provider value={{ id, headerId: `${uid}-header`, panelId: `${uid}-panel` }}>
          <div>{children}</div>
        </ItemContext.Provider>
      );
    }

    function Header({ children }) {
      const { isOpen, toggle } = useRequired(AccordionContext, "Accordion.Header");
      const { id, headerId, panelId } = useRequired(ItemContext, "Accordion.Header");
      const open = isOpen(id);
      return (
        <button id={headerId} aria-expanded={open} aria-controls={panelId} onClick={() => toggle(id)}>
          {open ? "▾" : "▸"} {children}
        </button>
      );
    }

    function Panel({ children }) {
      const { isOpen } = useRequired(AccordionContext, "Accordion.Panel");
      const { id, headerId, panelId } = useRequired(ItemContext, "Accordion.Panel");
      return (
        <div id={panelId} role="region" aria-labelledby={headerId} hidden={!isOpen(id)}>
          {children}
        </div>
      );
    }

    Accordion.Item = Item;
    Accordion.Header = Header;
    Accordion.Panel = Panel;

    const FAQ = [
      ["what", "What is React?", "A library for building user interfaces from components."],
      ["jsx", "What is JSX?", "HTML-like syntax that compiles to JavaScript function calls."],
      ["hooks", "What are hooks?", "Functions like useState that give components state and other features."],
    ];

    function App() {
      return (
        <>
          <h2>One at a time</h2>
          <Accordion label="Single">
            {FAQ.map(([id, q, a]) => (
              <Accordion.Item key={id} id={id}>
                <Accordion.Header>{q}</Accordion.Header>
                <Accordion.Panel>{a}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
          <h2>Several open</h2>
          <Accordion allowMultiple label="Multiple">
            {FAQ.map(([id, q, a]) => (
              <Accordion.Item key={id} id={id}>
                <Accordion.Header>{q}</Accordion.Header>
                <Accordion.Panel>{a}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

`Accordion` owns **which** items are open; `Item` provides **who** each part belongs to; `Header` and `Panel` read both contexts, so the user of the component just arranges the parts. The open ids live in a `Set`, replaced (not mutated) on every toggle so React sees the change. Panels use the `hidden` attribute, which keeps them in the page (and findable by `aria-controls`) but out of view and out of the accessibility tree until opened.

<!-- exercise: f30_e2 | Medium | A modal through a portal, with focus handling -->
**Concepts:** `createPortal` · events bubbling through the React tree · focusing on open · Escape to close · restoring focus

**Task.** The page has a card with `overflow: hidden` and a "Delete task" button inside it. Build a `ConfirmModal` that:

1. Renders through a **portal** into `document.body` (so the card's `overflow: hidden` can't clip it).
2. When it opens, moves focus to the **Cancel** button; Escape or Cancel closes it; Delete calls `onConfirm` and closes it.
3. Clicking the dark backdrop closes it, but clicking inside the dialog doesn't.
4. When it closes, focus goes back to the button that opened it.

The page logs clicks in `window.eventLog`: after clicking the backdrop it shows `"backdrop"` and then `"card onClick"`, a click in the portal reaching the card's React handler although, in the DOM, the backdrop isn't inside the card.

**Starter code** · `modal.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modal</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom": "https://esm.sh/react-dom@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    .card { width: 260px; height: 90px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .backdrop { position: fixed; inset: 0; background: rgb(15 23 42 / 0.5); display: grid; place-items: center; }
    .dialog { background: #fff; border-radius: 12px; padding: 20px; width: 320px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useRef, useState } from "react";
    import { createPortal } from "react-dom";
    import { createRoot } from "react-dom/client";

    window.eventLog = [];

    function ConfirmModal({ open, title, onConfirm, onClose }) {
      // TODO: portal into document.body, focus Cancel on open, Escape closes, backdrop click closes
      return null;
    }

    function App() {
      const [open, setOpen] = useState(false);
      const [deleted, setDeleted] = useState(false);
      return (
        <div className="card" onClick={() => window.eventLog.push("card onClick")}>
          <strong>{deleted ? "Task deleted" : "Write the README"}</strong>
          <p><button disabled={deleted} onClick={() => setOpen(true)}>Delete task</button></p>
          <ConfirmModal open={open} title="Delete this task?" onConfirm={() => setDeleted(true)} onClose={() => setOpen(false)} />
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
Click "Delete task" → the dialog covers the page (not clipped by the card), Cancel is focused
Escape → closed, focus is back on "Delete task"; open again → Delete → "Task deleted"
```

<!-- hints -->
- `return open ? createPortal(<div className="backdrop">…</div>, document.body) : null;`
- Remember the opener in an effect that runs when `open` becomes true: `const opener = document.activeElement;`, then `cancelRef.current.focus()`. In that effect's cleanup (it runs when `open` turns false), call `opener?.focus()`.
- Listen for Escape in the same effect: `document.addEventListener("keydown", …)`, removed in the cleanup.
- Backdrop: `onClick={onClose}` on the backdrop, and `onClick={e => e.stopPropagation()}` on the dialog so clicks inside it don't reach the backdrop. A backdrop click still bubbles on through the **React** tree to the card's `onClick`, even though the portal's DOM is under `body`.
<!-- solution -->
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modal</title>
  <script type="importmap">
    { "imports": { "react": "https://esm.sh/react@19.1.0", "react-dom": "https://esm.sh/react-dom@19.1.0", "react-dom/client": "https://esm.sh/react-dom@19.1.0/client" } }
  </script>
  <script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; }
    .card { width: 260px; height: 90px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .backdrop { position: fixed; inset: 0; background: rgb(15 23 42 / 0.5); display: grid; place-items: center; }
    .dialog { background: #fff; border-radius: 12px; padding: 20px; width: 320px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="react">
    import React, { useEffect, useRef, useState } from "react";
    import { createPortal } from "react-dom";
    import { createRoot } from "react-dom/client";

    window.eventLog = [];

    function ConfirmModal({ open, title, onConfirm, onClose }) {
      const cancelRef = useRef(null);

      useEffect(() => {
        if (!open) return;
        const opener = document.activeElement;             // to give focus back on close
        cancelRef.current?.focus();
        function onKey(e) { if (e.key === "Escape") onClose(); }
        document.addEventListener("keydown", onKey);
        return () => {
          document.removeEventListener("keydown", onKey);
          opener?.focus?.();
        };
      }, [open, onClose]);

      if (!open) return null;
      return createPortal(
        <div className="backdrop" onClick={() => { window.eventLog.push("backdrop"); onClose(); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"
               onClick={e => { window.eventLog.push("dialog"); e.stopPropagation(); }}>
            <h2 id="confirm-title">{title}</h2>
            <p>This can't be undone.</p>
            <button ref={cancelRef} onClick={onClose}>Cancel</button>{" "}
            <button onClick={() => { onConfirm(); onClose(); }}>Delete</button>
          </div>
        </div>,
        document.body
      );
    }

    function App() {
      const [open, setOpen] = useState(false);
      const [deleted, setDeleted] = useState(false);
      return (
        <div className="card" onClick={() => window.eventLog.push("card onClick")}>
          <strong>{deleted ? "Task deleted" : "Write the README"}</strong>
          <p><button disabled={deleted} onClick={() => setOpen(true)}>Delete task</button></p>
          <ConfirmModal open={open} title="Delete this task?" onConfirm={() => setDeleted(true)} onClose={() => setOpen(false)} />
        </div>
      );
    }

    createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
```

In the DOM, the dialog sits at the end of `body`, outside the card, so the card's `overflow: hidden` can't clip it. In the **React** tree it's still a child of the card, which is why a backdrop click reaches the card's `onClick` (`window.eventLog` shows `"backdrop"`, then `"card onClick"`; a click inside the dialog stops there because of `stopPropagation`) and why it can use the card's context and state. One effect handles the whole open lifetime: remember the opener, focus Cancel, listen for Escape, and on close (the cleanup) remove the listener and restore focus. A full focus trap (keeping Tab inside the dialog) is the next step; the native `dialog` element with `showModal()` gives you that for free.
