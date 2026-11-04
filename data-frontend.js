// ============================================================
// Java Fullstack — Frontend curriculum (shared by both tracks)
//
// 28 modules from web basics to React internals and frontend interview prep, plus a guided React project (module 29). Notes live in
// notes/frontend/module-NN.md, one <!-- subtopic: fN_sM --> section per subtopic.
// - Beginner track: each module's subtopics are spread over the Beginner days in `days`, as a "Frontend" topic
//   next to that day's Java and DSA (data-beginner.js adds them).
// - Interview track: the modules are a separate Frontend section, not part of the 60 days.
// `practice` lists the module's exercises (practice/frontend/module-NN.md). The Beginner track shows them on the
// module's last day; the module page shows them in both tracks.
// Ids are permanent progress keys: keep them when a subtopic moves to another module.
// ============================================================

const FRONTEND_LEVELS = [
  { name: "HTML & CSS", icon: "🧱", blurb: "Just the essentials: how pages are built, styled and laid out" },
  { name: "JavaScript", icon: "🟨", blurb: "The language of the browser, from the basics to the interview classics" },
  { name: "TypeScript", icon: "🔷", blurb: "JavaScript with types, the way most teams write it today" },
  { name: "React", icon: "⚛️", blurb: "Components, state and hooks, up to how React works inside" },
  { name: "Frontend engineering", icon: "🛠️", blurb: "Testing, performance, accessibility and security" },
  { name: "Interview prep", icon: "🎯", blurb: "Frontend system design, machine coding rounds and rapid-fire questions" }
];

