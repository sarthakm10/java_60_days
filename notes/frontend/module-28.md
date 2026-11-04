# Frontend 28 — Frontend Interview Questions

> **The final module: rapid-fire questions from every part of the course, with short answers you can say in an interview.** Drill them with the 🃏 flashcards in Revise (every question here becomes a card), and use the last section to prepare your project story. Each answer links back to the module that explains it.

<!-- subtopic: f28_s1 -->
### HTML and CSS rapid-fire

<details>
<summary>What is semantic HTML and why does it matter?</summary>

Using elements for their meaning (`header`, `nav`, `main`, `article`, `button`) rather than generic `div`s. It helps screen readers navigate, search engines understand the page, and developers read the code. (Module 2)
</details>

<details>
<summary>What are the parts of the CSS box model, and what does box-sizing: border-box change?</summary>

Content, padding, border and margin. With border-box, the width and height include padding and border, so a 300px box stays 300px wide. (Module 3)
</details>

<details>
<summary>How is CSS specificity calculated?</summary>

As (ids, classes/attributes/pseudo-classes, elements/pseudo-elements), compared left to right; inline styles beat selectors and !important beats normal declarations. Equal specificity: the later rule wins. (Module 3)
</details>

<details>
<summary>Difference between position relative, absolute, fixed and sticky?</summary>

Relative offsets from its normal spot and keeps its space; absolute is placed relative to the nearest positioned ancestor and leaves the flow; fixed is relative to the viewport; sticky scrolls normally until a threshold, then sticks. (Module 3)
</details>

<details>
<summary>Flexbox vs Grid?</summary>

Flexbox lays out items in one dimension and sizes them from their content: navbars, toolbars, centring. Grid lays out rows and columns together from the container: page layouts and card grids. They're often combined. (Module 4)
</details>

<details>
<summary>How do you centre a div horizontally and vertically?</summary>

On the parent: `display: flex; justify-content: center; align-items: center;` (or `display: grid; place-items: center;`). (Module 4)
</details>

<details>
<summary>What does mobile-first mean in CSS?</summary>

Base styles target small screens, and min-width media queries add layout for larger ones. (Module 4)
</details>

<details>
<summary>em vs rem?</summary>

em is relative to the element's own font size (it compounds when nested); rem is relative to the root font size, so it's predictable and respects the user's browser setting. (Module 3)
</details>

<!-- subtopic: f28_s2 -->
### JavaScript rapid-fire

<details>
<summary>let, const and var?</summary>

let and const are block-scoped and in the temporal dead zone before their line; const can't be reassigned. var is function-scoped, hoisted as undefined, and ignores blocks. Use const by default. (Modules 5, 6)
</details>

<details>
<summary>== vs ===?</summary>

=== compares type and value with no conversion; == converts types first, with surprising results. Always use === (except `x == null` to check null or undefined). (Modules 5, 12)
</details>

<details>
<summary>What is a closure? Give a use.</summary>

A function that remembers variables from the scope where it was created, even after that scope finished. Uses: private state, event handlers, debounce/throttle, memoisation, React hooks. (Module 6)
</details>

<details>
<summary>What is hoisting?</summary>

Declarations are set up before code runs: function declarations completely, var as undefined, let/const/class as uninitialised (TDZ). (Module 6)
</details>

<details>
<summary>How is this determined?</summary>

By how a regular function is called: new → the new object; call/apply/bind → the given object; obj.method() → obj; a plain call → undefined in strict mode. Arrow functions have no this of their own and use the surrounding one. (Module 8)
</details>

<details>
<summary>Explain the event loop.</summary>

One thread runs the call stack. When it's empty, all queued microtasks (promise callbacks) run, then the browser may render, then one task (timer, event) runs, and the cycle repeats. That's why a resolved promise's callback runs before a 0 ms setTimeout. (Module 10)
</details>

<details>
<summary>Promise.all vs Promise.allSettled?</summary>

all resolves with every value in order, or rejects as soon as one fails; allSettled waits for all and reports each one's status and value or reason. (Module 10)
</details>

<details>
<summary>Debounce vs throttle?</summary>

Debounce runs once after the calls stop for a while (search input); throttle runs at most once per interval during continuous calls (scroll). (Module 12)
</details>

<details>
<summary>What is event delegation?</summary>

One listener on a parent handles events from its children via bubbling, using event.target. Fewer listeners, and it works for elements added later. (Module 9)
</details>

<details>
<summary>Shallow vs deep copy?</summary>

A shallow copy (spread, Object.assign) copies top-level properties, sharing nested objects; a deep copy (structuredClone) copies every level. (Module 7)
</details>

<details>
<summary>What is the prototype chain?</summary>

The chain of linked objects JavaScript searches when a property isn't on an object itself, ending at Object.prototype and null. It's how inheritance and built-in methods work; classes are built on it. (Module 8)
</details>

<!-- subtopic: f28_s3 -->
### TypeScript rapid-fire

<details>
<summary>interface vs type?</summary>

Both describe object shapes; interfaces can be extended and merged, types can also express unions, tuples, primitives and mapped/conditional types. Pick one style and be consistent. (Module 13)
</details>

<details>
<summary>any vs unknown vs never?</summary>

any switches type checking off; unknown accepts anything but must be narrowed before use; never is a value that can't exist (always-throwing functions, exhaustive checks). (Module 13)
</details>

<details>
<summary>What are generics for?</summary>

Writing reusable code that keeps types linked: `first<T>(items: T[]): T` returns the same type it received, instead of losing it to any. (Module 14)
</details>

<details>
<summary>Name four utility types and their use.</summary>

Partial (all optional: update payloads), Omit (drop fields: create payloads without id), Pick (choose fields), Record (an object type with given keys and values). (Module 14)
</details>

<details>
<summary>What is a discriminated union?</summary>

A union of object types sharing a literal tag (like `status`), so checking the tag narrows to one shape. Ideal for request states and reducer actions. (Module 14)
</details>

<details>
<summary>Do TypeScript types exist at runtime?</summary>

No, they're erased when compiling, so API responses must be validated at runtime (for example with Zod) if you can't trust them. (Module 13)
</details>

<!-- subtopic: f28_s4 -->
### React rapid-fire

<details>
<summary>State vs props?</summary>

Props are inputs from the parent and read-only; state belongs to the component and changes with its setter, triggering a re-render. (Modules 15, 16)
</details>

<details>
<summary>Why do list items need keys, and why not the index?</summary>

Keys let React match items between renders to move, insert or remove them correctly and keep their state. The index changes when the list reorders, so state ends up on the wrong items. (Modules 15, 22)
</details>

<details>
<summary>Why must state be updated immutably?</summary>

React compares references to detect changes; mutating keeps the same reference, so the component may not re-render, and memoisation breaks. (Module 16)
</details>

<details>
<summary>Controlled vs uncontrolled components?</summary>

Controlled inputs take their value from state and change through onChange; uncontrolled ones keep their value in the DOM, read with a ref or FormData. (Module 16)
</details>

<details>
<summary>When does useEffect run, and what is its cleanup for?</summary>

After the render is committed, depending on its dependency array (every render, once, or when dependencies change). The cleanup runs before the next run and on unmount, to clear timers, listeners and requests. (Module 17)
</details>

<details>
<summary>What are the rules of hooks, and why?</summary>

Call hooks only at the top level and only from components or custom hooks, because React identifies each hook by its call order. (Module 18)
</details>

<details>
<summary>useMemo vs useCallback vs React.memo?</summary>

useMemo caches a computed value, useCallback caches a function, React.memo skips re-rendering a component whose props are shallowly equal. Use them where profiling shows a need. (Modules 18, 21)
</details>

<details>
<summary>What causes a component to re-render?</summary>

Its state changing, its parent re-rendering, or a context it uses changing. (Module 21)
</details>

<details>
<summary>What is reconciliation?</summary>

React comparing the new element tree with the previous one, using element types and keys, to compute the minimal DOM updates. (Module 22)
</details>

<details>
<summary>Context vs Redux/Zustand?</summary>

Context passes data down without prop drilling but re-renders every consumer on change; a store with selectors re-renders only components whose selected data changed and adds tooling for complex global state. Server data belongs in TanStack Query. (Modules 18, 19)
</details>

<details>
<summary>CSR vs SSR?</summary>

CSR builds the page in the browser with JavaScript (simple, slower first paint, weaker SEO); SSR sends ready HTML from the server per request and hydrates it (fast first paint, good SEO, more server work). (Module 22)
</details>

<!-- subtopic: f28_s5 -->
### Browser, performance and security rapid-fire

<details>
<summary>What happens when you type a URL and press Enter?</summary>

DNS lookup, TCP and TLS handshakes, the HTTP request, the response; then the browser parses HTML into the DOM and CSS into the CSSOM, builds the render tree, does layout and paint, and runs JavaScript. (Module 1)
</details>

<details>
<summary>What are the Core Web Vitals?</summary>

LCP (main content loads, ≤ 2.5 s), INP (responsiveness to input, ≤ 200 ms) and CLS (layout stability, ≤ 0.1). (Module 24)
</details>

<details>
<summary>Name five ways to make a page load faster.</summary>

Optimised and lazy-loaded images, code splitting and smaller bundles, long-term caching with hashed filenames and a CDN, defer for scripts, and preconnect/preload for critical resources. (Modules 21, 24)
</details>