const FRONTEND_DATA = [
  // ===================== HTML & CSS =====================
  { module: 1, level: 0, title: "How the Web Works for Frontend", days: [13, 14], subtopics: [
    ["f1_s1", "Frontend vs backend: the browser shows the page, your Spring Boot server sends the data"],
    ["f1_s2", "HTML, CSS and JavaScript: structure, looks and behaviour, and how they work together"],
    ["f1_s3", "What happens when you open a page: HTML → DOM, CSS → CSSOM, layout, paint"],
    ["f1_s4", "Browser DevTools: Elements, Console, Network and Sources tabs"],
    ["f1_s5", "Set up: VS Code, the Live Server extension and your first index.html"]
  ] },
  { module: 2, level: 0, title: "HTML Essentials", days: [15, 16, 17], subtopics: [
    ["f2_s1", "Document structure: doctype, html, head, body, and the meta tags every page needs"],
    ["f2_s2", "Text, links and images: headings, paragraphs, a, img (with alt) and lists"],
    ["f2_s3", "Semantic HTML: header, nav, main, section, article, footer, and why div soup is bad"],
    ["f2_s4", "Forms: input types, label, select, textarea, button, and built-in validation"],
    ["f2_s5", "Tables for tabular data only, and block vs inline elements"],
    ["f2_s6", "Accessibility basics: alt text, labels, headings in order, buttons vs links, ARIA only when needed"]
  ] },
  { module: 3, level: 0, title: "CSS Essentials", days: [18, 19, 20], subtopics: [
    ["f3_s1", "Adding CSS (inline, internal, external) and the syntax: selector { property: value }"],
    ["f3_s2", "Selectors: element, class, id, attribute, descendant, pseudo-classes (:hover, :focus, :nth-child)"],
    ["f3_s3", "The cascade and specificity: which rule wins, and why !important is a last resort"],
    ["f3_s4", "The box model: content, padding, border, margin, and box-sizing: border-box"],
    ["f3_s5", "Units and colours: px, %, rem, em, vw/vh; hex, rgb, hsl; fonts and text styling"],
    ["f3_s6", "display and position: block, inline, none; static, relative, absolute, fixed, sticky; z-index"]
  ] },
  { module: 4, level: 0, title: "CSS Layout and Responsive Design", days: [21, 22, 23], subtopics: [
    ["f4_s1", "Flexbox: main and cross axis, justify-content, align-items, gap, flex-wrap, flex: 1"],
    ["f4_s2", "CSS Grid: grid-template-columns, fr units, repeat(), gap, placing items, grid areas"],
    ["f4_s3", "Flexbox or Grid? One dimension vs two, with common layouts (navbar, card grid, holy grail)"],
    ["f4_s4", "Responsive design: the viewport meta tag, mobile-first media queries, fluid images"],
    ["f4_s5", "CSS variables, transitions and simple animations"],
    ["f4_s6", "How teams write CSS today: Tailwind, CSS Modules, Sass, and component libraries"]
  ] },

  // ===================== JAVASCRIPT =====================
  { module: 5, level: 1, title: "JavaScript Basics", days: [24, 25, 26], practice: ["f5_e1", "f5_e2", "f5_e3"], subtopics: [
    ["f5_s1", "What JavaScript is, where it runs (browser and Node.js), and how it differs from Java"],
    ["f5_s2", "Variables: let, const and why to avoid var; naming and template literals"],
    ["f5_s3", "Types: the 7 primitives and objects, typeof, and dynamic typing"],
    ["f5_s4", "Operators, == vs ===, and truthy and falsy values"],
    ["f5_s5", "Control flow: if, switch, for, while, for...of and for...in"],
    ["f5_s6", "Strings and numbers: common methods, NaN, and the 0.1 + 0.2 surprise"]
  ] },
  { module: 6, level: 1, title: "Functions, Scope and Closures", days: [27, 28, 29], practice: ["f6_e1", "f6_e2", "f6_e3"], subtopics: [
    ["f6_s1", "Function declarations, function expressions and arrow functions"],
    ["f6_s2", "Parameters: default values, rest parameters and the arguments object"],
    ["f6_s3", "Scope: global, function and block scope, and the scope chain"],
    ["f6_s4", "Hoisting and the temporal dead zone"],
    ["f6_s5", "Closures: functions that remember their variables, with real uses (counters, private state)"],
    ["f6_s6", "Higher-order functions and callbacks: functions as values"]
  ] },
  { module: 7, level: 1, title: "Arrays, Objects and Modern Syntax", days: [30, 31, 32], practice: ["f7_e1", "f7_e2", "f7_e3"], subtopics: [
    ["f7_s1", "Arrays: push, pop, slice, splice, indexOf, includes, and which methods change the array"],
    ["f7_s2", "Array methods: map, filter, reduce, find, some, every, sort (and the sort gotcha)"],
    ["f7_s3", "Objects: properties, methods, shorthand, computed keys, Object.keys/values/entries"],
    ["f7_s4", "Destructuring, spread and rest for arrays and objects"],
    ["f7_s5", "Optional chaining (?.) and nullish coalescing (??)"],
    ["f7_s6", "Map, Set and JSON: JSON.stringify and JSON.parse"],
    ["f7_s7", "References and copies: shallow vs deep copy, structuredClone, and immutability"]
  ] },
  { module: 8, level: 1, title: "this, Prototypes and Classes", days: [33, 34, 35], practice: ["f8_e1", "f8_e2"], subtopics: [
    ["f8_s1", "How this is decided: the call site, methods, plain calls, new, and arrow functions"],
    ["f8_s2", "call, apply and bind"],
    ["f8_s3", "Prototypes and the prototype chain: how JavaScript objects inherit"],
    ["f8_s4", "Classes: constructor, methods, extends, super, static, and how they map to prototypes"],
    ["f8_s5", "Getters, setters and private fields (#), compared with Java classes"]
  ] },
  { module: 9, level: 1, title: "The DOM and Events", days: [36, 37, 38], practice: ["f9_e1", "f9_e2"], subtopics: [
    ["f9_s1", "The DOM tree: querySelector, querySelectorAll, and walking the tree"],
    ["f9_s2", "Changing the page: textContent vs innerHTML, classList, attributes, styles"],
    ["f9_s3", "Creating, adding and removing elements"],
    ["f9_s4", "Events: addEventListener, the event object, preventDefault"],
    ["f9_s5", "Bubbling, capturing and event delegation"],
    ["f9_s6", "Forms in JavaScript, and saving data with localStorage and sessionStorage"]
  ] },
  { module: 10, level: 1, title: "Asynchronous JavaScript", days: [39, 40, 41], practice: ["f10_e1", "f10_e2", "f10_e3"], subtopics: [
    ["f10_s1", "Why async: one thread, and not blocking the page"],
    ["f10_s2", "The event loop: call stack, task queue and microtask queue"],
    ["f10_s3", "Callbacks and callback hell"],
    ["f10_s4", "Promises: states, then, catch, finally, and chaining"],
    ["f10_s5", "async/await and error handling with try/catch"],
    ["f10_s6", "fetch: calling a REST API, JSON, status codes, and AbortController"],
    ["f10_s7", "Promise.all, allSettled, race and any"]
  ] },
  { module: 11, level: 1, title: "Modules, npm and Tooling", days: [42, 43], subtopics: [
    ["f11_s1", "ES modules: import and export (named and default)"],
    ["f11_s2", "Node.js and npm: package.json, dependencies, scripts, and the lock file"],
    ["f11_s3", "Bundlers and dev servers: what Vite does, and why we build for production"],
    ["f11_s4", "ESLint and Prettier: catching mistakes and keeping code formatted"],
    ["f11_s5", "Environment variables in frontend apps, and what must never go in them"]
  ] },
  { module: 12, level: 1, title: "JavaScript Interview Deep Dive", days: [44, 45, 46], practice: ["f12_e1", "f12_e2", "f12_e3", "f12_e4"], subtopics: [
    ["f12_s1", "Type coercion puzzles and how == really works"],
    ["f12_s2", "Closures in loops, var vs let, and other classic output questions"],
    ["f12_s3", "Event loop output questions: setTimeout vs Promise vs async"],
    ["f12_s4", "Write debounce and throttle from scratch"],
    ["f12_s5", "Write deep clone, flatten, curry and memoize"],
    ["f12_s6", "Polyfills: map, filter, reduce, bind and Promise.all"],
    ["f12_s7", "Iterators, generators, Symbol, WeakMap and garbage collection basics"]
  ] },

  // ===================== TYPESCRIPT =====================
  { module: 13, level: 2, title: "TypeScript Basics", days: [47, 48, 49], subtopics: [
    ["f13_s1", "Why TypeScript: types for JavaScript, checked before the code runs; setting up tsc and Vite"],
    ["f13_s2", "Basic types: string, number, boolean, arrays, tuples, and type inference"],
    ["f13_s3", "Typing functions: parameters, return types, optional and default parameters"],
    ["f13_s4", "Object types: interface vs type alias, optional and readonly properties"],
    ["f13_s5", "Union and literal types, and narrowing with typeof, in and instanceof"],
    ["f13_s6", "any vs unknown vs never, and why strict mode matters"]
  ] },
  { module: 14, level: 2, title: "TypeScript Advanced", days: [50, 51, 52], subtopics: [
    ["f14_s1", "Generics: generic functions, interfaces and constraints (extends)"],
    ["f14_s2", "keyof, typeof and indexed access types"],
    ["f14_s3", "Utility types: Partial, Required, Pick, Omit, Record, ReturnType"],
    ["f14_s4", "Discriminated unions and exhaustive checks with never"],
    ["f14_s5", "Mapped and conditional types, and infer"],
    ["f14_s6", "Enums vs union types, declaration files and @types packages, tsconfig essentials"]
  ] },

  // ===================== REACT =====================
  { module: 15, level: 3, title: "React Fundamentals", days: [53, 54, 55], subtopics: [
    ["f15_s1", "Why React: components and declarative UI; create a project with Vite"],
    ["f15_s2", "JSX: expressions in braces, className, one parent element, fragments"],
    ["f15_s3", "Components and props: passing data down, children, and keeping components pure"],
    ["f15_s4", "Rendering lists with map, and why keys matter"],
    ["f15_s5", "Conditional rendering: &&, the ternary, and early returns"],
    ["f15_s6", "Styling React components: CSS files, CSS Modules and Tailwind"]
  ] },
  { module: 16, level: 3, title: "State and Events", days: [56, 57, 58], subtopics: [
    ["f16_s1", "useState: state vs props, and why a plain variable doesn't re-render"],
    ["f16_s2", "Handling events in React"],
    ["f16_s3", "Updating objects and arrays without mutating them; functional updates"],
    ["f16_s4", "Lifting state up and one-way data flow"],
    ["f16_s5", "Forms: controlled vs uncontrolled inputs"],
    ["f16_s6", "Derived state: compute it during rendering instead of storing it"]
  ] },
  { module: 17, level: 3, title: "Effects and Data Fetching", days: [59, 60, 61], subtopics: [
    ["f17_s1", "useEffect: when it runs, the dependency array, and cleanup"],
    ["f17_s2", "Fetching data: loading, error and empty states"],
    ["f17_s3", "Race conditions and cancelling requests"],
    ["f17_s4", "StrictMode: why effects run twice in development"],
    ["f17_s5", "You might not need an effect: common mistakes"],
    ["f17_s6", "useRef: DOM access and values that don't trigger a render"]
  ] },
  { module: 18, level: 3, title: "Hooks in Depth", days: [62, 63, 64], subtopics: [
    ["f18_s1", "The rules of hooks, and why they exist"],
    ["f18_s2", "useReducer for complex state"],
    ["f18_s3", "useContext: sharing data without prop drilling"],
    ["f18_s4", "useMemo and useCallback: what they cache and when they help"],
    ["f18_s5", "Custom hooks: useFetch, useLocalStorage, useDebounce"],
    ["f18_s6", "useLayoutEffect, useId, useTransition and useDeferredValue"]
  ] },
  { module: 19, level: 3, title: "Routing and State Management", days: [65, 66, 67], subtopics: [
    ["f19_s1", "React Router: routes, links, URL params, nested routes and layouts"],
    ["f19_s2", "Navigating in code, protected routes, and 404 pages"],
    ["f19_s3", "Where state should live: local, lifted, context, URL, or server"],
    ["f19_s4", "Redux Toolkit: store, slices and actions"],
    ["f19_s5", "Zustand: a simpler global store"],
    ["f19_s6", "Server state with TanStack Query: caching, refetching and mutations"]
  ] },
  { module: 20, level: 3, title: "React with a Spring Boot API", days: [68, 69, 70], subtopics: [
    ["f20_s1", "Project structure for a real React app"],
    ["f20_s2", "Calling your Spring Boot REST API with fetch or axios"],
    ["f20_s3", "CORS: the Vite dev proxy, and @CrossOrigin / CorsConfiguration in Spring"],
    ["f20_s4", "Login with JWT: storing the token, the Authorization header, logout and expiry"],
    ["f20_s5", "Forms with validation: React Hook Form and Zod, and showing server errors"],
    ["f20_s6", "Build and deploy: frontend on Vercel or Netlify, backend separately, environment config"]
  ] },
  { module: 21, level: 3, title: "React Performance", days: [71, 72, 73], subtopics: [
    ["f21_s1", "How React renders: render phase vs commit phase, and what triggers a re-render"],
    ["f21_s2", "React.memo, useMemo and useCallback: avoiding wasted renders"],
    ["f21_s3", "Keys and component identity: when React keeps or resets state"],
    ["f21_s4", "Code splitting with lazy and Suspense"],
    ["f21_s5", "Long lists: virtualization"],
    ["f21_s6", "Finding slow components with the React DevTools Profiler"]
  ] },
  { module: 22, level: 3, title: "React Internals and Modern React", days: [74, 75, 76], subtopics: [
    ["f22_s1", "The virtual DOM and reconciliation: how React diffs"],
    ["f22_s2", "Fiber, batching and concurrent rendering"],
    ["f22_s3", "Suspense and error boundaries"],
    ["f22_s4", "CSR, SSR, SSG and hydration"],
    ["f22_s5", "Next.js and React Server Components: an overview"],
    ["f22_s6", "What's new in React 19: Actions, use, useOptimistic, and the React Compiler"]
  ] },

  // A guided project across the React days: one step per day, ending in the full-stack Task Manager
  { module: 29, level: 3, title: "Project: Build the Task Manager UI", days: [55, 58, 61, 64, 66, 67, 69, 70, 73, 76], subtopics: [
    ["f29_s1", "Step 1: set up the project and build the task list from components and props"],
    ["f29_s2", "Step 2: make it interactive: add, update, delete and filter tasks with state"],
    ["f29_s3", "Step 3: load and save through a fake API, with loading, error and empty states"],
    ["f29_s4", "Step 4: move the logic into custom hooks, add search with debounce and a dark mode context"],
    ["f29_s5", "Step 5: add pages with React Router: projects, a project's tasks, task details"],
    ["f29_s6", "Step 6: replace the hand-written fetching with TanStack Query"],
    ["f29_s7", "Step 7: connect to your Spring Boot API: sign up, log in with JWT, protected routes"],
    ["f29_s8", "Step 8: forms with React Hook Form and Zod, server errors, and session expiry"],
    ["f29_s9", "Step 9: polish: pagination, skeletons, an error boundary, lazy routes and an accessibility pass"],
    ["f29_s10", "Step 10: test it with Vitest, Testing Library and MSW, then deploy both halves"]
  ] },

  // ===================== FRONTEND ENGINEERING =====================
  { module: 23, level: 4, title: "Testing Frontend Code", days: [77, 78, 79], subtopics: [
    ["f23_s1", "The testing pyramid for frontend: unit, component, end-to-end"],
    ["f23_s2", "Vitest (or Jest) for plain functions"],
    ["f23_s3", "React Testing Library: queries, user-event, and testing behaviour not implementation"],
    ["f23_s4", "Mocking API calls with MSW"],
    ["f23_s5", "End-to-end tests with Playwright or Cypress"]
  ] },
  { module: 24, level: 4, title: "Web Performance and Accessibility", days: [80, 81, 82], subtopics: [
    ["f24_s1", "Core Web Vitals: LCP, INP and CLS, and how to measure them with Lighthouse"],
    ["f24_s2", "Loading faster: images, lazy loading, smaller bundles, caching and CDNs"],
    ["f24_s3", "The critical rendering path: render-blocking CSS and JS, defer and async"],
    ["f24_s4", "Accessibility in practice: keyboard navigation, focus management, contrast, screen readers"],
    ["f24_s5", "ARIA roles and attributes: when you need them, and when semantic HTML is enough"]
  ] },
  { module: 25, level: 4, title: "Web Security and Browser APIs", days: [83, 84, 85], subtopics: [
    ["f25_s1", "XSS: how it happens, why React escapes by default, and dangerouslySetInnerHTML"],
    ["f25_s2", "CSRF and SameSite cookies"],
    ["f25_s3", "Where to keep tokens: localStorage vs HttpOnly cookies"],
    ["f25_s4", "CORS in depth: simple and preflight requests, credentials"],
    ["f25_s5", "Content Security Policy and HTTPS"],
    ["f25_s6", "Browser APIs: storage, cookies, IndexedDB, service workers and PWAs, web workers"]
  ] },

  // ===================== INTERVIEW PREP =====================
  { module: 26, level: 5, title: "Frontend System Design", days: [86, 87, 88, 89], subtopics: [
    ["f26_s1", "How to approach a frontend system design round: a step-by-step framework"],
    ["f26_s2", "Component design, data model, API and state for a UI"],
    ["f26_s3", "Design an autocomplete / typeahead"],
    ["f26_s4", "Design a news feed with infinite scroll"],
    ["f26_s5", "Rendering and data strategies: pagination, caching, optimistic updates, offline"],
    ["f26_s6", "Cross-cutting concerns: performance, accessibility, i18n, security"]
  ] },
  { module: 27, level: 5, title: "Machine Coding Round", days: [90, 91, 92, 93], practice: ["f27_e1", "f27_e2"], subtopics: [
    ["f27_s1", "What a machine coding round looks like and how to plan your 60–90 minutes"],
    ["f27_s2", "Build: a todo app with filters and localStorage"],
    ["f27_s3", "Build: a search box with debounce and keyboard navigation"],
    ["f27_s4", "Build: tabs, accordion, modal and star rating components"],
    ["f27_s5", "Build: pagination and infinite scroll over an API"],
    ["f27_s6", "Build: a form with validation, and a progress bar / timer"]
  ] },
  { module: 28, level: 5, title: "Frontend Interview Questions", days: [94, 95, 96, 97], subtopics: [
    ["f28_s1", "HTML and CSS rapid-fire"],
    ["f28_s2", "JavaScript rapid-fire"],
    ["f28_s3", "TypeScript rapid-fire"],
    ["f28_s4", "React rapid-fire"],
    ["f28_s5", "Browser, performance and security rapid-fire"],
    ["f28_s6", "Your frontend project story, portfolio and final checklist"]
  ] }
];