<details>
<summary>What is XSS and how do you prevent it?</summary>

Injecting attacker scripts into a page. Prevent it by rendering user content as text (React's default), sanitising any HTML with DOMPurify, validating URLs, and adding a Content Security Policy. (Module 25)
</details>

<details>
<summary>What is CSRF, and why are Bearer-token APIs not affected?</summary>

A malicious site making a logged-in user's browser send a request with their cookies. Bearer tokens are added by your code, never automatically by the browser, so forged requests don't carry them. Cookie-based apps use SameSite and CSRF tokens. (Module 25)
</details>

<details>
<summary>localStorage or cookies for auth tokens?</summary>

localStorage is simple but readable by any XSS; HttpOnly cookies can't be read by JavaScript but need CSRF protection. A strong setup: a short-lived access token in memory and a refresh token in an HttpOnly, Secure, SameSite cookie. (Module 25)
</details>

<details>
<summary>What is CORS, and what's a preflight?</summary>

The browser mechanism that lets a server allow pages from other origins to read its responses. A preflight is the OPTIONS request the browser sends first for non-simple requests (JSON, PUT/DELETE, Authorization headers). (Modules 20, 25)
</details>

<details>
<summary>How do you make a custom dropdown accessible?</summary>

Prefer a native select. Otherwise: a button with aria-expanded, a listbox with options, keyboard support (arrows, Enter, Escape), visible focus, and focus returning to the button on close; or use a library like Radix or React Aria. (Module 24)
</details>

<!-- subtopic: f28_s6 -->
### Your frontend project story, portfolio and final checklist

Interviewers will ask "tell me about a project". Have the **fullstack Task Manager** ready: Spring Boot API (from the Beginner project days) + the React frontend (Module 20).

**A 2-minute project story** (STAR, from the behavioral prep days):

1. **What it is**: "A task manager with login, where users create, filter and track tasks. Spring Boot and PostgreSQL on the backend, React with TypeScript on the frontend."
2. **Your architecture**: REST API with JWT auth, React Router, TanStack Query for server state, React Hook Form + Zod, deployed on Vercel + a cloud host.
3. **One hard problem you solved**: "Search results arrived out of order; I fixed the race condition with AbortController and debouncing." Or CORS with Spring Security, or token expiry handling.
4. **A trade-off you made**: "I kept the token in localStorage for simplicity, and I know the XSS risk; the next step is an HttpOnly refresh cookie."
5. **Results and what's next**: tests (Vitest + RTL + one Playwright flow), Lighthouse scores, what you'd build next.

**Portfolio checklist:**

- [ ] Live links for the frontend and the API, and a public GitHub repo with a clear README (screenshots, how to run it, the tech stack).
- [ ] Loading, empty and error states everywhere; works on a phone.
- [ ] Lighthouse: good Performance and 90+ Accessibility.
- [ ] A few meaningful tests, and CI (GitHub Actions) running them.
- [ ] Clean commits and no secrets in the repo.
- [ ] One or two small extras built from scratch (a debounced search, an accessible modal): perfect for machine-coding talk.

**Final interview checklist:**

- [ ] Explain the event loop, closures, `this`, and promises out loud, with examples (Modules 6, 8, 10).
- [ ] Write debounce, throttle, `Promise.all` and a deep clone from memory (Module 12).
- [ ] Explain re-renders, keys, effects and hooks rules (Modules 16–18, 21).
- [ ] Build a todo app and a debounced search in under an hour (Module 27).
- [ ] Walk through a frontend system design with RADIO (Module 26).
- [ ] Explain CORS, JWT storage, XSS and CSRF (Modules 20, 25).
- [ ] Your project story, timed at two minutes.

You've gone from your first HTML page to designing frontend systems. Combined with the Java and Spring side, that's genuinely fullstack. 🎉

<details>
<summary>What makes a project story stand out in an interview?</summary>

A specific hard problem and how you solved it, a trade-off you made consciously (and what you'd change), and concrete evidence like tests, performance numbers or a live link. Interviewers remember a clear technical story more than a list of tools.
</details>

## 📝 Module 28 Recap

1. Your go-to project for interviews? → **the fullstack Task Manager: Spring Boot API + React frontend**
2. What should a project story include? → **what it is, the architecture, a hard problem, a trade-off, results**
3. Four JavaScript things to explain out loud? → **event loop, closures, this, promises**
4. Four utilities to write from memory? → **debounce, throttle, Promise.all, deep clone**
5. Two machine-coding builds to practise? → **a todo app and a debounced search**
6. Frontend system design structure? → **RADIO**
7. Four security topics to explain? → **CORS, JWT storage, XSS, CSRF**
